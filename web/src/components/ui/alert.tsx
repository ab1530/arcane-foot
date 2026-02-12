"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
}

const variantClasses: Record<NonNullable<AlertProps["variant"]>, string> = {
  default: "bg-arcane-darkCard border border-arcane-darkBorder text-white",
  destructive: "bg-red-600/10 border border-red-600/40 text-red-200",
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);
Alert.displayName = "Alert";

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-inherit", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";
