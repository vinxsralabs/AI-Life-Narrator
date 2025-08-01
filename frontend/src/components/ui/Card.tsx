import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const cardVariants = cva(
  "rounded-xl border transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-night-card border-night-border hover:bg-night-card-hover hover:border-night-accent hover:shadow-lg hover:shadow-night-glow",
        glass: "bg-white/5 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-white/10",
        elevated: "bg-night-surface border-night-border shadow-lg hover:bg-night-card-hover hover:shadow-xl hover:shadow-night-glow hover:border-night-accent",
        outline: "bg-transparent border-night-border hover:bg-night-hover-bg hover:border-night-accent",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps & MotionProps>(
  ({ className, variant, padding, hover = true, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
> (({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-night-text", className)}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-night-text-secondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }; 