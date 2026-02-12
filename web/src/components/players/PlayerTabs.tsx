"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface PlayerTabsProps {
  playerId: string;
  active: "overview" | "hardware";
}

export function PlayerTabs({ playerId, active }: PlayerTabsProps) {
  const tabs = [
    { key: "overview", label: "Profil & rapports", href: `/players/${playerId}` },
    { key: "hardware", label: "Performance GPS", href: `/players/${playerId}/hardware` },
  ];

  return (
    <div className="flex items-center gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "px-4 py-2 rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/60 text-sm font-semibold transition-all shadow-sm hover:border-arcane-accent/50",
            active === tab.key
              ? "bg-arcane-accent text-arcane-dark shadow-[0_10px_40px_rgba(228,255,59,0.25)]"
              : "text-arcane-grey hover:text-white"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
