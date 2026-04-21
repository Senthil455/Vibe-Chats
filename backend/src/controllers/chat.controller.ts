import { Response } from 'express';
import mongoose from 'mongoose';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { User } from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { getOnlineStatus, getLastSeen } from '../config/redis';

// GET /api/chats — get all chats for current user
export const getChats = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.user!._id);

  const chats = await Chat.find({ participants: userId })
    .populate('participants', 'username profilePicture bio privacy')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'username' },
    })
    .populate('group', 'name profilePicture members')
    .sort({ lastActivity: -1 });

  // Enrich with online status
  const enriched = await Promise.all(
    chats.map(async (chat) => {
      const chatObj = chat.toObject() as any;
      if (chat.type === 'private') {
        const other = chat.participants.find(
          (p: any) => p._id.toString() !== req.user!._id
        ) as any;
        if (other) {
          chatObj.isOnline = await getOnlineStatus(other._id.toString());
          chatObj.lastSeen = await getLastSeen(other._id.toString());
        }
      }
      return chatObj;
    })
  );

  res.json({ chats: enriched });
};

// POST /api/chats/private — create or get private chat
export const getOrCreatePrivateChat = async (req: AuthRequest, res: Response): Promise<void> => {
  const { targetUserId } = req.body;
  const userId = req.user!._id;

  if (targetUserId === userId) {
    throw new AppError('Cannot chat with yourself', 400);
  }

  const target = await User.findById(targetUserId);
  if (!target) throw new AppError('User not found', 404);

  // Check if blocked
  const blocker = await User.findOne({
    _id: { $in: [userId, targetUserId] },
    blockedUsers: { $in: [userId, targetUserId] },
  });
  if (blocker) throw new AppError('Unable to start chat', 403);

  // Find existing
  let chat = await Chat.findOne({
    type: 'private',
    participants: { $all: [userId, targetUserId], $size: 2 },
  })
    .populate('participants', 'username profilePicture bio')
    .populate('lastMessage');

  if (!chat) {
    chat = await Chat.create({
      type: 'private',
      participants: [userId, targetUserId],
    });
    chat = await chat.populate('participants', 'username profilePicture bio');
  }

  res.json({ chat });
};

// GET /api/chats/:chatId — get single chat
export const getChat = async (req: AuthRequest, res: Response): Promise<void> => {
  const { chatId } = req.params;
  const userId = req.user!._id;

  const chat = await Chat.findOne({ _id: chatId, participants: userId })
    .populate('participants', 'username profilePicture bio privacy')
    .populate('group', 'name profilePicture members description settings');

  if (!chat) throw new AppError('Chat not found', 404);
  res.json({ chat });
};

// DELETE /api/chats/:chatId — clear chat for user
export const clearChat = async (req: AuthRequest, res: Response): Promise<void> => {
  const { chatId } = req.params;
  const userId = req.user!._id;

  const chat = await Chat.findOne({ _id: chatId, participants: userId });
  if (!chat) throw new AppError('Chat not found', 404);

  // Mark all messages as deleted for this user
  await Message.updateMany(
    { chat: chatId, deletedFor: { $ne: userId } },
    { $push: { deletedFor: userId } }
  );

  res.json({ message: 'Chat cleared' });
};

// GET /api/chats/:chatId/messages — paginated messages
export const getChatMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const { chatId } = req.params;
  const userId = req.user!._id;
  const { page = 1, limit = 30 } = req.query;

  const chat = await Chat.findOne({ _id: chatId, participants: userId });
  if (!chat) throw new AppError('Chat not found', 404);

  const messages = await Message.find({
    chat: chatId,
    isDeleted: false,
    deletedFor: { $ne: userId },
  })
    .populate('sender', 'username profilePicture')
    .populate('replyTo', 'content sender type media')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ messages: messages.reverse(), page: Number(page), limit: Number(limit) });
};
