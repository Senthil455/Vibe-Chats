'use client';
import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, Mic, X, Image as ImageIcon, File } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Theme } from 'emoji-picker-react';
import { cn } from '@/lib/utils';
import { Message } from '@/types';

interface Props {
  chatId: string;
  replyTo?: Message | null;
  onClearReply: () => void;
  onSendText: (content: string) => void;
  onSendFile: (file: File, content?: string) => void;
  disabled?: boolean;
}

export function MessageInput({ chatId, replyTo, onClearReply, onSendText, onSendFile, disabled }: Props) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSubmit = useCallback(() => {
    if (file) {
      onSendFile(file, text.trim() || undefined);
      setFile(null);
      setFilePreview(null);
      setText('');
      return;
    }
    if (!text.trim()) return;
    onSendText(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, file, onSendText, onSendFile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setFilePreview(url);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const voiceFile = new File([blob], 'voice.webm', { type: 'audio/webm' });
        onSendFile(voiceFile);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const canSend = text.trim().length > 0 || !!file;

  return (
    <div className="border-t border-white/5 bg-surface-1 px-4 py-3">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-surface-2 rounded-xl border-l-2 border-brand-500">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-400 font-medium">
              Replying to {(replyTo.sender as any)?.username}
            </p>
            <p className="text-xs text-zinc-400 truncate">{replyTo.content || '📎 Media'}</p>
          </div>
          <button onClick={onClearReply} className="text-zinc-500 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* File preview */}
      {file && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-surface-2 rounded-xl">
          {filePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={filePreview} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-brand-600/20 flex items-center justify-center">
              <File size={18} className="text-brand-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{file.name}</p>
            <p className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={() => { setFile(null); setFilePreview(null); }} className="text-zinc-500 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Emoji picker */}
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2.5 rounded-xl hover:bg-surface-2 text-zinc-400 hover:text-white transition flex-shrink-0"
          >
            <Smile size={20} />
          </button>
          {showEmoji && (
            <div className="absolute bottom-full left-0 mb-2 z-20">
              <EmojiPicker
                theme={Theme.DARK}
                onEmojiClick={(e) => { setText((t) => t + e.emoji); setShowEmoji(false); }}
                height={380}
                width={320}
              />
            </div>
          )}
        </div>

        {/* File attachment */}
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2.5 rounded-xl hover:bg-surface-2 text-zinc-400 hover:text-white transition flex-shrink-0"
        >
          <Paperclip size={20} />
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip" />

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Only admins can send messages' : 'Message…'}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 pr-4 rounded-2xl bg-surface-2 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none text-sm transition disabled:opacity-50 scrollbar-thin"
            style={{ minHeight: '44px', maxHeight: '140px' }}
          />
        </div>

        {/* Send / Voice */}
        {canSend ? (
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition flex-shrink-0 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        ) : (
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={cn(
              'p-2.5 rounded-xl transition flex-shrink-0',
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'hover:bg-surface-2 text-zinc-400 hover:text-white'
            )}
            title="Hold to record voice message"
          >
            <Mic size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
