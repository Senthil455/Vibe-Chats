import { Router } from 'express';
import {
  getNotifications, markAllRead, markRead, deleteNotification,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(getNotifications));
router.put('/read-all', asyncHandler(markAllRead));
router.put('/:id/read', asyncHandler(markRead));
router.delete('/:id', asyncHandler(deleteNotification));

export default router;
