import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500 bg-surface">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.05))' }}
      >
        <MessageSquare size={40} className="text-brand-500" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Your Messages</h2>
      <p className="text-sm text-center max-w-xs leading-relaxed">
        Select a conversation from the sidebar or start a new chat with the <span className="text-brand-400">+</span> button.
      </p>

      <div className="mt-10 grid grid-cols-3 gap-4 text-center">
        {[
          { emoji: '💬', label: 'Private Chats' },
          { emoji: '👥', label: 'Group Chats' },
          { emoji: '📢', label: 'Channels' },
        ].map(({ emoji, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-1 border border-white/5">
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs text-zinc-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
