import { Router } from 'express';
import {
  searchUsers, getUserProfile, updateProfile, updatePrivacy,
  blockUser, unblockUser, addContact, getContacts,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../config/cloudinary';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/search', asyncHandler(searchUsers));
router.get('/contacts', asyncHandler(getContacts));
router.get('/:userId', asyncHandler(getUserProfile));
router.put('/profile', upload.single('profilePicture'), asyncHandler(updateProfile));
router.put('/privacy', asyncHandler(updatePrivacy));
router.post('/block/:userId', asyncHandler(blockUser));
router.delete('/block/:userId', asyncHandler(unblockUser));
router.post('/contacts/:userId', asyncHandler(addContact));

export default router;
