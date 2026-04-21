import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(date: string | Date): string {
  const d = new Date(date);
  return format(d, 'HH:mm');
}

export function formatChatTime(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  if (isThisWeek(d)) return format(d, 'EEE');
  return format(d, 'dd/MM/yy');
}

export function formatLastSeen(timestamp: number | null | undefined): string {
  if (!timestamp) return 'Long ago';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.substring(0, n) + '…' : str;
}

export function getMessagePreview(message: any): string {
  if (!message) return '';
  if (message.isDeleted) return '🚫 This message was deleted';
  switch (message.type) {
    case 'image': return '📷 Photo';
    case 'video': return '🎬 Video';
    case 'audio': return '🎵 Audio';
    case 'voice': return '🎤 Voice message';
    case 'document': return `📎 ${message.media?.fileName || 'Document'}`;
    case 'system': return message.content || '';
    default: return message.content || '';
  }
}

export function isImageFile(mimeType?: string): boolean {
  return !!mimeType?.startsWith('image/');
}

export function isVideoFile(mimeType?: string): boolean {
  return !!mimeType?.startsWith('video/');
}

export function isAudioFile(mimeType?: string): boolean {
  return !!mimeType?.startsWith('audio/');
}
