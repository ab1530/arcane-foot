"use client";

import { LucideIcon, Clock } from "lucide-react";

interface ActivityCardProps {
  title: string;
  description: string;
  timestamp: string | Date;
  icon: LucideIcon;
  onClick?: () => void;
}

export function ActivityCard({
  title,
  description,
  timestamp,
  icon: Icon,
  onClick,
}: ActivityCardProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-lg bg-arcane-darkBorder/30 hover:bg-arcane-darkBorder/50 transition-colors ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="h-10 w-10 rounded-lg bg-arcane-accent/20 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-arcane-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm">{title}</p>
        <p className="text-arcane-grey text-xs truncate">{description}</p>
        <p className="text-arcane-grey text-xs mt-1">
          <Clock className="h-3 w-3 inline mr-1" />
          {new Date(timestamp).toLocaleDateString("fr-FR")}
        </p>
      </div>
    </div>
  );
}
