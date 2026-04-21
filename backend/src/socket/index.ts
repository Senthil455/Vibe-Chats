import { Server, Socket } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { User } from './models/user.model';
import { Message } from './models/message.model';
import { Chat } from './models/chat.model';
import { Notification } from './models/notification.model';
import {
  setOnlineStatus,
  setTyping,
  getRedis,
} from '../config/redis';

let io: Server;

export const getIo = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

interface AuthSocket extends Socket {
  userId?: string;
  username?: string;
}

export const initializeSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Auth Middleware ───────────────────────────────────────────────
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId).select('username _id');
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection ────────────────────────────────────────────────────
  io.on('connection', async (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`🟢 User connected: ${socket.username} (${userId})`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Set online
    await setOnlineStatus(userId, true);
    io.emit('user_online', { userId });

    // Re-join all chat rooms this user belongs to
    try {
      const chats = await Chat.find({ participants: userId }).select('_id');
      chats.forEach((chat) => socket.join(chat._id.toString()));
    } catch (e) {
      console.error('Error joining chat rooms:', e);
    }

    // ─── Chat Events ───────────────────────────────────────────────

    socket.on('join_chat', async ({ chatId }: { chatId: string }) => {
      try {
        const chat = await Chat.findOne({ _id: chatId, participants: userId });
        if (chat) {
          socket.join(chatId);
          socket.emit('joined_chat', { chatId });
        }
      } catch (e) {
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    socket.on('leave_chat', ({ chatId }: { chatId: string }) => {
      socket.leave(chatId);
    });

    // ─── Typing ────────────────────────────────────────────────────

    socket.on('typing_start', async ({ chatId }: { chatId: string }) => {
      await setTyping(chatId, userId, true);
      socket.to(chatId).emit('user_typing', { chatId, userId, username: socket.username });
    });

    socket.on('typing_stop', async ({ chatId }: { chatId: string }) => {
      await setTyping(chatId, userId, false);
      socket.to(chatId).emit('user_stop_typing', { chatId, userId });
    });

    // ─── Message Events ────────────────────────────────────────────

    socket.on('send_message', async (data: {
      chatId: string;
      content?: string;
      type?: string;
      replyTo?: string;
      tempId?: string;
    }) => {
      try {
        const chat = await Chat.findOne({ _id: data.chatId, participants: userId });
        if (!chat) {
          socket.emit('message_error', { tempId: data.tempId, error: 'Chat not found' });
          return;
        }

        const message = await Message.create({
          chat: data.chatId,
          sender: userId,
          type: data.type || 'text',
          content: data.content,
          replyTo: data.replyTo || undefined,
        });

        await message.populate('sender', 'username profilePicture');
        if (data.replyTo) await message.populate('replyTo', 'content sender type');

        await Chat.findByIdAndUpdate(data.chatId, {
          lastMessage: message._id,
          lastActivity: new Date(),
        });

        // Emit to all in the chat room
        io.to(data.chatId).emit('new_message', {
          ...message.toObject(),
          tempId: data.tempId,
        });

        // Mark delivered for other online participants
        const otherParticipants = chat.participants.filter((p) => p.toString() !== userId);
        for (const participantId of otherParticipants) {
          const redis = getRedis();
          const isOnline = await redis.get(`user:online:${participantId}`);

          // Notify their personal room
          io.to(`user:${participantId}`).emit('chat_updated', {
            chatId: data.chatId,
            lastMessage: message,
          });

          if (isOnline) {
            // Auto deliver
            if (!message.deliveredTo.some((d) => d.user.toString() === participantId.toString())) {
              message.deliveredTo.push({ user: participantId, deliveredAt: new Date() });
            }

            // Create notification
            await Notification.create({
              recipient: participantId,
              sender: userId,
              type: 'new_message',
              title: socket.username!,
              body: data.content?.substring(0, 100) || 'Sent a file',
              data: { chatId: data.chatId, messageId: message._id },
            });

            io.to(`user:${participantId}`).emit('notification', {
              type: 'new_message',
              title: socket.username,
              body: data.content?.substring(0, 100) || 'Sent a file',
              data: { chatId: data.chatId },
            });
          }
        }

        if (message.deliveredTo.length > 0) {
          await message.save();
          if (message.status === 'sent') {
            message.status = 'delivered';
            await message.save();
            socket.emit('message_delivered', { messageId: message._id, chatId: data.chatId });
          }
        }

      } catch (e) {
        console.error('send_message error:', e);
        socket.emit('message_error', { tempId: data.tempId, error: 'Failed to send' });
      }
    });

    socket.on('message_read', async ({ chatId, messageIds }: { chatId: string; messageIds: string[] }) => {
      try {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            chat: chatId,
            'readBy.user': { $ne: userId },
          },
          {
            $push: { readBy: { user: userId, readAt: new Date() } },
            $set: { status: 'read' },
          }
        );

        // Notify sender
        socket.to(chatId).emit('messages_read', { chatId, messageIds, readBy: userId });
      } catch (e) {
        console.error('message_read error:', e);
      }
    });

    socket.on('react_message', async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existing = message.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          const idx = existing.users.findIndex((u) => u.toString() === userId);
          if (idx > -1) existing.users.splice(idx, 1);
          else existing.users.push(userId as any);
          if (existing.users.length === 0) {
            message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
          }
        } else {
          message.reactions.push({ emoji, users: [userId as any] });
        }

        await message.save();
        io.to(message.chat.toString()).emit('message_reaction', {
          messageId,
          reactions: message.reactions,
        });
      } catch (e) {
        console.error('react_message error:', e);
      }
    });

    // ─── Channel Events ────────────────────────────────────────────

    socket.on('join_channel', ({ channelId }: { channelId: string }) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('leave_channel', ({ channelId }: { channelId: string }) => {
      socket.leave(`channel:${channelId}`);
    });

    // ─── Voice/Video Signaling (WebRTC) ────────────────────────────

    socket.on('call_user', ({ targetUserId, offer, callType }: {
      targetUserId: string;
      offer: RTCSessionDescriptionInit;
      callType: 'audio' | 'video';
    }) => {
      io.to(`user:${targetUserId}`).emit('incoming_call', {
        from: userId,
        fromUsername: socket.username,
        offer,
        callType,
      });
    });

    socket.on('answer_call', ({ targetUserId, answer }: {
      targetUserId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      io.to(`user:${targetUserId}`).emit('call_answered', { answer });
    });

    socket.on('ice_candidate', ({ targetUserId, candidate }: {
      targetUserId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      io.to(`user:${targetUserId}`).emit('ice_candidate', { candidate });
    });

    socket.on('end_call', ({ targetUserId }: { targetUserId: string }) => {
      io.to(`user:${targetUserId}`).emit('call_ended', { from: userId });
    });

    socket.on('reject_call', ({ targetUserId }: { targetUserId: string }) => {
      io.to(`user:${targetUserId}`).emit('call_rejected', { from: userId });
    });

    // ─── Disconnect ────────────────────────────────────────────────

    socket.on('disconnect', async () => {
      console.log(`🔴 User disconnected: ${socket.username} (${userId})`);
      await setOnlineStatus(userId, false);
      io.emit('user_offline', { userId, lastSeen: Date.now() });
    });
  });

  return io;
};
