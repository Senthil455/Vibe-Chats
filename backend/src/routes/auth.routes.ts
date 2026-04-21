import { Router } from 'express';
import {
  register, login, logout, refreshToken,
  verifyEmail, resendOTP, forgotPassword, resetPassword, getMe,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', authLimiter, asyncHandler(register));
router.post('/login', authLimiter, asyncHandler(login));
router.post('/logout', authenticate, asyncHandler(logout));
router.post('/refresh', asyncHandler(refreshToken));
router.post('/verify-email', authenticate, otpLimiter, asyncHandler(verifyEmail));
router.post('/resend-otp', authenticate, otpLimiter, asyncHandler(resendOTP));
router.post('/forgot-password', authLimiter, asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));
router.get('/me', authenticate, asyncHandler(getMe));

export default router;
