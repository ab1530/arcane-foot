"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AvatarProps = React.HTMLAttributes<HTMLDivElement>;

export function Avatar({ className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-arcane-darkBorder/60",
        className,
      )}
      {...props}
    />
  );
}

export type AvatarImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

export const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, alt, ...props }, ref) => (
    <img
      ref={ref}
      className={cn("h-full w-full object-cover", className)}
      alt={alt ?? ""}
      {...props}
    />
  ),
);
AvatarImage.displayName = "AvatarImage";

export type AvatarFallbackProps = React.HTMLAttributes<HTMLSpanElement>;

export const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  AvatarFallbackProps
>(({ className, children, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-arcane-dark text-sm font-semibold text-arcane-grey",
      className,
    )}
    {...props}
  >
    {children}
  </span>
));
AvatarFallback.displayName = "AvatarFallback";
