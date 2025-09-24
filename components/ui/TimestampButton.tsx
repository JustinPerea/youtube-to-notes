'use client';

import { MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { createTimestampUrl, formatTimestamp, timestampStringToSeconds } from '@/lib/timestamps/utils';

interface TimestampButtonProps {
  time: string | number;
  videoUrl: string;
  isActive?: boolean;
  className?: string;
  onNavigate?: (url: string, event: MouseEvent<HTMLButtonElement>) => void;
}

export function TimestampButton({
  time,
  videoUrl,
  isActive = false,
  className,
  onNavigate,
}: TimestampButtonProps) {
  const seconds = typeof time === 'number' ? time : timestampStringToSeconds(time);
  const display = typeof time === 'number' ? formatTimestamp(time) : time;
  const targetUrl = createTimestampUrl(videoUrl, seconds);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (onNavigate) {
      onNavigate(targetUrl, event);
      return;
    }

    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-[#667eea] to-[#764ba2] px-3 py-1.5 font-mono text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#764ba2]',
        isActive ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-[var(--card-bg, #000)]' : 'ring-0',
        className,
      )}
      aria-pressed={isActive}
      title={`Open ${display} in YouTube`}
    >
      <span>{display}</span>
    </button>
  );
}
