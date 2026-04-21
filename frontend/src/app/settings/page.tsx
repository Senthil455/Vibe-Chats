'use client';
import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { userApi, authApi } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { getInitials } from '@/lib/utils';
import { Camera, Shield, Bell, Moon, LogOut, User, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { disconnectSocket } from '@/lib/socket';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<'profile' | 'privacy' | 'notifications'>('profile');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [privacy, setPrivacy] = useState({
    lastSeenVisibility: user?.privacy?.lastSeenVisibility || 'everyone',
    profilePhotoVisibility: user?.privacy?.profilePhotoVisibility || 'everyone',
    readReceipts: user?.privacy?.readReceipts ?? true,
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('username', username);
      fd.append('bio', bio);
      const res = await userApi.updateProfile(fd);
      updateUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      await userApi.updatePrivacy(privacy);
      updateUser({ privacy });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('profilePicture', file);
    fd.append('username', username);
    const res = await userApi.updateProfile(fd);
    updateUser({ profilePicture: res.data.user.profilePicture });
  };

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    logout();
    disconnectSocket();
    router.push('/auth/login');
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="px-6 py-5 border-b border-white/5 bg-surface-1">
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Profile Card */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar src={user?.profilePicture} fallback={getInitials(user?.username || 'U')} size="xl" />
                <button onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center border-2 border-surface-1 hover:bg-brand-500 transition">
                  <Camera size={14} className="text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="font-bold text-white text-lg">{user?.username}</p>
                <p className="text-zinc-400 text-sm">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${user?.isEmailVerified ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className="text-xs text-zinc-500">{user?.isEmailVerified ? 'Verified' : 'Not verified'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-surface-1 rounded-2xl">
            {[
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'privacy', icon: Shield, label: 'Privacy' },
              { id: 'notifications', icon: Bell, label: 'Notifications' },
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTab(id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition ${tab === id ? 'bg-brand-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                <Icon size={15} />{label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                  placeholder="Tell people a bit about yourself…"
                  className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm resize-none" />
              </div>
              <button onClick={handleSaveProfile} disabled={saving}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition ${saved ? 'bg-green-600 text-white' : 'bg-brand-600 hover:bg-brand-500 text-white'} disabled:opacity-50`}>
                {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* Privacy Tab */}
          {tab === 'privacy' && (
            <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
              {[
                { key: 'lastSeenVisibility', label: 'Last Seen', desc: 'Who can see when you were last online' },
                { key: 'profilePhotoVisibility', label: 'Profile Photo', desc: 'Who can see your profile picture' },
              ].map(({ key, label, desc }) => (
                <div key={key}>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-zinc-500 mb-2">{desc}</p>
                  <div className="flex gap-2">
                    {['everyone', 'contacts', 'nobody'].map((v) => (
                      <button key={v} onClick={() => setPrivacy({ ...privacy, [key]: v })}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition ${(privacy as any)[key] === v ? 'bg-brand-600 text-white' : 'bg-surface-2 text-zinc-400 hover:text-white'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Read Receipts</p>
                  <p className="text-xs text-zinc-500">Show blue ticks when you read messages</p>
                </div>
                <button onClick={() => setPrivacy({ ...privacy, readReceipts: !privacy.readReceipts })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${privacy.readReceipts ? 'bg-brand-600' : 'bg-surface-3'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${privacy.readReceipts ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <button onClick={handleSavePrivacy} disabled={saving}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition ${saved ? 'bg-green-600 text-white' : 'bg-brand-600 hover:bg-brand-500 text-white'} disabled:opacity-50`}>
                {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Privacy Settings'}
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {tab === 'notifications' && (
            <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
              {[
                { label: 'Message notifications', desc: 'Get notified for new messages' },
                { label: 'Group notifications', desc: 'Get notified for group activity' },
                { label: 'Channel notifications', desc: 'Get notified for new channel posts' },
                { label: 'Mention notifications', desc: 'Get notified when mentioned' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-zinc-500">{desc}</p>
                  </div>
                  <button className="w-11 h-6 rounded-full bg-brand-600 relative">
                    <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Danger Zone */}
          <div className="glass rounded-2xl border border-red-500/20 overflow-hidden">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-4 text-red-400 hover:bg-red-500/10 transition">
              <LogOut size={18} />
              <span className="text-sm font-medium">Sign Out</span>
              <ChevronRight size={16} className="ml-auto opacity-50" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
