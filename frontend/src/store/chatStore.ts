import { create } from 'zustand';
import { Chat, Message } from '@/types';

interface ChatStore {
  chats: Chat[];
  activeChatId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, { userId: string; username: string }[]>;
  onlineUsers: Set<string>;

  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  setActiveChat: (chatId: string | null) => void;

  setMessages: (chatId: string, messages: Message[]) => void;
  prependMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (chatId: string, messageId: string) => void;

  setTyping: (chatId: string, user: { userId: string; username: string } | null) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  activeChatId: null,
  messages: {},
  typingUsers: {},
  onlineUsers: new Set(),

  setChats: (chats) => set({ chats }),

  addChat: (chat) =>
    set((state) => ({
      chats: [chat, ...state.chats.filter((c) => c._id !== chat._id)],
    })),

  updateChat: (chatId, updates) =>
    set((state) => ({
      chats: state.chats.map((c) => (c._id === chatId ? { ...c, ...updates } : c)),
    })),

  setActiveChat: (chatId) => set({ activeChatId: chatId }),

  setMessages: (chatId, messages) =>
    set((state) => ({ messages: { ...state.messages, [chatId]: messages } })),

  prependMessages: (chatId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...messages, ...(state.messages[chatId] || [])],
      },
    })),

  addMessage: (chatId, message) =>
    set((state) => {
      const existing = state.messages[chatId] || [];
      // Replace optimistic message if tempId matches
      const filtered = existing.filter((m) => m._id !== message.tempId && m._id !== message._id);
      return {
        messages: { ...state.messages, [chatId]: [...filtered, message] },
      };
    }),

  updateMessage: (chatId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m._id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),

  deleteMessage: (chatId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, content: undefined } : m
        ),
      },
    })),

  setTyping: (chatId, user) =>
    set((state) => {
      const current = state.typingUsers[chatId] || [];
      if (!user) {
        return { typingUsers: { ...state.typingUsers, [chatId]: [] } };
      }
      const exists = current.some((u) => u.userId === user.userId);
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: exists ? current : [...current, user],
        },
      };
    }),

  setUserOnline: (userId, isOnline) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      if (isOnline) next.add(userId);
      else next.delete(userId);
      return { onlineUsers: next };
    }),
}));
