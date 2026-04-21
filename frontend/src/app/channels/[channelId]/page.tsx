'use client';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { channelApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import { Avatar } from '@/components/ui/Avatar';
import { getInitials, formatMessageTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Users, Bell, BellOff, Send,
  BarChart2, Trash2, Pin, Eye,
} from 'lucide-react';
import { ChannelPost } from '@/types';

interface Props { params: { channelId: string } }

export default function ChannelDetailPage({ params }: Props) {
  const { channelId } = params;
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const { data: channelData } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: () => channelApi.get(channelId).then((r) => r.data),
  });

  const { data: postsData } = useQuery({
    queryKey: ['channel-posts', channelId],
    queryFn: () => channelApi.getPosts(channelId).then((r) => r.data.posts),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['channel-analytics', channelId],
    queryFn: () => channelApi.getAnalytics(channelId).then((r) => r.data.analytics),
    enabled: !!channelData?.isAdmin,
  });

  useEffect(() => { if (postsData) setPosts(postsData); }, [postsData]);

  // Real-time channel posts
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join_channel', { channelId });
    socket.on('channel_post', (post: ChannelPost) => {
      setPosts((prev) => [...prev, post]);
    });
    return () => {
      socket.emit('leave_channel', { channelId });
      socket.off('channel_post');
    };
  }, [channelId]);

  const channel = channelData?.channel;
  const isAdmin = channelData?.isAdmin;
  const isSubscribed = channelData?.isSubscribed;

  const handleSubscribe = async () => {
    if (isSubscribed) {
      await channelApi.unsubscribe(channelId);
    } else {
      await channelApi.subscribe(channelId);
    }
    qc.invalidateQueries({ queryKey: ['channel', channelId] });
    qc.invalidateQueries({ queryKey: ['my-channels'] });
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      await channelApi.createPost(channelId, { content: newPost.trim() });
      setNewPost('');
      qc.invalidateQueries({ queryKey: ['channel-posts', channelId] });
    } finally { setPosting(false); }
  };

  if (!channel) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-surface-1 flex items-center gap-3">
        <button onClick={() => router.push('/channels')}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-zinc-400 hover:text-white transition">
          <ArrowLeft size={18} />
        </button>
        <Avatar src={channel.profilePicture} fallback={getInitials(channel.name)} size="md" isGroup />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{channel.name}</p>
          <p className="text-xs text-zinc-400 flex items-center gap-1">
            <Users size={10} /> {channel.subscriberCount?.toLocaleString()} subscribers
          </p>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <button
              onClick={() => router.push(`/channels/${channelId}/analytics`)}
              className="p-2 rounded-xl hover:bg-surface-2 text-zinc-400 hover:text-white transition"
              title="Analytics"
            >
              <BarChart2 size={18} />
            </button>
          )}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl hover:bg-surface-2 text-zinc-400 hover:text-white transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
          </button>
          <button
            onClick={handleSubscribe}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition ${
              isSubscribed
                ? 'bg-surface-2 text-zinc-300 hover:bg-red-500/20 hover:text-red-400'
                : 'bg-brand-600 text-white hover:bg-brand-500'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </div>

      {/* Analytics bar for admins */}
      {isAdmin && analyticsData && (
        <div className="flex items-center gap-6 px-6 py-3 bg-brand-600/10 border-b border-white/5 text-sm">
          <div className="flex items-center gap-2 text-zinc-300">
            <Users size={14} className="text-brand-400" />
            <span>{analyticsData.subscriberCount?.toLocaleString()} subscribers</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Eye size={14} className="text-brand-400" />
            <span>{analyticsData.totalViews?.toLocaleString()} total views</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Send size={14} className="text-brand-400" />
            <span>{analyticsData.totalMessages} posts</span>
          </div>
        </div>
      )}

      {/* Posts feed */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <div className="text-5xl mb-3">📢</div>
            <p className="font-medium text-white">No posts yet</p>
            {isAdmin && <p className="text-sm mt-1 text-zinc-400">Create the first post below</p>}
          </div>
        ) : (
          posts.map((post) => (
            <ChannelPostCard key={post._id} post={post} isAdmin={!!isAdmin} />
          ))
        )}
      </div>

      {/* Post composer — admins only */}
      {isAdmin && (
        <div className="border-t border-white/5 bg-surface-1 px-4 py-3">
          <div className="flex items-end gap-3">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Write a post to your subscribers…"
              rows={2}
              className="flex-1 px-4 py-3 rounded-2xl bg-surface-2 border border-white/10 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none scrollbar-thin"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handlePost(); }}
            />
            <button
              onClick={handlePost}
              disabled={posting || !newPost.trim()}
              className="p-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white transition disabled:opacity-40 flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[11px] text-zinc-600 mt-1.5 ml-1">Ctrl+Enter to post</p>
        </div>
      )}
    </div>
  );
}

function ChannelPostCard({ post, isAdmin }: { post: ChannelPost; isAdmin: boolean }) {
  const REACTIONS = ['❤️', '👍', '😮', '🔥', '👏'];

  return (
    <div className="bg-surface-1 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition">
      {/* Author */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar
          src={post.author?.profilePicture}
          fallback={getInitials(post.author?.username || 'A')}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{post.author?.username}</p>
          <p className="text-xs text-zinc-500">{formatMessageTime(post.createdAt)}</p>
        </div>
        {post.isPinned && (
          <Pin size={14} className="text-brand-400" title="Pinned" />
        )}
        {isAdmin && (
          <button className="p-1.5 rounded-lg hover:bg-surface-2 text-zinc-500 hover:text-red-400 transition">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>
      )}

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {post.media.map((m, i) => (
            m.mimeType?.startsWith('image/') ? (
              <img key={i} src={m.url} alt="" className="rounded-xl object-cover w-full max-h-48" />
            ) : m.mimeType?.startsWith('video/') ? (
              <video key={i} src={m.url} controls className="rounded-xl w-full" />
            ) : null
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-1">
          {REACTIONS.map((emoji) => {
            const r = post.reactions?.find((x) => x.emoji === emoji);
            return (
              <button key={emoji}
                className="flex items-center gap-1 px-2 py-1 rounded-xl hover:bg-surface-2 text-sm transition">
                <span>{emoji}</span>
                {r && r.count > 0 && <span className="text-xs text-zinc-400">{r.count}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Eye size={12} />
          <span>{post.viewCount?.toLocaleString() || 0}</span>
        </div>
      </div>
    </div>
  );
}
