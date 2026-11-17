import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        'bg-[#2D6A2E] text-white hover:bg-[#245525] active:bg-[#1E4D1F] border border-[#2D6A2E] shadow-sm',
      secondary:
        'bg-[#7A5C2E] text-white hover:bg-[#634A24] active:bg-[#523C1B] border border-[#7A5C2E] shadow-sm',
      outline:
        'bg-[#FFFBF4] text-[#2C1810] border border-[#D4C9B5] hover:bg-[#EDE8DC] active:bg-[#E5DDCB]',
      ghost:
        'bg-transparent text-[#2C1810] hover:bg-[#EDE8DC] active:bg-[#E5DDCB]',
      danger:
        'bg-[#B8372D] text-white hover:bg-[#9E2C23] active:bg-[#85231C] border border-[#B8372D] shadow-sm',
    };

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 rounded gap-1.5 font-medium',
      md: 'text-sm px-3.5 py-2 rounded-md gap-2 font-medium',
      lg: 'text-base px-5 py-2.5 rounded-md gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A2E] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
