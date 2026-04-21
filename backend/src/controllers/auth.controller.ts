import { Request, Response } from 'express';
import { User } from '../models/user.model';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import {
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  storeOTP,
  verifyOTP,
} from '../config/redis';
import { sendOTPEmail, sendPasswordResetEmail } from '../utils/email';
import { generateOTP, generateResetToken } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, phone } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    throw new AppError('Email or username already taken', 409);
  }

  const user = await User.create({ username, email, password, phone });

  // Send OTP
  const otp = generateOTP();
  await storeOTP(email, otp);
  await sendOTPEmail(email, otp);

  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());
  await storeRefreshToken(user._id.toString(), refreshToken);

  res.status(201).json({
    message: 'Registration successful. Please verify your email.',
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      profilePicture: user.profilePicture,
      bio: user.bio,
    },
  });
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());
  await storeRefreshToken(user._id.toString(), refreshToken);

  res.json({
    message: 'Login successful',
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      profilePicture: user.profilePicture,
      bio: user.bio,
      privacy: user.privacy,
    },
  });
};

// POST /api/auth/refresh
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body;
  if (!token) throw new AppError('Refresh token required', 400);

  const decoded = verifyRefreshToken(token);
  const stored = await getRefreshToken(decoded.userId);
  if (!stored || stored !== token) {
    throw new AppError('Invalid refresh token', 401);
  }

  const newAccessToken = generateAccessToken(decoded.userId);
  const newRefreshToken = generateRefreshToken(decoded.userId);
  await storeRefreshToken(decoded.userId, newRefreshToken);

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
};

// POST /api/auth/logout
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user) {
    await deleteRefreshToken(req.user._id);
  }
  res.json({ message: 'Logged out successfully' });
};

// POST /api/auth/verify-email
export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  const { otp } = req.body;
  const userId = req.user!._id;

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const isValid = await verifyOTP(user.email, otp);
  if (!isValid) throw new AppError('Invalid or expired OTP', 400);

  user.isEmailVerified = true;
  await user.save();

  res.json({ message: 'Email verified successfully' });
};

// POST /api/auth/resend-otp
export const resendOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!._id);
  if (!user) throw new AppError('User not found', 404);
  if (user.isEmailVerified) throw new AppError('Email already verified', 400);

  const otp = generateOTP();
  await storeOTP(user.email, otp);
  await sendOTPEmail(user.email, otp);

  res.json({ message: 'OTP sent to your email' });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond success to prevent email enumeration
  if (user) {
    const resetToken = generateResetToken();
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    await storeOTP(`reset:${user._id}`, hashedToken);

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&id=${user._id}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  res.json({ message: 'If that email exists, a reset link has been sent.' });
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { userId, token, newPassword } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const isValid = await verifyOTP(`reset:${userId}`, hashedToken);
  if (!isValid) throw new AppError('Invalid or expired reset token', 400);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  user.password = newPassword;
  await user.save();

  await deleteRefreshToken(userId);

  res.json({ message: 'Password reset successful. Please log in.' });
};

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!._id)
    .populate('contacts', 'username profilePicture bio')
    .select('-password -blockedUsers');

  if (!user) throw new AppError('User not found', 404);
  res.json({ user });
};
