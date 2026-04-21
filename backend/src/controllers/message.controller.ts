import { Response } from 'express';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { getIo } from '../socket/index';

// POST /api/messages — send message
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { chatId, content, type = 'text', replyTo, isForwarded, forwardedFrom } = req.body;
  const userId = req.user!._id;

  const chat = await Chat.findOne({ _id: chatId, participants: userId });
  if (!chat) throw new AppError('Chat not found', 404);

  const messageData: any = {
    chat: chatId,
    sender: userId,
    type,
    content,
    replyTo,
    isForwarded: !!isForwarded,
    forwardedFrom,
  };

  // Handle file upload
  if (req.file) {
    messageData.media = {
      url: (req.file as any).path,
      publicId: (req.file as any).filename,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    };
    if (!content) delete messageData.content;
  }

  const message = await Message.create(messageData);
  await message.populate('sender', 'username profilePicture');
  if (replyTo) await message.populate('replyTo', 'content sender type media');

  // Update chat's last message & activity
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message._id,
    lastActivity: new Date(),
  });

  // Emit to socket room
  const io = getIo();
  io.to(chatId).emit('new_message', message);

  // Notify other participants
  chat.participants.forEach((participantId) => {
    if (participantId.toString() !== userId) {
      io.to(`user:${participantId}`).emit('chat_updated', {
        chatId,
        lastMessage: message,
      });
    }
  });

  res.status(201).json({ message });
};

// PUT /api/messages/:messageId — edit message
export const editMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user!._id;

  const message = await Message.findOne({ _id: messageId, sender: userId });
  if (!message) throw new AppError('Message not found', 404);
  if (message.type !== 'text') throw new AppError('Only text messages can be edited', 400);

  message.content = content;
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  const io = getIo();
  io.to(message.chat.toString()).emit('message_edited', {
    messageId,
    content,
    editedAt: message.editedAt,
  });

  res.json({ message });
};

// DELETE /api/messages/:messageId — delete message
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { messageId } = req.params;
  const { deleteFor } = req.query; // 'me' | 'everyone'
  const userId = req.user!._id;

  const message = await Message.findById(messageId);
  if (!message) throw new AppError('Message not found', 404);

  if (deleteFor === 'everyone') {
    if (message.sender.toString() !== userId) {
      throw new AppError('Only sender can delete for everyone', 403);
    }
    message.isDeleted = true;
    message.content = undefined;
    message.media = undefined;
    message.deletedAt = new Date();
  } else {
    if (!message.deletedFor.includes(userId as any)) {
      message.deletedFor.push(userId as any);
    }
  }

  await message.save();

  const io = getIo();
  io.to(message.chat.toString()).emit('message_deleted', {
    messageId,
    deleteFor,
    chatId: message.chat,
  });

  res.json({ message: 'Message deleted' });
};

// POST /api/messages/:messageId/react — add/remove reaction
export const reactToMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user!._id;

  const message = await Message.findById(messageId);
  if (!message) throw new AppError('Message not found', 404);

  const existingReaction = message.reactions.find((r) => r.emoji === emoji);

  if (existingReaction) {
    const userIndex = existingReaction.users.findIndex((u) => u.toString() === userId);
    if (userIndex > -1) {
      // Remove reaction
      existingReaction.users.splice(userIndex, 1);
      if (existingReaction.users.length === 0) {
        message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
      }
    } else {
      existingReaction.users.push(userId as any);
    }
  } else {
    message.reactions.push({ emoji, users: [userId as any] });
  }

  await message.save();

  const io = getIo();
  io.to(message.chat.toString()).emit('message_reaction', {
    messageId,
    reactions: message.reactions,
  });

  res.json({ reactions: message.reactions });
};

// POST /api/messages/:messageId/star — star/unstar message
export const starMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { messageId } = req.params;
  const userId = req.user!._id;

  const message = await Message.findById(messageId);
  if (!message) throw new AppError('Message not found', 404);

  const idx = message.isStarred.findIndex((u) => u.toString() === userId);
  if (idx > -1) {
    message.isStarred.splice(idx, 1);
  } else {
    message.isStarred.push(userId as any);
  }

  await message.save();
  res.json({ isStarred: idx === -1 });
};

// GET /api/messages/starred — get starred messages
export const getStarredMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id;
  const messages = await Message.find({ isStarred: userId, isDeleted: false })
    .populate('sender', 'username profilePicture')
    .populate('chat', 'type participants')
    .sort({ createdAt: -1 });

  res.json({ messages });
};

// GET /api/messages/search?q=&chatId=
export const searchMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  const { q, chatId } = req.query;
  const userId = req.user!._id;

  if (!q) { res.json({ messages: [] }); return; }

  const filter: any = {
    $text: { $search: q as string },
    isDeleted: false,
    deletedFor: { $ne: userId },
  };

  if (chatId) {
    // Verify user is in the chat
    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) throw new AppError('Chat not found', 404);
    filter.chat = chatId;
  }

  const messages = await Message.find(filter)
    .populate('sender', 'username profilePicture')
    .populate('chat', 'type participants')
    .limit(50);

  res.json({ messages });
};
