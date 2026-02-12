"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ScrollAreaProps
  extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal" | "both";
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, orientation = "vertical", children, ...props }, ref) => {
    const overflowClass =
      orientation === "horizontal"
        ? "overflow-x-auto"
        : orientation === "both"
        ? "overflow-auto"
        : "overflow-y-auto";

    return (
      <div
        ref={ref}
        className={cn("relative", overflowClass, className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
ScrollArea.displayName = "ScrollArea";
