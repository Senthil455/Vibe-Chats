# 💬 VibesChat — Real-Time Messaging Platform

A full‑stack, production‑inspired messaging application that combines the **best of WhatsApp** (private & group chats) and **Telegram** (channels & broadcasts). Built with **Next.js 14**, **Node.js**, **MongoDB**, **Redis**, **Socket.io**, and **Cloudinary**, VibesChat is designed to feel like a real‑world messaging platform while serving as a strong portfolio project.

---

## 🧠 Overview

VibesChat is a **real‑time, multi‑feature messaging platform** that supports:

- Private 1‑to‑1 chats with delivery and read receipts.  
- Group chats with role‑based permissions and admin controls.  
- Public/private channels (Telegram‑style broadcasts).  
- Rich media (images, videos, documents, PDFs, voice messages).  
- Online presence, notifications, search, and future‑ready WebRTC signaling.

This project demonstrates **full‑stack architecture**, **event‑driven real‑time systems**, and **cloud‑ready deployment patterns**, making it suitable for both learning and professional showcases.

---

## 🗂️ Project Structure

```
vibeschat/
├── backend/                  # Node.js + Express + Socket.io API
│   ├── src/
│   │   ├── config/           # DB, Redis, Cloudinary
│   │   ├── controllers/      # Auth, User, Chat, Message, Group, Channel, Notification
│   │   ├── middleware/       # JWT auth, error handler, rate limiter
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
│   │   ├── lib/              # axios client, socket singleton, utils
│   │   ├── store/            # Zustand: authStore, chatStore
│   │   └── types/            # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

Developed and maintained by **Senthil Raja R** — Full Stack Developer | AI Automation Enthusiast.  
🔗 GitHub: [https://github.com/Senthil455/vibeschat](https://github.com/Senthil455/vibeschat)  
🔗 Profile: [https://github.com/Senthil455](https://github.com/Senthil455)

---

## ✨ Core Features

### Authentication & Security

- Email + password registration with **OTP‑based email verification**.  
- JWT access tokens (15 minutes) + refresh tokens (7 days) stored in **Redis**.  
- “Forgot password” and “reset via email link” flows.  
- Google OAuth extension ready (Google ID field already exists on the `User` model).  
- Security‑oriented backend: bcrypt passwords, rate limiting, Helmet headers, CORS, input validation.

### Private Chats

- Real‑time **1‑to‑1 messaging** powered by **Socket.io**.  
- Message states: **Sent → Delivered → Read** (tick indicators).  
- Typing indicators with animated dots.  
- Message reactions (e.g., ❤️, 👍, 😂, 🔥).  
- “Reply to” specific messages.  
- Edit & delete messages (for me / for everyone).  
- File sharing: **images, videos, documents, PDFs**.  
- Voice message recording (hold‑to‑record).  
- Star / save important messages.  
- Message forwarding between chats.

### Group Chats

- Create groups with **name, description, photo, and invite link**.  
- Role‑based permissions: **Admin / Moderator / Member**.  
- @‑mention support for members.  
- Admin controls: restrict message posting, manage members.  
- System messages for **join/leave events**.

### Channels (Telegram‑style)

- Public and private channels with **@handle** URLs.  
- Only admins can post; **unlimited followers/ Subscribers**.  
- Rich media posts with **view counts**.  
- Subscriber analytics dashboard for channel owners.  
- Option for **silent (no‑notification) posts**.

### Media Handling

- **Cloudinary** as the media backend for all uploads.  
- Auto‑compression and **CDN delivery** for fast loading.  
- Upload progress bars in the UI.  
- In‑app previews for images, audio players, and video players.

### Notifications

- Real‑time **in‑app notifications** via **Socket.io**.  
- Persistent notifications stored in **MongoDB**.  
- Unread count badges.  
- “Mark all read” across all notifications.

### Presence & Typing

- Online / offline status tracked in **Redis**.  
- Last‑seen timestamps.  
- Typing and recording indicators in chats.

### Search

- Search users by **username or email**.  
- Search messages within chats using **MongoDB text indexing**.  
- Discover **public channels** via search.

### WebRTC (Signaling Ready)

- **Socket.io events** for `call_offer`, `call_answer`, and ICE candidates.  
- Voice and video call **UI hooks** ready to integrate with a WebRTC library (e.g., `simple‑peer` or native `RTCPeerConnection`).

---

## 🛠️ Tech Stack

| Layer                  | Technology |
|------------------------|-----------|
| **Frontend**          | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **State**             | Zustand, TanStack Query |
| **Real‑time frontend**| Socket.io client |
| **Backend**           | Node.js, Express, TypeScript |
| **Real‑time backend** | Socket.io server |
| **Database**          | MongoDB (Mongoose) |
| **Cache / Presence**  | Redis (ioredis) |
| **Auth**              | JWT + bcrypt |
| **Storage**           | Cloudinary |
| **Email**             | Nodemailer (Gmail SMTP) |
| **Containers**        | Docker + Docker Compose |

---

## 🚀 Quick Start (Docker — Recommended)

### 1. Clone the project

```bash
git clone https://github.com/Senthil455/vibeschat.git
cd vibeschat
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with **your own values** (no keys shared here):

```env
# Required — Cloudinary credentials (free tier works)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Required — Gmail SMTP (or any SMTP provider)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password

# Change these in production!
JWT_SECRET=super_secret_change_me
JWT_REFRESH_SECRET=another_secret_change_me
```

### 3. Launch with Docker Compose

```bash
docker compose up --build
```

Once running:

| Service          | URL |
|------------------|-----|
| **Frontend**     | `http://localhost:3000` |
| **Backend API**  | `http://localhost:5000` |
| **MongoDB**      | `localhost:27017` |
| **Redis**        | `localhost:6379` |

---

## 🔧 Local Development (Without Docker)

### Prerequisites

- Node.js 20+  
- MongoDB (local or Atlas URI)  
- Redis (local instance or cloud)  

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your values (Cloudinary, SMTP, MongoDB, Redis, JWT secrets)

npm install
npm run dev
```

API runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:3000`.  
Environment variables are already wired via `frontend/.env.local` (no secrets to change there).

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable                    | Description |
|-----------------------------|------------|
| `PORT`                     | Server port (default `5000`) |
| `CLIENT_URL`               | Frontend URL for CORS |
| `MONGODB_URI`              | MongoDB connection string |
| `REDIS_URL`                | Redis connection string |
| `JWT_SECRET`               | Access token secret |
| `JWT_REFRESH_SECRET`       | Refresh token secret |
| `CLOUDINARY_CLOUD_NAME`    | Cloudinary cloud name |
| `CLOUDINARY_API_KEY`       | Cloudinary API key |
| `CLOUDINARY_API_SECRET`    | Cloudinary API secret |
| `SMTP_HOST`                | SMTP host (e.g., `smtp.gmail.com`) |
| `SMTP_USER`                | SMTP email address |
| `SMTP_PASS`                | SMTP password / app password |

### Frontend (`frontend/.env.local`)

| Variable                     | Description |
|------------------------------|------------|
| `NEXT_PUBLIC_API_URL`        | Backend API base URL |
| `NEXT_PUBLIC_SOCKET_URL`     | Socket.io server URL |

---

## 📡 API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-----------|
| POST | `/api/auth/register` | Register with email + password |
| POST | `/api/auth/login` | Login, returns tokens |
| POST | `/api/auth/logout` | Invalidate refresh token |
| POST | `/api/auth/refresh` | Get new access token |
| POST | `/api/auth/verify-email` | Verify email OTP |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET  | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Description |
|--------|----------|-----------|
| GET  | `/api/users/search?q=` | Search users |
| GET  | `/api/users/:userId` | Get user profile |
| PUT  | `/api/users/profile` | Update profile (supports `multipart/form-data`) |
| PUT  | `/api/users/privacy` | Update privacy settings |
| POST | `/api/users/block/:userId` | Block a user |
| DELETE | `/api/users/block/:userId` | Unblock a user |
| POST | `/api/users/contacts/:userId` | Add contact |
| GET  | `/api/users/contacts` | Get contacts list |

### Chats

| Method | Endpoint | Description |
|--------|----------|-----------|
| GET  | `/api/chats` | Get all chats |
| POST | `/api/chats/private` | Get or create a private chat |
| GET  | `/api/chats/:chatId` | Get a single chat |
| GET  | `/api/chats/:chatId/messages` | Paginated messages |
| DELETE | `/api/chats/:chatId/clear` | Clear chat history |

### Messages

| Method | Endpoint | Description |
|--------|----------|-----------|
| POST | `/api/messages` | Send message (supports file upload) |
| PUT  | `/api/messages/:id` | Edit message |
| DELETE | `/api/messages/:id?deleteFor=me|everyone` | Delete message |
| POST | `/api/messages/:id/react` | Add/remove reaction |
| POST | `/api/messages/:id/star` | Star/unstar message |
| GET  | `/api/messages/starred` | Get starred messages |
| GET  | `/api/messages/search?q=` | Search messages |

### Groups

| Method | Endpoint | Description |
|--------|----------|-----------|
| POST | `/api/groups` | Create a group |
| GET  | `/api/groups/:groupId` | Get group details |
| PUT  | `/api/groups/:groupId` | Update group |
| POST | `/api/groups/:groupId/members` | Add members |
| DELETE | `/api/groups/:groupId/members/:memberId` | Remove member |
| POST | `/api/groups/:groupId/leave` | Leave the group |
| PUT | `/api/groups/:groupId/members/:memberId/role` | Change member role |
| GET  | `/api/groups/join/:inviteLink` | Join via invite link |

### Channels

| Method | Endpoint | Description |
|--------|----------|-----------|
| POST | `/api/channels` | Create a channel |
| GET  | `/api/channels/search?q=` | Discover channels |
| GET  | `/api/channels/my` | Get my subscriptions |
| GET  | `/api/channels/:id` | Channel details |
| POST | `/api/channels/:id/subscribe` | Subscribe |
| DELETE | `/api/channels/:id/subscribe` | Unsubscribe |
| POST | `/api/channels/:id/posts` | Create post |
| GET  | `/api/channels/:id/posts` | Get posts |
| GET  | `/api/channels/:id/analytics` | Admin analytics dashboard |

---

## 🔌 Socket.io Real‑Time Events

### Client → Server (emit)

| Event            | Payload | Description |
|------------------|---------|-----------|
| `join_chat`      | `{ chatId }` | Join a chat room |
| `leave_chat`     | `{ chatId }` | Leave a chat room |
| `send_message`   | `{ chatId, content, type, replyTo?, tempId? }` | Send a message |
| `typing_start`   | `{ chatId }` | Start typing indicator |
| `typing_stop`    | `{ chatId }` | Stop typing indicator |
| `message_read`   | `{ chatId, messageIds[] }` | Mark messages as read |
| `react_message`  | `{ messageId, emoji }` | React to a message |
| `join_channel`   | `{ channelId }` | Subscribe to channel events |
| `call_user`      | `{ targetUserId, offer, callType }` | Initiate WebRTC call |
| `answer_call`    | `{ targetUserId, answer }` | Answer a call |
| `ice_candidate`  | `{ targetUserId, candidate }` | Send ICE candidate |
| `end_call`       | `{ targetUserId }` | End a call |

### Server → Client (on)

| Event               | Payload | Description |
|---------------------|---------|-----------|
| `new_message`       | `Message` | New message in a chat |
| `message_edited`    | `{ messageId, content, editedAt }` | Message edited |
| `message_deleted`   | `{ messageId, chatId, deleteFor }` | Message deleted |
| `message_reaction`  | `{ messageId, reactions }` | Reactions updated |
| `messages_read`     | `{ chatId, messageIds, readBy }` | Messages marked read |
| `user_typing`       | `{ chatId, userId, username }` | User is typing |
| `user_stop_typing`  | `{ chatId, userId }` | User stopped typing |
| `user_online`       | `{ userId }` | User came online |
| `user_offline`      | `{ userId, lastSeen }` | User went offline |
| `chat_updated`      | `{ chatId, lastMessage }` | Chat metadata changed |
| `group_created`     | `{ group, chatId }` | New group created |
| `channel_post`      | `ChannelPost` | New channel post |
| `incoming_call`     | `{ from, fromUsername, offer, callType }` | Incoming call |
| `notification`      | `{ type, title, body, data }` | Real‑time notification |

---

## 🗄️ Database Schema (High‑Level)

```text
Users:
  username, email, phone, password (hashed), profilePicture, bio,
  privacy settings, blockedUsers, contacts

Chats:
  type (private|group), participants[], group?, lastMessage, lastActivity

Messages:
  chat, sender, type, content, media?, replyTo?, reactions[],
  status, readBy[], isEdited, isDeleted

Groups:
  name, description, chat, members[{user, role, isMuted}],
  settings, inviteLink, createdBy

Channels:
  name, handle, description, isPublic, owner, admins[],
  subscriberCount, analytics

ChannelPosts:
  channel, author, content, media[], viewCount, reactions[],
  isSilent, isPinned

ChannelSubs:
  channel, user, isMuted, subscribedAt

Notifications:
  recipient, sender?, type, title, body, data, isRead
```

---

## 🔒 Security & Reliability

- **Password hashing** with `bcrypt` (rounds 12).  
- **JWT access tokens** expire in **15 minutes**; **refresh tokens** are stored in **Redis** with a **7‑day TTL**.  
- **Rate limiting** on all endpoints (200 requests / 15 minutes globally, stricter limits on auth routes).  
- **Helmet.js** for HTTP security headers.  
- **CORS** restricted to the configured frontend origin.  
- **Input validation** via `express‑validator`.  
- **MongoDB injection protection** via Mongoose.  
- **Blocked users** cannot initiate new chats with the blocked target.  

---

## 🚢 Production Deployment Suggestions

### Environment changes for production

1. Set `NODE_ENV=production`.  
2. Use **strong random JWT secrets** (32+ characters).  
3. Use **MongoDB Atlas** (recommended free tier) for managed database.  
4. Use **Redis Cloud / Upstash** for managed Redis.  
5. Set `CLIENT_URL` to your actual domain (e.g., `https://vibeschat.yourcompany.com`).  
6. Keep **Cloudinary** for media (already configured).  
7. Place **nginx or Caddy** as a reverse proxy in front of backend/frontend.  
8. Enable **HTTPS** (e.g., via Let’s Encrypt) and update `CLIENT_URL` to `https://…`.

### Recommended hosting stack

- **Frontend**: **Vercel** (ideal for Next.js).  
- **Backend**: **Railway**, **Render**, or **DigitalOcean App Platform**.  
- **Database**: **MongoDB Atlas** (free M0 tier).  
- **Cache**: **Upstash Redis** (free tier).  
- **Media**: **Cloudinary** (free tier; 25 GB monthly bandwidth suitable for side‑project‑scale usage**).  

***

## 📦 Future Feature Ideas

### End‑to‑End Encryption
The message model and database schema already support encrypted fields. You can integrate libraries like `@signalapp/libsignal-client` to implement **Signal‑protocol‑style encryption** for true end‑to‑end privacy, with separate key‑exchange flows and message‑key management in the backend.

### Voice / Video Calls
WebSocket‑based signaling is already wired:

- `call_user`, `answer_call`, and `ice_candidate` events are ready.  
- You can plug in a WebRTC library such as **simple‑peer** or native **`RTCPeerConnection`** on the frontend to complete the **real‑time voice and video pipeline**.

### AI Message Summarization
Add a new controller (e.g., `/api/messages/summarize`) that:

- Fetches the last N messages from a chat.  
- Calls **OpenAI’s API** (or another LLM) with a structured prompt.  
- Returns a concise summary to the frontend for quick context.  

This is a great way to showcase **AI‑powered features without changing core architecture**.

### Advanced Analytics & Admin Dashboard
Extend the analytics endpoints to include:

- Peak activity times.  
- Most active users and channels.  
- Message‑volume trends over time.  

This data can back an **admin dashboard** similar to what many SaaS platforms provide.


***

## 📈 Why This Project Stands Out

VibesChat is more than another chat app; it demonstrates:

- **Full‑stack competence**: from UI (Next.js, Tailwind, Zustand) to backend (Node.js, Express, TypeScript, Socket.io).  
- **Real‑time awareness**: publish‑subscribe patterns, presence, notifications, and WebRTC‑ready signaling.  
- **Production‑grade concerns**: JWT auth, rate limiting, structured logging, Docker‑first setup, and cloud‑ready deployment.  
- **Professional documentation**: clean structure, API reference, and deployment guidance that make it easy for others to learn from and contribute to.

This project is a strong showcase for **internships, junior‑to‑mid‑level backend/full‑stack roles**, and **portfolio‑first hiring pipelines**.

***

Build with ❤️ using **Next.js**, **Express**, **MongoDB**, **Redis**, and **Socket.io**  
Made with pride by **Senthil Raja R**  
🔗 GitHub: [https://github.com/Senthil455/vibeschat](https://github.com/Senthil455/vibeschat)  
🔗 Profile: [https://github.com/Senthil455](https://github.com/Senthil455)
