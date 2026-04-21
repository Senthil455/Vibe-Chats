import { Response } from 'express';
import { Notification } from '../models/notification.model';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/notifications
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = 1, limit = 20 } = req.query;
  const notifications = await Notification.find({ recipient: req.user!._id })
    .populate('sender', 'username profilePicture')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const unreadCount = await Notification.countDocuments({
    recipient: req.user!._id,
    isRead: false,
  });

  res.json({ notifications, unreadCount });
};

// PUT /api/notifications/read-all
export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.updateMany({ recipient: req.user!._id, isRead: false }, { isRead: true });
  res.json({ message: 'All notifications marked as read' });
};

// PUT /api/notifications/:id/read
export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user!._id },
    { isRead: true }
  );
  res.json({ message: 'Notification marked as read' });
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user!._id });
  res.json({ message: 'Notification deleted' });
};
