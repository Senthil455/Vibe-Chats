'use client';
import { useEffect } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';

export function useSocket() {
  const { isAuthenticated } = useAuthStore();
  const {
    addMessage, updateMessage, deleteMessage,
    setTyping, setUserOnline, updateChat,
  } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();

    socket.on('connect', () => console.log('✅ Socket connected'));
    socket.on('disconnect', () => console.log('❌ Socket disconnected'));

    socket.on('new_message', (message) => {
      addMessage(message.chat, message);
      updateChat(message.chat, { lastMessage: message, lastActivity: new Date().toISOString() });
    });

    socket.on('message_edited', ({ messageId, content, editedAt, chat }) => {
      if (chat) updateMessage(chat, messageId, { content, isEdited: true, editedAt });
    });

    socket.on('message_deleted', ({ messageId, chatId }) => {
      deleteMessage(chatId, messageId);
    });

    socket.on('message_reaction', ({ messageId, reactions, chatId }) => {
      if (chatId) updateMessage(chatId, messageId, { reactions });
    });

    socket.on('messages_read', ({ chatId, messageIds }) => {
      messageIds.forEach((id: string) => {
        updateMessage(chatId, id, { status: 'read' });
      });
    });

    socket.on('user_typing', ({ chatId, userId, username }) => {
      setTyping(chatId, { userId, username });
    });

    socket.on('user_stop_typing', ({ chatId, userId }) => {
      const store = useChatStore.getState();
      const current = store.typingUsers[chatId] || [];
      useChatStore.setState({
        typingUsers: {
          ...store.typingUsers,
          [chatId]: current.filter((u) => u.userId !== userId),
        },
      });
    });

    socket.on('user_online', ({ userId }) => setUserOnline(userId, true));
    socket.on('user_offline', ({ userId }) => setUserOnline(userId, false));

    socket.on('chat_updated', ({ chatId, lastMessage }) => {
      updateChat(chatId, { lastMessage, lastActivity: new Date().toISOString() });
    });

    return () => {
      socket.off('new_message');
      socket.off('message_edited');
      socket.off('message_deleted');
      socket.off('message_reaction');
      socket.off('messages_read');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('chat_updated');
    };
  }, [isAuthenticated]);

  return getSocket();
}
