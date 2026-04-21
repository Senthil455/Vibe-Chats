'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Hash, Users, TrendingUp, X } from 'lucide-react';
import { channelApi } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { getInitials } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function ChannelsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<'discover' | 'mine'>('mine');

  const { data: myChannels } = useQuery({
    queryKey: ['my-channels'],
    queryFn: () => channelApi.getMy().then((r) => r.data.channels),
  });

  const { data: discovered } = useQuery({
    queryKey: ['channels-search', search],
    queryFn: () => channelApi.search(search).then((r) => r.data.channels),
  });

  const handleSubscribe = async (channelId: string) => {
    await channelApi.subscribe(channelId);
    qc.invalidateQueries({ queryKey: ['my-channels'] });
    qc.invalidateQueries({ queryKey: ['channels-search'] });
  };

  const channels = tab === 'mine' ? (myChannels || []) : (discovered || []);

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 bg-surface-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Channels</h1>
            <p className="text-sm text-zinc-400">Broadcast to unlimited subscribers</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition"
          >
            <Plus size={16} /> New Channel
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {['mine', 'discover'].map((t) => (
            <button key={t} onClick={() => setTab(t as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${tab === t ? 'bg-brand-600 text-white' : 'text-zinc-400 hover:bg-surface-2'}`}>
              {t === 'mine' ? 'Subscribed' : 'Discover'}
            </button>
          ))}
        </div>

        {tab === 'discover' && (
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels…"
              className="w-full pl-9 py-2.5 rounded-xl bg-surface-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
        )}
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
        {channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <Hash size={40} className="mb-3 opacity-30" />
            <p className="font-medium text-white">
              {tab === 'mine' ? 'No subscriptions yet' : 'No channels found'}
            </p>
            <p className="text-sm mt-1">
              {tab === 'mine' ? 'Discover and subscribe to channels' : 'Try a different search'}
            </p>
          </div>
        ) : (
          channels.map((ch: any) => (
            <div key={ch._id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-surface-1 border border-white/5 hover:border-white/10 transition cursor-pointer"
              onClick={() => router.push(`/channels/${ch._id}`)}>
              <Avatar src={ch.profilePicture} fallback={getInitials(ch.name)} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white">{ch.name}</p>
                  <span className="text-xs text-zinc-500">@{ch.handle}</span>
                </div>
                {ch.description && <p className="text-sm text-zinc-400 truncate mt-0.5">{ch.description}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Users size={11} /> {ch.subscriberCount?.toLocaleString()} subscribers
                  </span>
                </div>
              </div>
              {tab === 'discover' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleSubscribe(ch._id); }}
                  className="px-3 py-1.5 rounded-xl bg-brand-600/20 text-brand-400 text-sm hover:bg-brand-600 hover:text-white transition"
                >
                  Subscribe
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showCreate && <CreateChannelModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['my-channels'] }); }} />}
    </div>
  );
}

function CreateChannelModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !handle.trim()) { setError('Name and handle are required'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', name); fd.append('handle', handle.toLowerCase());
      fd.append('description', description); fd.append('isPublic', String(isPublic));
      const res = await channelApi.create(fd);
      onCreated();
      router.push(`/channels/${res.data.channel._id}`);
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to create'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass rounded-2xl w-full max-w-md border border-white/10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white">Create Channel</h2>
          <button onClick={onClose}><X size={20} className="text-zinc-400 hover:text-white" /></button>
        </div>
        <div className="p-5 space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Channel name"
            className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm" />
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
            <input value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="handle" className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface-2 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm" />
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={3}
            className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm resize-none" />
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setIsPublic(!isPublic)}
              className={`w-11 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-brand-600' : 'bg-surface-3'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-zinc-300">{isPublic ? 'Public channel' : 'Private channel'}</span>
          </label>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleCreate} disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Channel'}
          </button>
        </div>
      </div>
    </div>
  );
}
