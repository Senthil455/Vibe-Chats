import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  fallback: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isGroup?: boolean;
  className?: string;
}

const sizes = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
};

const bgColors = [
  'bg-violet-600','bg-blue-600','bg-emerald-600',
  'bg-orange-600','bg-pink-600','bg-cyan-600','bg-red-600',
];

function getBg(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function Avatar({ src, fallback, size = 'md', isGroup, className }: AvatarProps) {
  return (
    <div className={cn(
      'flex items-center justify-center overflow-hidden shrink-0 font-semibold text-white select-none',
      sizes[size],
      isGroup ? 'rounded-xl' : 'rounded-full',
      !src && getBg(fallback),
      className
    )}>
      {src
        ? <img src={src} alt={fallback} className="w-full h-full object-cover" />
        : <span>{fallback}</span>}
    </div>
  );
}
