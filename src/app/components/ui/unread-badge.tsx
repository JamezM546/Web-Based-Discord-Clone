import React from 'react';

interface UnreadBadgeProps {
  count: number;
  variant?: 'default' | 'mention';
}

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({ count, variant = 'default' }) => {
  if (count === 0) return null;

  return (
    <div
      className={`px-1.5 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
        variant === 'mention'
          ? 'bg-[#f23f42] text-white'
          : 'bg-white text-[#313338]'
      }`}
    >
      {count > 99 ? '99+' : count}
    </div>
  );
};
