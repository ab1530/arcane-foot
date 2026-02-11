"use client";

import { LucideIcon, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TaskCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
  href?: string;
  onClick?: () => void;
}

export function TaskCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-arcane-accent",
  bgColor = "bg-arcane-accent/10",
  borderColor = "border-arcane-accent/30",
  href,
  onClick,
}: TaskCardProps) {
  const cardContent = (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-lg ${bgColor} border ${borderColor} hover:brightness-110 transition-all ${
        href || onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <div>
          <p className="text-white font-bold text-sm">{title}</p>
          <p className="text-arcane-grey text-xs">{description}</p>
        </div>
      </div>
      <ArrowRight className={`h-4 w-4 ${iconColor}`} />
    </div>
  );

  return href ? <Link href={href}>{cardContent}</Link> : cardContent;
}
