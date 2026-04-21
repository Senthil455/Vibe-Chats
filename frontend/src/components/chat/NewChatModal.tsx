'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Users } from 'lucide-react';
import { userApi, chatApi, groupApi } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { getInitials } from '@/lib/utils';

interface Props { onClose: () => void; }

export function NewChatModal({ onClose }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'chat' | 'group'>('chat');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) { setResults([]); return; }
    const res = await userApi.search(q);
    setResults(res.data.users);
  };

  const handleSelectUser = (u: any) => {
    if (tab === 'chat') {
      startPrivateChat(u._id);
    } else {
      setSelected((prev) =>
        prev.some((s) => s._id === u._id) ? prev.filter((s) => s._id !== u._id) : [...prev, u]
      );
    }
  };

  const startPrivateChat = async (userId: string) => {
    setLoading(true);
    try {
      const res = await chatApi.getOrCreate(userId);
      onClose();
      router.push(`/chat/${res.data.chat._id}`);
    } finally { setLoading(false); }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length === 0) return;
    setLoading(true);
    try {
      const res = await groupApi.create({
        name: groupName,
        memberIds: selected.map((u) => u._id),
      });
      onClose();
      router.push(`/chat/${res.data.chatId}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl w-full max-w-md border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white">
            {tab === 'chat' ? 'New Message' : 'New Group'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3">
          <button
            onClick={() => setTab('chat')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${tab === 'chat' ? 'bg-brand-600 text-white' : 'text-zinc-400 hover:bg-surface-2'}`}
          >
            Direct Message
          </button>
          <button
            onClick={() => setTab('group')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${tab === 'group' ? 'bg-brand-600 text-white' : 'text-zinc-400 hover:bg-surface-2'}`}
          >
            <span className="flex items-center justify-center gap-1.5"><Users size={14} />Group</span>
          </button>
        </div>

        <div className="p-4 space-y-3">
          {tab === 'group' && (
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name…"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
            />
          )}

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full pl-9 py-2.5 rounded-xl bg-surface-2 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
            />
          </div>

          {/* Selected chips for group */}
          {tab === 'group' && selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((u) => (
                <div key={u._id} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-600/20 text-brand-300 text-xs">
                  <span>{u.username}</span>
                  <button onClick={() => setSelected((s) => s.filter((x) => x._id !== u._id))}>
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
            {results.map((u) => (
              <button
                key={u._id}
                onClick={() => handleSelectUser(u)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition text-left ${
                  selected.some((s) => s._id === u._id)
                    ? 'bg-brand-600/15 border border-brand-500/20'
                    : 'hover:bg-surface-2'
                }`}
              >
                <Avatar src={u.profilePicture} fallback={getInitials(u.username)} size="md" />
                <div>
                  <p className="text-sm font-medium text-white">{u.username}</p>
                  <p className="text-xs text-zinc-500">{u.bio || u.email}</p>
                </div>
              </button>
            ))}
            {search && results.length === 0 && (
              <p className="text-center text-zinc-500 text-sm py-4">No users found</p>
            )}
          </div>

          {tab === 'group' && selected.length > 0 && (
            <button
              onClick={createGroup}
              disabled={loading || !groupName.trim()}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Creating…' : `Create Group (${selected.length + 1} members)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
