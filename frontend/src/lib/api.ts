import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor — inject access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { username: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  verifyEmail: (otp: string) => api.post('/auth/verify-email', { otp }),
  resendOTP: () => api.post('/auth/resend-otp'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { userId: string; token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  me: () => api.get('/auth/me'),
};

// Users
export const userApi = {
  search: (q: string) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  updateProfile: (data: FormData) =>
    api.put('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePrivacy: (data: object) => api.put('/users/privacy', data),
  blockUser: (userId: string) => api.post(`/users/block/${userId}`),
  unblockUser: (userId: string) => api.delete(`/users/block/${userId}`),
  addContact: (userId: string) => api.post(`/users/contacts/${userId}`),
  getContacts: () => api.get('/users/contacts'),
};

// Chats
export const chatApi = {
  getAll: () => api.get('/chats'),
  getOrCreate: (targetUserId: string) => api.post('/chats/private', { targetUserId }),
  getById: (chatId: string) => api.get(`/chats/${chatId}`),
  getMessages: (chatId: string, page = 1) => api.get(`/chats/${chatId}/messages?page=${page}`),
  clearChat: (chatId: string) => api.delete(`/chats/${chatId}/clear`),
};

// Messages
export const messageApi = {
  send: (data: FormData | object) => {
    if (data instanceof FormData) {
      return api.post('/messages', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/messages', data);
  },
  edit: (messageId: string, content: string) => api.put(`/messages/${messageId}`, { content }),
  delete: (messageId: string, deleteFor: 'me' | 'everyone') =>
    api.delete(`/messages/${messageId}?deleteFor=${deleteFor}`),
  react: (messageId: string, emoji: string) => api.post(`/messages/${messageId}/react`, { emoji }),
  star: (messageId: string) => api.post(`/messages/${messageId}/star`),
  getStarred: () => api.get('/messages/starred'),
  search: (q: string, chatId?: string) =>
    api.get(`/messages/search?q=${encodeURIComponent(q)}${chatId ? `&chatId=${chatId}` : ''}`),
};

// Groups
export const groupApi = {
  create: (data: { name: string; description?: string; memberIds: string[] }) =>
    api.post('/groups', data),
  get: (groupId: string) => api.get(`/groups/${groupId}`),
  update: (groupId: string, data: FormData | object) => {
    if (data instanceof FormData) {
      return api.put(`/groups/${groupId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.put(`/groups/${groupId}`, data);
  },
  addMembers: (groupId: string, userIds: string[]) =>
    api.post(`/groups/${groupId}/members`, { userIds }),
  removeMember: (groupId: string, memberId: string) =>
    api.delete(`/groups/${groupId}/members/${memberId}`),
  leave: (groupId: string) => api.post(`/groups/${groupId}/leave`),
  updateRole: (groupId: string, memberId: string, role: string) =>
    api.put(`/groups/${groupId}/members/${memberId}/role`, { role }),
  joinByLink: (inviteLink: string) => api.get(`/groups/join/${inviteLink}`),
};

// Channels
export const channelApi = {
  create: (data: FormData) =>
    api.post('/channels', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  search: (q?: string) => api.get(`/channels/search${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getMy: () => api.get('/channels/my'),
  get: (channelId: string) => api.get(`/channels/${channelId}`),
  subscribe: (channelId: string) => api.post(`/channels/${channelId}/subscribe`),
  unsubscribe: (channelId: string) => api.delete(`/channels/${channelId}/subscribe`),
  createPost: (channelId: string, data: FormData | object) => {
    if (data instanceof FormData) {
      return api.post(`/channels/${channelId}/posts`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post(`/channels/${channelId}/posts`, data);
  },
  getPosts: (channelId: string, page = 1) =>
    api.get(`/channels/${channelId}/posts?page=${page}`),
  getAnalytics: (channelId: string) => api.get(`/channels/${channelId}/analytics`),
};

// Notifications
export const notificationApi = {
  getAll: (page = 1) => api.get(`/notifications?page=${page}`),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};
