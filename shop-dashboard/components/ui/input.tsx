import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        step={type === 'number' ? 'any' : undefined}
        className={cn(
          'flex h-11 w-full rounded-[10px] border border-border bg-input px-3 py-2 text-sm text-primary-foreground placeholder:text-muted outline-none transition file:border-0 file:bg-transparent file:text-sm file:font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
