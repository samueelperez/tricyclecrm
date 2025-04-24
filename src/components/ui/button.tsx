'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          
          // Variantes
          variant === 'default' && 'bg-gray-900 text-white hover:bg-gray-800',
          variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
          variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200',
          variant === 'outline' && 'border border-gray-300 bg-transparent hover:bg-gray-100',
          variant === 'ghost' && 'bg-transparent hover:bg-gray-100 text-gray-700',
          variant === 'link' && 'bg-transparent text-blue-600 hover:underline p-0 h-auto',
          variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
          
          // Tamaños
          size === 'default' && 'h-9 px-4 py-2',
          size === 'sm' && 'h-8 px-3 py-1 text-sm',
          size === 'lg' && 'h-10 px-8 text-base',
          size === 'icon' && 'h-9 w-9 p-0',
          
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button }; 