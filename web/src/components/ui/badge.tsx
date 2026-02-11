"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const VARIANTS: Record<
  "default" | "secondary" | "outline" | "destructive",
  string
> = {
  default: "bg-arcane-accent text-arcane-dark",
  secondary: "bg-arcane-darkBorder text-arcane-grey",
  outline: "border border-arcane-darkBorder text-arcane-grey",
  destructive: "bg-red-600 text-white",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof VARIANTS;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";
