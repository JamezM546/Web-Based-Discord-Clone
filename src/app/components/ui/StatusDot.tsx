import React from 'react';

/**
 * Purely visual status indicator — aria-hidden="true" on purpose.
 *
 * Status is communicated to screen readers through the *parent* element's
 * accessible name (avatar alt text or button aria-label), never through this
 * dot itself.
 *
 * All statuses render as a plain filled circle; colour is the only differentiator:
 *   online  → green
 *   idle    → yellow  (Away)
 *   dnd     → red     (Do Not Disturb)
 *   offline → grey
 */

interface StatusDotProps {
  status: string;
  /** Background colour of the parent so the 2px border blends cleanly. */
  borderColor?: string;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  online:  'bg-green-500',
  idle:    'bg-yellow-500',
  dnd:     'bg-red-500',
  offline: 'bg-slate-400',
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'online':  return 'Online';
    case 'idle':    return 'Away';
    case 'dnd':     return 'Do not disturb';
    default:        return 'Offline';
  }
};

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  borderColor = '#0d1a2e',
  className = '',
}) => {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.offline;

  return (
    <span
      aria-hidden="true"
      className={`block size-3 rounded-full border-2 ${color} ${className}`}
      style={{ borderColor }}
    />
  );
};