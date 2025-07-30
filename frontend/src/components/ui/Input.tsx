import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const inputVariants = cva(
  "flex w-full rounded-lg border border-night-border bg-night-surface px-3 py-2 text-sm text-night-text placeholder:text-night-text-secondary focus:outline-none focus:ring-2 focus:ring-night-accent focus:border-transparent transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-night-surface",
        glass: "bg-white/5 backdrop-blur-md border-white/10 focus:border-white/20",
      },
      inputSize: {
        sm: "h-8 px-2 text-xs",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps & MotionProps>(
  ({ className, variant, inputSize, icon, endIcon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-night-text-secondary pointer-events-none">
            {icon}
          </div>
        )}
        <motion.input
          className={cn(
            inputVariants({ variant, inputSize, className }),
            icon && "pl-10",
            endIcon && "pr-10"
          )}
          ref={ref}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {endIcon}
          </div>
        )}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-night-error text-xs mt-1 ml-1 absolute"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants }; 