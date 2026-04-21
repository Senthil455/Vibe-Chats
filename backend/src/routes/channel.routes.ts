import { Router } from 'express';
import {
  createChannel, searchChannels, getMyChannels,
  getChannel, subscribe, unsubscribe,
  createPost, getPosts, getAnalytics,
} from '../controllers/channel.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../config/cloudinary';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.post('/', upload.single('profilePicture'), asyncHandler(createChannel));
router.get('/search', asyncHandler(searchChannels));
router.get('/my', asyncHandler(getMyChannels));
router.get('/:channelId', asyncHandler(getChannel));
router.post('/:channelId/subscribe', asyncHandler(subscribe));
router.delete('/:channelId/subscribe', asyncHandler(unsubscribe));
router.post('/:channelId/posts', upload.single('file'), asyncHandler(createPost));
router.get('/:channelId/posts', asyncHandler(getPosts));
router.get('/:channelId/analytics', asyncHandler(getAnalytics));

export default router;
