import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'forest' | 'walnut' | 'amber' | 'red' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const variantStyles = {
    forest: 'bg-[#E8F5E3] text-[#1E4D1F] border border-[#2D6A2E]/20',
    walnut: 'bg-[#F0E6D3] text-[#7A5C2E] border border-[#7A5C2E]/25',
    amber: 'bg-[#FEF6E7] text-[#9A6704] border border-[#D4920A]/25',
    red: 'bg-[#FDECEA] text-[#B8372D] border border-[#B8372D]/25',
    neutral: 'bg-[#EDE8DC] text-[#2C1810] border border-[#D4C9B5]',
    outline: 'bg-transparent text-[#6B5B4E] border border-[#D4C9B5]',
  };

  const dotColors = {
    forest: 'bg-[#2D6A2E]',
    walnut: 'bg-[#7A5C2E]',
    amber: 'bg-[#D4920A]',
    red: 'bg-[#B8372D]',
    neutral: 'bg-[#6B5B4E]',
    outline: 'bg-[#6B5B4E]',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'inline-block rounded-full w-1.5 h-1.5 shrink-0',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
