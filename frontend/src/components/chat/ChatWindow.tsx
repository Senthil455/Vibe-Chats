'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Phone, Video, MoreVertical, ArrowLeft, Users, Info, Search } from 'lucide-react';
import { chatApi, messageApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { getSocket } from '@/lib/socket';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Avatar } from '@/components/ui/Avatar';
import { cn, getInitials, formatLastSeen } from '@/lib/utils';
import { Message } from '@/types';
import { useRouter } from 'next/navigation';
import { format, isToday, isYesterday } from 'date-fns';

interface Props { chatId: string; }

export function ChatWindow({ chatId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    messages, setMessages, prependMessages, addMessage,
    updateMessage, deleteMessage, typingUsers, onlineUsers
  } = useChatStore();
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editMsg, setEditMsg] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  const { data: chatData } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => chatApi.getById(chatId).then((r) => r.data.chat),
  });

  // Load initial messages
  const { isLoading } = useQuery({
    queryKey: ['messages', chatId, 1],
    queryFn: async () => {
      const res = await chatApi.getMessages(chatId, 1);
      setMessages(chatId, res.data.messages);
      setHasMore(res.data.messages.length === 30);
      return res.data.messages;
    },
  });

  // Join socket room
  useEffect(() => {
    socket.emit('join_chat', { chatId });
    return () => { socket.emit('leave_chat', { chatId }); };
  }, [chatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[chatId]?.length]);

  // Mark messages as read
  useEffect(() => {
    const chatMsgs = messages[chatId];
    if (!chatMsgs) return;
    const unread = chatMsgs
      .filter((m) => {
        const senderId = typeof m.sender === 'string' ? m.sender : (m.sender as any)._id;
        return senderId !== user?._id && m.status !== 'read';
      })
      .map((m) => m._id);
    if (unread.length > 0) {
      socket.emit('message_read', { chatId, messageIds: unread });
    }
  }, [messages[chatId]]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await chatApi.getMessages(chatId, nextPage);
      prependMessages(chatId, res.data.messages);
      setPage(nextPage);
      setHasMore(res.data.messages.length === 30);
    } finally { setLoadingMore(false); }
  };

  const handleScroll = useCallback(() => {
    if (containerRef.current?.scrollTop === 0) loadMore();
  }, [loadMore]);

  const handleSendText = (content: string) => {
    const tempId = Date.now().toString();
    const optimistic: Message = {
      _id: tempId, tempId, chat: chatId,
      sender: user as any, type: 'text', content,
      reactions: [], status: 'sent', readBy: [],
      isEdited: false, isDeleted: false, isForwarded: false,
      isPinned: false, isStarred: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addMessage(chatId, optimistic);
    socket.emit('send_message', { chatId, content, type: 'text', tempId });
    socket.emit('typing_stop', { chatId });
    setReplyTo(null);
  };

  const handleSendFile = async (file: File, caption?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('chatId', chatId);
    if (caption) fd.append('content', caption);
    const type = file.type.startsWith('image/') ? 'image'
      : file.type.startsWith('video/') ? 'video'
      : file.type.startsWith('audio/') ? file.name.includes('voice') ? 'voice' : 'audio'
      : 'document';
    fd.append('type', type);
    const res = await messageApi.send(fd);
    addMessage(chatId, res.data.message);
  };

  const handleEdit = async () => {
    if (!editMsg || !editText.trim()) return;
    await messageApi.edit(editMsg._id, editText);
    updateMessage(chatId, editMsg._id, { content: editText, isEdited: true });
    setEditMsg(null);
    setEditText('');
  };

  const handleDelete = async (msg: Message) => {
    const forEveryone = (typeof msg.sender === 'string' ? msg.sender : (msg.sender as any)._id) === user?._id;
    await messageApi.delete(msg._id, forEveryone ? 'everyone' : 'me');
    deleteMessage(chatId, msg._id);
  };

  const handleReact = async (msg: Message, emoji: string) => {
    await messageApi.react(msg._id, emoji);
  };

  // Typing event
  const handleTyping = () => {
    socket.emit('typing_start', { chatId });
    const t = setTimeout(() => socket.emit('typing_stop', { chatId }), 3000);
    return () => clearTimeout(t);
  };

  const chat = chatData;
  const chatMessages = messages[chatId] || [];
  const typing = typingUsers[chatId] || [];

  const getChatName = () => {
    if (!chat) return '…';
    if (chat.type === 'group') return chat.group?.name || 'Group';
    const other = chat.participants?.find((p: any) => p._id !== user?._id);
    return other?.username || '…';
  };

  const getChatAvatar = () => {
    if (!chat) return undefined;
    if (chat.type === 'group') return chat.group?.profilePicture;
    const other = chat.participants?.find((p: any) => p._id !== user?._id);
    return other?.profilePicture;
  };

  const getOther = () => {
    if (!chat || chat.type === 'group') return null;
    return chat.participants?.find((p: any) => p._id !== user?._id);
  };

  const other = getOther();
  const isOtherOnline = other ? onlineUsers.has(other._id) : false;

  // Group messages by date
  const grouped: { date: string; messages: Message[] }[] = [];
  chatMessages.forEach((msg) => {
    const d = new Date(msg.createdAt);
    const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy');
    const last = grouped[grouped.length - 1];
    if (last?.date === label) last.messages.push(msg);
    else grouped.push({ date: label, messages: [msg] });
  });

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-surface-1 flex-shrink-0">
        <button onClick={() => router.push('/chat')} className="lg:hidden p-1.5 rounded-lg hover:bg-surface-2 text-zinc-400">
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar src={getChatAvatar()} fallback={getInitials(getChatName())} size="md" />
            {isOtherOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface-1" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{getChatName()}</p>
            <p className="text-xs text-zinc-400">
              {typing.length > 0 ? (
                <span className="text-green-400">
                  {typing.map((t) => t.username).join(', ')} typing
                  <span className="inline-flex gap-0.5 ml-1">
                    {[0,1,2].map((i) => (
                      <span key={i} className="w-1 h-1 bg-green-400 rounded-full animate-pulse-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </span>
                </span>
              ) : chat?.type === 'group' ? (
                `${chat.group?.members?.length || 0} members`
              ) : isOtherOnline ? (
                'Online'
              ) : other?.lastSeen ? (
                `Last seen ${formatLastSeen(other.lastSeen)}`
              ) : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {chat?.type !== 'group' && (
            <>
              <button className="p-2 rounded-xl hover:bg-surface-2 text-zinc-400 hover:text-white transition">
                <Phone size={18} />
              </button>
              <button className="p-2 rounded-xl hover:bg-surface-2 text-zinc-400 hover:text-white transition">
                <Video size={18} />
              </button>
            </>
          )}
          <button className="p-2 rounded-xl hover:bg-surface-2 text-zinc-400 hover:text-white transition">
            <Search size={18} />
          </button>
          <button className="p-2 rounded-xl hover:bg-surface-2 text-zinc-400 hover:text-white transition">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(124,58,237,0.03) 0%, transparent 50%)' }}
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <p className="font-medium text-white">Say hello to {getChatName()}!</p>
            <p className="text-sm mt-1">This is the beginning of your conversation.</p>
          </div>
        ) : (
          grouped.map(({ date, messages: msgs }) => (
            <div key={date}>
              <div className="flex justify-center my-4">
                <span className="text-xs text-zinc-500 bg-surface-2/80 px-3 py-1 rounded-full">{date}</span>
              </div>
              {msgs.map((msg, idx) => {
                const senderId = typeof msg.sender === 'string' ? msg.sender : (msg.sender as any)?._id;
                const isOwn = senderId === user?._id;
                const prevMsg = msgs[idx - 1];
                const prevSenderId = prevMsg ? (typeof prevMsg.sender === 'string' ? prevMsg.sender : (prevMsg.sender as any)?._id) : null;
                const showAvatar = !isOwn && senderId !== prevSenderId;

                return (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    onReply={setReplyTo}
                    onEdit={(m) => { setEditMsg(m); setEditText(m.content || ''); }}
                    onDelete={handleDelete}
                    onReact={handleReact}
                  />
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Edit mode */}
      {editMsg && (
        <div className="px-4 py-2 bg-surface-2/50 border-t border-white/5 flex items-center gap-2">
          <input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') { setEditMsg(null); setEditText(''); }}}
            className="flex-1 px-3 py-2 rounded-xl bg-surface-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoFocus
          />
          <button onClick={handleEdit} className="px-3 py-2 rounded-xl bg-brand-600 text-white text-sm">Save</button>
          <button onClick={() => { setEditMsg(null); setEditText(''); }} className="px-3 py-2 rounded-xl text-zinc-400 hover:text-white text-sm">Cancel</button>
        </div>
      )}

      {/* Input */}
      <MessageInput
        chatId={chatId}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSendText={handleSendText}
        onSendFile={handleSendFile}
        disabled={chat?.type === 'group' && chat?.group?.settings?.onlyAdminsCanMessage}
      />
    </div>
  );
}
