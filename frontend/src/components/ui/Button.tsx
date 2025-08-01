import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-night-bg disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-night-accent text-white hover:bg-night-accent-hover focus:ring-night-accent shadow-lg hover:shadow-xl hover:shadow-night-glow",
        secondary: "bg-night-surface text-night-text border border-night-border hover:bg-night-card-hover hover:border-night-accent",
        ghost: "text-night-text hover:bg-night-hover-bg hover:border-night-hover-border",
        destructive: "bg-night-error text-white hover:bg-red-600 focus:ring-night-error",
        outline: "border border-night-border text-night-text hover:bg-night-hover-bg hover:border-night-accent",
        glass: "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps & MotionProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {loading && (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants }; 