export interface User {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  bio?: string;
  isEmailVerified: boolean;
  isOnline?: boolean;
  lastSeen?: number;
  privacy: {
    lastSeenVisibility: 'everyone' | 'contacts' | 'nobody';
    profilePhotoVisibility: 'everyone' | 'contacts' | 'nobody';
    readReceipts: boolean;
  };
  createdAt: string;
}

export interface Message {
  _id: string;
  chat: string;
  sender: User | string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice' | 'system';
  content?: string;
  media?: {
    url: string;
    publicId: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    thumbnail?: string;
  };
  replyTo?: Message;
  reactions: { emoji: string; users: string[] }[];
  status: 'sent' | 'delivered' | 'read';
  readBy: { user: string; readAt: string }[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  isForwarded: boolean;
  isPinned: boolean;
  isStarred: string[];
  tempId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  type: 'private' | 'group';
  participants: User[];
  group?: Group;
  lastMessage?: Message;
  lastActivity: string;
  isOnline?: boolean;
  lastSeen?: number;
  unreadCount?: number;
  createdAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  profilePicture?: string;
  chat: string;
  members: { user: User; role: 'admin' | 'moderator' | 'member'; joinedAt: string; isMuted: boolean }[];
  settings: {
    onlyAdminsCanMessage: boolean;
    onlyAdminsCanEditInfo: boolean;
    approvalRequired: boolean;
  };
  inviteLink: string;
  pinnedMessages: string[];
  createdBy: string;
}

export interface Channel {
  _id: string;
  name: string;
  handle: string;
  description?: string;
  profilePicture?: string;
  isPublic: boolean;
  owner: User;
  admins: string[];
  subscriberCount: number;
  analytics: { totalMessages: number; totalViews: number };
  createdAt: string;
}

export interface ChannelPost {
  _id: string;
  channel: string;
  author: User;
  content?: string;
  media?: { url: string; publicId: string; mimeType?: string; fileName?: string }[];
  viewCount: number;
  reactions: { emoji: string; count: number; users: string[] }[];
  isSilent: boolean;
  isPinned: boolean;
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender?: User;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}
