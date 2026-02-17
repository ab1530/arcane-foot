"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  canEdit?: boolean;
  editLabel?: string;
  onEdit?: () => void;
  children: ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  canEdit = false,
  editLabel = "Edit",
  onEdit,
  children,
}: SectionCardProps) {
  return (
    <GlassCard variant="elevated" className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold text-white uppercase">{title}</h3>
          {subtitle ? <p className="text-sm text-arcane-grey mt-1">{subtitle}</p> : null}
        </div>

        {canEdit && onEdit ? (
          <Button size="sm" variant="outline" onClick={onEdit}>
            {editLabel}
          </Button>
        ) : null}
      </div>

      <div className="space-y-4">{children}</div>
    </GlassCard>
  );
}
