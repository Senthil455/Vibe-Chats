import { Router } from 'express';
import {
  getChats, getOrCreatePrivateChat, getChat, clearChat, getChatMessages,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getChats));
router.post('/private', asyncHandler(getOrCreatePrivateChat));
router.get('/:chatId', asyncHandler(getChat));
router.delete('/:chatId/clear', asyncHandler(clearChat));
router.get('/:chatId/messages', asyncHandler(getChatMessages));

export default router;
