# 💬 VibesChat — Real-Time Messaging Platform

A full-stack, production-ready messaging app combining the best of **WhatsApp** (private & group chats) and **Telegram** (channels & broadcasts). Built with Next.js 14, Node.js, MongoDB, Redis, Socket.io, and Cloudinary.

---

## 🗂️ Project Structure

```
vibeschat/
├── backend/                  # Node.js + Express + Socket.io API
│   ├── src/
│   │   ├── config/           # DB, Redis, Cloudinary
│   │   ├── controllers/      # Auth, User, Chat, Message, Group, Channel, Notification
│   │   ├── middleware/        # JWT auth, error handler, rate limiter
│   │   ├── models/           # Mongoose schemas (8 models)
│   │   ├── routes/           # Express routers (8 route files)
│   │   ├── socket/           # Socket.io real-time engine
│   │   └── utils/            # JWT, email, OTP helpers
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # Next.js 14 App Router
│   ├── src/
│   │   ├── app/              # Pages: chat, groups, channels, settings, auth
│   │   ├── components/       # ChatWindow, MessageBubble, MessageInput, Sidebar…
│   │   ├── hooks/            # useSocket
│   │   ├── lib/              # Axios client, socket singleton, utils
│   │   ├── store/            # Zustand: authStore, chatStore
│   │   └── types/            # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## ✨ Features

### Authentication
- Email + Password registration with OTP email verification
- JWT access tokens (15 min) + refresh tokens (7 days) stored in Redis
- Forgot password / reset via email link
- Google OAuth ready (googleId field on User model)

### Private Chats
- Real-time 1-to-1 messaging via Socket.io
- Message states: Sent → Delivered → Read (ticks)
- Typing indicators with animated dots
- Message reactions (❤️ 👍 😂 🔥 etc.)
- Reply to specific messages
- Edit & delete messages (for me / for everyone)
- File sharing: Images, Videos, Documents, PDFs
- Voice message recording (hold-to-record)
- Star / save important messages
- Message forwarding

### Group Chats
- Create groups with name, description, photo
- Admin / Moderator / Member roles
- Invite links for easy joining
- @mention support
- Admin controls: restrict messaging, manage members
- System messages for join/leave events

### Channels (Telegram-style)
- Public and private channels with @handle
- Only admins can post; unlimited subscribers
- Rich media posts with view counts
- Subscriber analytics dashboard
- Silent posting option

### Media
- Cloudinary for all file storage (images, video, audio, docs)
- Auto-compression and CDN delivery
- Upload progress in UI
- Image previews, audio player, video player

### Notifications
- Real-time in-app notifications via Socket.io
- Persistent notifications in MongoDB
- Unread count badge
- Mark all read

### Presence
- Online/Offline status tracked in Redis
- Last seen timestamps
- Typing & recording indicators

### Search
- Search users by username/email
- Search messages within chats (MongoDB text index)
- Discover public channels

### WebRTC (Signaling Ready)
- Socket.io events for call offer/answer/ICE candidates
- Voice & video call UI hooks ready to wire to a WebRTC library

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| State | Zustand, TanStack Query |
| Real-time | Socket.io client |
| Backend | Node.js, Express, TypeScript |
| Real-time | Socket.io server |
| Database | MongoDB (Mongoose) |
| Cache / Presence | Redis (ioredis) |
| Auth | JWT + bcrypt |
| Storage | Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Containers | Docker + Docker Compose |

---

## 🚀 Quick Start (Docker — Recommended)

### 1. Clone & configure

```bash
git clone https://github.com/yourname/vibeschat.git
cd vibeschat
cp backend/.env.example backend/.env
```

### 2. Fill in `backend/.env`

```env
# Required — get from cloudinary.com (free tier works)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Required — Gmail App Password (enable 2FA then create app password)
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password

# Change these in production!
JWT_SECRET=super_secret_change_me
JWT_REFRESH_SECRET=another_secret_change_me
```

### 3. Launch everything

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

---

## 🔧 Local Development (Without Docker)

### Prerequisites
- Node.js 20+
- MongoDB running locally or MongoDB Atlas URI
- Redis running locally

### Backend

```bash
cd backend
cp .env.example .env
# Fill in .env values

npm install
npm run dev
# API on http://localhost:5000
```

### Frontend

```bash
cd frontend
# .env.local already contains default local URLs:
#   NEXT_PUBLIC_API_URL=http://localhost:5000/api
#   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

npm install
npm run dev
# App on http://localhost:3000
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default 5000) | No |
| `CLIENT_URL` | Frontend URL for CORS | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | Access token secret | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `SMTP_HOST` | SMTP host (default: smtp.gmail.com) | Yes |
| `SMTP_USER` | SMTP email address | Yes |
| `SMTP_PASS` | SMTP password / app password | Yes |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email + password |
| POST | `/api/auth/login` | Login, returns tokens |
| POST | `/api/auth/logout` | Invalidate refresh token |
| POST | `/api/auth/refresh` | Get new access token |
| POST | `/api/auth/verify-email` | Verify email OTP |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset with token |
| GET  | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/users/:userId` | Get user profile |
| PUT | `/api/users/profile` | Update profile (multipart) |
| PUT | `/api/users/privacy` | Update privacy settings |
| POST | `/api/users/block/:userId` | Block user |
| DELETE | `/api/users/block/:userId` | Unblock user |
| POST | `/api/users/contacts/:userId` | Add contact |
| GET | `/api/users/contacts` | Get contacts |

### Chats
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/chats` | Get all chats |
| POST | `/api/chats/private` | Get or create private chat |
| GET | `/api/chats/:chatId` | Get single chat |
| GET | `/api/chats/:chatId/messages` | Paginated messages |
| DELETE | `/api/chats/:chatId/clear` | Clear chat history |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/messages` | Send message (supports file upload) |
| PUT | `/api/messages/:id` | Edit message |
| DELETE | `/api/messages/:id?deleteFor=me|everyone` | Delete message |
| POST | `/api/messages/:id/react` | Add/remove reaction |
| POST | `/api/messages/:id/star` | Star/unstar message |
| GET | `/api/messages/starred` | Get starred messages |
| GET | `/api/messages/search?q=` | Search messages |

### Groups
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/groups` | Create group |
| GET | `/api/groups/:groupId` | Get group details |
| PUT | `/api/groups/:groupId` | Update group |
| POST | `/api/groups/:groupId/members` | Add members |
| DELETE | `/api/groups/:groupId/members/:memberId` | Remove member |
| POST | `/api/groups/:groupId/leave` | Leave group |
| PUT | `/api/groups/:groupId/members/:memberId/role` | Change role |
| GET | `/api/groups/join/:inviteLink` | Join via invite link |

### Channels
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/channels` | Create channel |
| GET | `/api/channels/search?q=` | Discover channels |
| GET | `/api/channels/my` | My subscriptions |
| GET | `/api/channels/:id` | Channel details |
| POST | `/api/channels/:id/subscribe` | Subscribe |
| DELETE | `/api/channels/:id/subscribe` | Unsubscribe |
| POST | `/api/channels/:id/posts` | Create post |
| GET | `/api/channels/:id/posts` | Get posts |
| GET | `/api/channels/:id/analytics` | Admin analytics |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join_chat` | `{ chatId }` | Join a chat room |
| `leave_chat` | `{ chatId }` | Leave a chat room |
| `send_message` | `{ chatId, content, type, replyTo?, tempId? }` | Send a message |
| `typing_start` | `{ chatId }` | Start typing indicator |
| `typing_stop` | `{ chatId }` | Stop typing indicator |
| `message_read` | `{ chatId, messageIds[] }` | Mark messages as read |
| `react_message` | `{ messageId, emoji }` | React to a message |
| `join_channel` | `{ channelId }` | Subscribe to channel events |
| `call_user` | `{ targetUserId, offer, callType }` | Initiate WebRTC call |
| `answer_call` | `{ targetUserId, answer }` | Answer a call |
| `ice_candidate` | `{ targetUserId, candidate }` | Send ICE candidate |
| `end_call` | `{ targetUserId }` | End a call |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `new_message` | `Message` | New message in a chat |
| `message_edited` | `{ messageId, content, editedAt }` | Message edited |
| `message_deleted` | `{ messageId, chatId, deleteFor }` | Message deleted |
| `message_reaction` | `{ messageId, reactions }` | Reactions updated |
| `messages_read` | `{ chatId, messageIds, readBy }` | Messages marked read |
| `user_typing` | `{ chatId, userId, username }` | User is typing |
| `user_stop_typing` | `{ chatId, userId }` | User stopped typing |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId, lastSeen }` | User went offline |
| `chat_updated` | `{ chatId, lastMessage }` | Chat metadata changed |
| `group_created` | `{ group, chatId }` | New group created |
| `channel_post` | `ChannelPost` | New channel post |
| `incoming_call` | `{ from, fromUsername, offer, callType }` | Incoming call |
| `notification` | `{ type, title, body, data }` | Real-time notification |

---

## 🗄️ Database Schema

```
Users          → username, email, phone, password(hashed), profilePicture, bio, privacy, blockedUsers, contacts
Chats          → type(private|group), participants[], group?, lastMessage, lastActivity
Messages       → chat, sender, type, content, media?, replyTo?, reactions[], status, readBy[], isEdited, isDeleted
Groups         → name, description, chat, members[{user,role,isMuted}], settings, inviteLink, createdBy
Channels       → name, handle, description, isPublic, owner, admins[], subscriberCount, analytics
ChannelPosts   → channel, author, content, media[], viewCount, reactions[], isSilent, isPinned
ChannelSubs    → channel, user, isMuted, subscribedAt
Notifications  → recipient, sender?, type, title, body, data, isRead
```

---

## 🔒 Security

- Passwords hashed with bcrypt (cost 12)
- JWT access tokens expire in 15 minutes
- Refresh tokens stored in Redis (7 days TTL)
- Rate limiting on all endpoints (200 req/15min global, 10 req/15min auth)
- Helmet.js security headers
- CORS restricted to frontend origin
- Input sanitization via express-validator
- MongoDB injection protection via Mongoose
- Blocked users cannot initiate chats

---

## 🚢 Production Deployment

### Environment changes for production:
1. Set `NODE_ENV=production`
2. Use strong random `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ chars)
3. Use MongoDB Atlas for managed database
4. Use Redis Cloud or Upstash for managed Redis
5. Set `CLIENT_URL` to your actual domain
6. Use Cloudinary (already configured) for media
7. Set up a reverse proxy (nginx) in front of both services
8. Enable HTTPS — update `CLIENT_URL` to `https://`

### Recommended hosting:
- **Backend**: Railway, Render, or DigitalOcean App Platform
- **Frontend**: Vercel (best for Next.js)
- **Database**: MongoDB Atlas (free M0 tier)
- **Cache**: Upstash Redis (free tier)
- **Media**: Cloudinary (free 25GB)

---

## 📦 Adding Features

### End-to-End Encryption
The message model has all fields ready. Implement using the Signal Protocol library (`@signalapp/libsignal-client`) for the key exchange and message encryption layer.

### Voice/Video Calls
Socket.io WebRTC signaling is already implemented. Add a WebRTC peer connection in the frontend using `simple-peer` or the native `RTCPeerConnection` API, triggered by the `call_user` / `answer_call` events.

### AI Message Summarization
Call OpenAI's API from a new controller endpoint, passing the last N messages from a chat for summarization.

---

## 📄 License

MIT — use freely, build something great.

---

Built with ❤️ using Next.js, Express, MongoDB, Redis & Socket.io
