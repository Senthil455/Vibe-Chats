'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { chatApi, userApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { cn, getInitials, getMessagePreview, formatChatTime, truncate } from '@/lib/utils';
import { Chat, User } from '@/types';
import {
  MessageSquare, Users, Radio, Settings, Search,
  Plus, LogOut, Star, X, Menu,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { NewChatModal } from '@/components/chat/NewChatModal';
import { disconnectSocket } from '@/lib/socket';

const NAV = [
  { href: '/chat', icon: MessageSquare, label: 'Chats' },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/channels', icon: Radio, label: 'Channels' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { chats, setChats, activeChatId, onlineUsers } = useChatStore();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { data } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatApi.getAll().then((r) => r.data.chats),
    refetchInterval: 30000,
  });

  useEffect(() => { if (data) setChats(data); }, [data]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await userApi.search(search);
        setSearchResults(res.data.users);
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    disconnectSocket();
    logout();
    router.push('/auth/login');
  };

  const startChat = async (targetUserId: string) => {
    try {
      const res = await chatApi.getOrCreate(targetUserId);
      setSearch('');
      setSearchResults([]);
      router.push(`/chat/${res.data.chat._id}`);
    } catch {}
  };

  const filteredChats = chats.filter((c) => {
    if (!search.trim()) return true;
    if (c.type === 'group') return c.group?.name?.toLowerCase().includes(search.toLowerCase());
    const other = c.participants.find((p) => p._id !== user?._id);
    return other?.username?.toLowerCase().includes(search.toLowerCase());
  });

  const isActive = (href: string) =>
    href === '/chat' ? pathname.startsWith('/chat') : pathname.startsWith(href);

  return (
    <>
      <aside className={cn(
        'flex flex-col h-screen border-r border-white/5 bg-surface-1 transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-72'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-white/5">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-sm">💬</span>
              </div>
              <span className="font-bold text-white text-lg">VibesChat</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn('p-1.5 rounded-lg hover:bg-surface-2 text-zinc-400 hover:text-white transition', collapsed && 'mx-auto')}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-2 py-3 border-b border-white/5 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className={cn('nav-item', isActive(href) && 'nav-item-active')}>
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
          <button onClick={() => router.push('/chat/starred')} className="nav-item w-full text-left">
            <Star size={18} className="shrink-0" />
            {!collapsed && <span>Starred</span>}
          </button>
        </nav>

        {!collapsed && (
          <>
            {/* Search + new */}
            <div className="px-3 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Messages</span>
                <button onClick={() => setShowNewChat(true)}
                  className="p-1 rounded-lg hover:bg-surface-2 text-zinc-400 hover:text-white transition">
                  <Plus size={15} />
                </button>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chats or people…"
                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-surface-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500 border border-white/5"
                />
                {search && (
                  <button onClick={() => { setSearch(''); setSearchResults([]); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* User search results */}
            {searchResults.length > 0 && (
              <div className="px-3 pb-2 border-b border-white/5">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">People</p>
                <div className="space-y-0.5">
                  {searchResults.map((u) => (
                    <button key={u._id} onClick={() => startChat(u._id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-2 transition text-left">
                      <Avatar src={u.profilePicture} fallback={getInitials(u.username)} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{u.username}</p>
                        {u.bio && <p className="text-xs text-zinc-500 truncate">{u.bio}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2 space-y-0.5">
              {filteredChats.map((chat) => {
                const other = chat.participants.find((p) => p._id !== user?._id);
                return (
                  <ChatItem
                    key={chat._id}
                    chat={chat}
                    currentUserId={user?._id || ''}
                    isActive={activeChatId === chat._id || pathname === `/chat/${chat._id}`}
                    isOnline={onlineUsers.has(other?._id || '')}
                  />
                );
              })}
              {filteredChats.length === 0 && (
                <div className="text-center py-10 px-4">
                  <p className="text-4xl mb-3">💬</p>
                  <p className="text-zinc-400 text-sm">No chats yet</p>
                  <button onClick={() => setShowNewChat(true)}
                    className="mt-3 text-brand-400 text-sm hover:text-brand-300">
                    Start one
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* User info */}
        <div className={cn(
          'border-t border-white/5 p-3 flex items-center gap-3',
          collapsed && 'justify-center'
        )}>
          <div className="relative shrink-0">
            <Avatar src={user?.profilePicture} fallback={getInitials(user?.username || 'U')} size="sm" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface-1" />
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                <p className="text-xs text-green-400">Online</p>
              </div>
              <button onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-surface-2 text-zinc-400 hover:text-red-400 transition">
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
      </aside>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </>
  );
}

function ChatItem({ chat, currentUserId, isActive, isOnline }: {
  chat: Chat; currentUserId: string; isActive: boolean; isOnline: boolean;
}) {
  const router = useRouter();
  const { setActiveChat } = useChatStore();
  const isGroup = chat.type === 'group';
  const name = isGroup
    ? (chat.group?.name || 'Group')
    : (chat.participants.find((p) => p._id !== currentUserId)?.username || 'Unknown');
  const avatar = isGroup
    ? chat.group?.profilePicture
    : chat.participants.find((p) => p._id !== currentUserId)?.profilePicture;
  const preview = chat.lastMessage ? getMessagePreview(chat.lastMessage) : 'No messages';
  const time = chat.lastActivity ? formatChatTime(chat.lastActivity) : '';

  return (
    <button
      onClick={() => { setActiveChat(chat._id); router.push(`/chat/${chat._id}`); }}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
        isActive ? 'bg-brand-600/20' : 'hover:bg-surface-2'
      )}
    >
      <div className="relative shrink-0">
        <Avatar src={avatar} fallback={getInitials(name)} size="md" isGroup={isGroup} />
        {!isGroup && isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-surface-1" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className={cn('text-sm font-semibold truncate', isActive ? 'text-brand-300' : 'text-white')}>
            {name}
          </span>
          <span className="text-[11px] text-zinc-500 shrink-0">{time}</span>
        </div>
        <p className="text-xs text-zinc-500 truncate mt-0.5">{truncate(preview, 38)}</p>
      </div>
    </button>
  );
}
