import { Router } from 'express';
import {
  sendMessage, editMessage, deleteMessage,
  reactToMessage, starMessage, getStarredMessages, searchMessages,
} from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../config/cloudinary';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.post('/', upload.single('file'), asyncHandler(sendMessage));
router.get('/starred', asyncHandler(getStarredMessages));
router.get('/search', asyncHandler(searchMessages));
router.put('/:messageId', asyncHandler(editMessage));
router.delete('/:messageId', asyncHandler(deleteMessage));
router.post('/:messageId/react', asyncHandler(reactToMessage));
router.post('/:messageId/star', asyncHandler(starMessage));

export default router;
