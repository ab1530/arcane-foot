"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface PlayerTabItem {
  key: string;
  label: string;
  href?: string;
}

interface PlayerTabsProps {
  active: string;
  items?: PlayerTabItem[];
  onChange?: (key: string) => void;
  className?: string;
  playerId?: string;
}

const buildLegacyItems = (playerId: string): PlayerTabItem[] => [
  { key: "overview", label: "Profil & rapports", href: `/players/${playerId}` },
  { key: "hardware", label: "Performance GPS", href: `/players/${playerId}/hardware` },
];

export function PlayerTabs({ active, items, onChange, className, playerId }: PlayerTabsProps) {
  const resolvedItems =
    items && items.length > 0
      ? items
      : playerId
      ? buildLegacyItems(playerId)
      : [];

  if (!resolvedItems.length) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-1", className)}>
      {resolvedItems.map((tab) => {
        const selected = active === tab.key;
        const tabClassName = cn(
          "px-4 py-2 rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/60 text-sm font-semibold transition-all whitespace-nowrap shadow-sm hover:border-arcane-accent/50",
          selected
            ? "bg-arcane-accent text-arcane-dark shadow-[0_10px_40px_rgba(228,255,59,0.25)]"
            : "text-arcane-grey hover:text-white",
        );

        if (onChange) {
          return (
            <button
              key={tab.key}
              type="button"
              className={tabClassName}
              onClick={() => onChange(tab.key)}
            >
              {tab.label}
            </button>
          );
        }

        if (tab.href) {
          return (
            <Link key={tab.key} href={tab.href} className={tabClassName}>
              {tab.label}
            </Link>
          );
        }

        return (
          <span key={tab.key} className={tabClassName}>
            {tab.label}
          </span>
        );
      })}
    </div>
  );
}
