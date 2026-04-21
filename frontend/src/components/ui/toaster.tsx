'use client';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; type: ToastType; message: string; }

let globalToast: ((type: ToastType, message: string) => void) | null = null;
export const showToast = (type: ToastType, message: string) => globalToast?.(type, message);

const icons = { success: CheckCircle, error: AlertCircle, info: Info };
const colors = {
  success: 'border-green-500/30 bg-green-500/10 text-green-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-brand-500/30 bg-brand-500/10 text-brand-300',
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  useEffect(() => { globalToast = toast; return () => { globalToast = null; }; }, [toast]);

  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div key={t.id} className={cn(
            'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl pointer-events-auto animate-fade-in',
            colors[t.type]
          )}>
            <Icon size={16} className="shrink-0 mt-0.5" />
            <p className="text-sm flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100 transition">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
