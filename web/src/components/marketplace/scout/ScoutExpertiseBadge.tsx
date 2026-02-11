/**
 * ScoutExpertiseBadge Component
 * Reusable badge for leagues/positions with icons
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ScoutExpertiseBadgeProps {
  label: string;
  icon?: string;
  variant?: "league" | "position" | "age" | "default";
  className?: string;
}

export function ScoutExpertiseBadge({
  label,
  icon,
  variant = "default",
  className,
}: ScoutExpertiseBadgeProps) {
  const variantStyles = {
    league: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    position: "bg-green-500/20 text-green-300 border-green-500/30",
    age: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    default: "bg-arcane-darkBorder text-arcane-grey border-arcane-grey/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-105",
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {label}
    </span>
  );
}
