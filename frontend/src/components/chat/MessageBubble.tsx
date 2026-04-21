'use client';
import { useState } from 'react';
import { Check, CheckCheck, Reply, MoreVertical, Edit2, Trash2, Star, Forward, Download } from 'lucide-react';
import { Message } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatMessageTime, getInitials, formatFileSize } from '@/lib/utils';
import Image from 'next/image';

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onReply?: (msg: Message) => void;
  onEdit?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onReact?: (msg: Message, emoji: string) => void;
  onForward?: (msg: Message) => void;
}

const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

export function MessageBubble({ message, isOwn, showAvatar, onReply, onEdit, onDelete, onReact, onForward }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  if (message.isDeleted) {
    return (
      <div className={cn('flex gap-2 items-end mb-1', isOwn ? 'flex-row-reverse' : 'flex-row')}>
        <div className="px-4 py-2 rounded-2xl bg-surface-2/50 text-zinc-500 text-sm italic">
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-zinc-500 bg-surface-2 px-4 py-1.5 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const sender = message.sender as any;

  return (
    <div className={cn('flex gap-2 items-end mb-1 group', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && (
            <Avatar src={sender?.profilePicture} fallback={getInitials(sender?.username || 'U')} size="sm" />
          )}
        </div>
      )}

      <div className={cn('flex flex-col max-w-xs lg:max-w-md xl:max-w-lg', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender name in groups */}
        {!isOwn && showAvatar && (
          <p className="text-xs text-brand-400 font-medium mb-1 ml-1">{sender?.username}</p>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={cn('px-3 py-2 rounded-t-xl mb-0.5 border-l-2 border-brand-500 max-w-full', isOwn ? 'bg-brand-800/40' : 'bg-surface-2')}>
            <p className="text-xs text-brand-400 font-medium">
              {(message.replyTo.sender as any)?.username || 'Reply'}
            </p>
            <p className="text-xs text-zinc-400 truncate">
              {message.replyTo.content || '📎 Media'}
            </p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'relative rounded-2xl px-4 py-2',
            isOwn ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-surface-2 text-white rounded-bl-sm',
            message.replyTo && 'rounded-tl-sm rounded-tr-sm'
          )}
          onDoubleClick={() => onReact?.(message, '❤️')}
        >
          {/* Forwarded badge */}
          {message.isForwarded && (
            <p className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
              <Forward size={10} /> Forwarded
            </p>
          )}

          {/* Content by type */}
          {message.type === 'text' && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {message.type === 'image' && message.media && (
            <div className="rounded-xl overflow-hidden mb-1">
              <Image
                src={message.media.url}
                alt="Image"
                width={280}
                height={200}
                className="object-cover w-full max-h-64 rounded-xl"
              />
              {message.content && <p className="text-sm mt-2">{message.content}</p>}
            </div>
          )}

          {message.type === 'video' && message.media && (
            <video src={message.media.url} controls className="rounded-xl max-w-xs max-h-64 w-full" />
          )}

          {(message.type === 'audio' || message.type === 'voice') && message.media && (
            <audio src={message.media.url} controls className="max-w-xs w-full" />
          )}

          {message.type === 'document' && message.media && (
            <a
              href={message.media.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition',
                isOwn ? 'border-white/20 hover:bg-white/10' : 'border-white/10 hover:bg-white/5'
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-brand-600/30 flex items-center justify-center flex-shrink-0">
                <Download size={16} className="text-brand-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{message.media.fileName || 'Document'}</p>
                {message.media.fileSize && (
                  <p className="text-[10px] text-zinc-400">{formatFileSize(message.media.fileSize)}</p>
                )}
              </div>
            </a>
          )}

          {/* Timestamp + status */}
          <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
            {message.isEdited && <span className="text-[10px] text-zinc-400 italic">edited</span>}
            <span className="text-[10px] text-zinc-400">{formatMessageTime(message.createdAt)}</span>
            {isOwn && (
              <span className="ml-0.5">
                {message.status === 'read' ? (
                  <CheckCheck size={12} className="text-blue-400" />
                ) : message.status === 'delivered' ? (
                  <CheckCheck size={12} className="text-zinc-400" />
                ) : (
                  <Check size={12} className="text-zinc-400" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reactions display */}
        {message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact?.(message, r.emoji)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-2 border border-white/10 text-xs hover:bg-surface-3 transition"
              >
                <span>{r.emoji}</span>
                <span className="text-zinc-400">{r.users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons — visible on hover */}
      <div className={cn(
        'opacity-0 group-hover:opacity-100 transition flex items-center gap-1 self-center',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}>
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-zinc-500 hover:text-white transition relative"
        >
          <span className="text-sm">😊</span>
          {showReactions && (
            <div className={cn(
              'absolute bottom-full mb-1 flex gap-1 bg-surface-1 border border-white/10 rounded-2xl p-2 shadow-xl z-10',
              isOwn ? 'right-0' : 'left-0'
            )}>
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => { e.stopPropagation(); onReact?.(message, emoji); setShowReactions(false); }}
                  className="text-xl hover:scale-125 transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </button>

        <button
          onClick={() => onReply?.(message)}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-zinc-500 hover:text-white transition"
        >
          <Reply size={14} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg hover:bg-surface-2 text-zinc-500 hover:text-white transition"
          >
            <MoreVertical size={14} />
          </button>
          {showMenu && (
            <div className={cn(
              'absolute bottom-full mb-1 bg-surface-1 border border-white/10 rounded-xl shadow-xl z-10 py-1 min-w-36',
              isOwn ? 'right-0' : 'left-0'
            )}>
              {isOwn && message.type === 'text' && (
                <button onClick={() => { onEdit?.(message); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface-2 text-zinc-300 hover:text-white transition">
                  <Edit2 size={13} /> Edit
                </button>
              )}
              <button onClick={() => { onForward?.(message); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface-2 text-zinc-300 hover:text-white transition">
                <Forward size={13} /> Forward
              </button>
              <button onClick={() => { onDelete?.(message); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface-2 text-red-400 transition">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
