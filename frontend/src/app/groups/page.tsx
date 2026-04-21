'use client';
import { useQuery } from '@tanstack/react-query';
import { Users, Plus } from 'lucide-react';
import { chatApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { getInitials, formatChatTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { NewChatModal } from '@/components/chat/NewChatModal';

export default function GroupsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);

  const { data: chats } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatApi.getAll().then((r) => r.data.chats),
  });

  const groups = (chats || []).filter((c: any) => c.type === 'group');

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="px-6 py-5 border-b border-white/5 bg-surface-1 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Groups</h1>
          <p className="text-sm text-zinc-400">{groups.length} groups</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition">
          <Plus size={16} /> New Group
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="font-medium text-white">No groups yet</p>
            <p className="text-sm mt-1">Create a group to chat with multiple people</p>
          </div>
        ) : (
          groups.map((chat: any) => (
            <div key={chat._id} onClick={() => router.push(`/chat/${chat._id}`)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-surface-1 border border-white/5 hover:border-white/10 transition cursor-pointer">
              <Avatar src={chat.group?.profilePicture} fallback={getInitials(chat.group?.name || 'G')} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <p className="font-semibold text-white">{chat.group?.name}</p>
                  <span className="text-xs text-zinc-500">{formatChatTime(chat.lastActivity)}</span>
                </div>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {chat.group?.members?.length || 0} members
                </p>
                {chat.lastMessage && (
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {chat.lastMessage.content || '📎 Media'}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showNew && <NewChatModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
