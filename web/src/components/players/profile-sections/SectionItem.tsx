"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProfileContentStatus, SourceMeta } from "@/types/player-profile";

const STATUS_CLASS: Record<ProfileContentStatus, string> = {
  DRAFT: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  VERIFIED: "bg-blue-500/15 text-blue-300 border-blue-500/40",
  PUBLISHED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  ARCHIVED: "bg-slate-500/15 text-slate-300 border-slate-500/40",
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "—";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

interface StatusAction {
  key: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

interface SectionItemProps {
  title: string;
  subtitle?: string;
  details?: string[];
  sourceMeta?: SourceMeta;
  statusActions?: StatusAction[];
}

export function SectionItem({
  title,
  subtitle,
  details = [],
  sourceMeta,
  statusActions = [],
}: SectionItemProps) {
  const status = sourceMeta?.status ?? null;

  return (
    <div className="rounded-xl border border-arcane-darkBorder/60 bg-arcane-dark/50 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-base font-semibold text-white">{title || "—"}</p>
          {subtitle ? <p className="text-sm text-arcane-grey">{subtitle}</p> : null}
        </div>
        {status ? (
          <span className={cn("text-xs px-2 py-1 rounded-full border font-semibold", STATUS_CLASS[status])}>
            {status}
          </span>
        ) : null}
      </div>

      {details.length ? (
        <div className="space-y-1">
          {details.map((line, idx) => (
            <p key={`${line}-${idx}`} className="text-sm text-arcane-grey">
              {line}
            </p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-xs text-arcane-grey">
        <span>{sourceMeta?.sourceName || "—"}</span>
        <span>•</span>
        <span>{formatDate(sourceMeta?.sourceDate)}</span>
        <span>•</span>
        <span>{sourceMeta?.sourceUrl || "—"}</span>
      </div>

      {statusActions.length ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {statusActions.map((action) => (
            <Button
              key={action.key}
              size="sm"
              variant="outline"
              disabled={action.disabled}
              onClick={action.onClick}
              className="text-xs"
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
