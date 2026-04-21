import { Response } from 'express';
import { User } from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { deleteFromCloudinary } from '../config/cloudinary';
import { getOnlineStatus, getLastSeen } from '../config/redis';

// GET /api/users/search?q=
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    res.json({ users: [] });
    return;
  }

  const users = await User.find({
    $and: [
      { _id: { $ne: req.user!._id } },
      {
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      },
    ],
  })
    .select('username email profilePicture bio')
    .limit(20);

  res.json({ users });
};

// GET /api/users/:userId
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const requesterId = req.user!._id;

  const user = await User.findById(userId).select(
    'username email profilePicture bio privacy createdAt'
  );
  if (!user) throw new AppError('User not found', 404);

  const isOnline = await getOnlineStatus(userId);
  const lastSeen = await getLastSeen(userId);

  // Apply privacy settings
  const profile: any = {
    _id: user._id,
    username: user.username,
    profilePicture:
      user.privacy.profilePhotoVisibility === 'everyone' ? user.profilePicture : undefined,
    bio: user.bio,
  };

  if (userId === requesterId || user.privacy.lastSeenVisibility === 'everyone') {
    profile.isOnline = isOnline;
    profile.lastSeen = lastSeen;
  }

  res.json({ user: profile });
};

// PUT /api/users/profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { username, bio } = req.body;
  const userId = req.user!._id;

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  if (username && username !== user.username) {
    const exists = await User.findOne({ username });
    if (exists) throw new AppError('Username already taken', 409);
    user.username = username;
  }

  if (bio !== undefined) user.bio = bio;

  // Handle profile picture upload
  if (req.file) {
    if (user.profilePicturePublicId) {
      await deleteFromCloudinary(user.profilePicturePublicId);
    }
    user.profilePicture = (req.file as any).path;
    user.profilePicturePublicId = (req.file as any).filename;
  }

  await user.save();

  res.json({
    message: 'Profile updated',
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
    },
  });
};

// PUT /api/users/privacy
export const updatePrivacy = async (req: AuthRequest, res: Response): Promise<void> => {
  const { lastSeenVisibility, profilePhotoVisibility, readReceipts } = req.body;
  const user = await User.findById(req.user!._id);
  if (!user) throw new AppError('User not found', 404);

  if (lastSeenVisibility) user.privacy.lastSeenVisibility = lastSeenVisibility;
  if (profilePhotoVisibility) user.privacy.profilePhotoVisibility = profilePhotoVisibility;
  if (readReceipts !== undefined) user.privacy.readReceipts = readReceipts;

  await user.save();
  res.json({ message: 'Privacy settings updated', privacy: user.privacy });
};

// POST /api/users/block/:userId
export const blockUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const user = await User.findById(req.user!._id);
  if (!user) throw new AppError('User not found', 404);

  const targetId = (await User.findById(userId))?._id;
  if (!targetId) throw new AppError('Target user not found', 404);

  if (!user.blockedUsers.includes(targetId)) {
    user.blockedUsers.push(targetId);
    await user.save();
  }

  res.json({ message: 'User blocked' });
};

// DELETE /api/users/block/:userId
export const unblockUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const user = await User.findById(req.user!._id);
  if (!user) throw new AppError('User not found', 404);

  user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== userId);
  await user.save();

  res.json({ message: 'User unblocked' });
};

// POST /api/users/contacts/:userId
export const addContact = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const user = await User.findById(req.user!._id);
  if (!user) throw new AppError('User not found', 404);

  const contact = await User.findById(userId);
  if (!contact) throw new AppError('User not found', 404);

  if (!user.contacts.some((c) => c.toString() === userId)) {
    user.contacts.push(contact._id);
    await user.save();
  }

  res.json({ message: 'Contact added' });
};

// GET /api/users/contacts
export const getContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!._id).populate(
    'contacts',
    'username profilePicture bio'
  );
  if (!user) throw new AppError('User not found', 404);
  res.json({ contacts: user.contacts });
};
