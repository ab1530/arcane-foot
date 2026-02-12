import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcane-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary: Arcane yellow accent
        default: "bg-arcane-accent text-arcane-dark hover:bg-arcane-accentHover hover:shadow-[0_0_20px_rgba(228,255,59,0.3)]",
        primary: "bg-arcane-accent text-arcane-dark hover:bg-arcane-accentHover hover:shadow-[0_0_20px_rgba(228,255,59,0.3)]",
        // Secondary: Outlined with yellow
        secondary: "bg-arcane-darkBorder text-white hover:bg-arcane-dark border border-arcane-darkBorder",
        // Destructive: Red for dangerous actions
        destructive: "bg-red-600 text-white hover:bg-red-700",
        // Outline: Grey border
        outline: "border-2 border-arcane-grey text-arcane-grey bg-transparent hover:border-arcane-accent hover:text-arcane-accent",
        // Ghost: Minimal
        ghost: "text-white hover:bg-arcane-darkAlt hover:text-arcane-accent",
        // Link: Simple text
        link: "text-arcane-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "px-5 py-2.5 text-sm",
        sm: "px-3 py-1.5 text-sm",
        lg: "px-6 py-3 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className, loading && "cursor-wait")}
        ref={ref}
        disabled={isDisabled}
        data-loading={loading ? "true" : undefined}
        aria-busy={loading ? "true" : undefined}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
