'use client';
import { useQuery } from '@tanstack/react-query';
import { messageApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials, formatMessageTime, getMessagePreview } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Star, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Message } from '@/types';

export default function StarredPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['starred-messages'],
    queryFn: () => messageApi.getStarred().then((r) => r.data.messages),
  });

  const messages: Message[] = data || [];

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="px-6 py-4 border-b border-white/5 bg-surface-1 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-zinc-400 hover:text-white transition">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Star size={18} className="text-yellow-400" /> Starred Messages
          </h1>
          <p className="text-xs text-zinc-400">{messages.length} saved messages</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <Star size={40} className="mb-3 opacity-30" />
            <p className="font-medium text-white">No starred messages</p>
            <p className="text-sm mt-1">Star important messages to find them here</p>
          </div>
        )}
        {messages.map((msg) => {
          const sender = msg.sender as any;
          return (
            <div key={msg._id}
              onClick={() => router.push(`/chat/${msg.chat}`)}
              className="flex items-start gap-3 p-4 rounded-2xl bg-surface-1 border border-white/5 hover:border-white/10 transition cursor-pointer">
              <Avatar
                src={sender?.profilePicture}
                fallback={getInitials(sender?.username || 'U')}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{sender?.username}</span>
                  <span className="text-xs text-zinc-500 shrink-0">{formatMessageTime(msg.createdAt)}</span>
                </div>
                <p className="text-sm text-zinc-400 mt-0.5 truncate">{getMessagePreview(msg)}</p>
                {msg.media?.url && msg.media.mimeType?.startsWith('image/') && (
                  <img src={msg.media.url} alt="" className="mt-2 rounded-lg max-h-32 object-cover" />
                )}
              </div>
              <Star size={14} className="text-yellow-400 shrink-0 mt-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
