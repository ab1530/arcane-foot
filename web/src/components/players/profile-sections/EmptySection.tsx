"use client";

interface EmptySectionProps {
  title: string;
  description: string;
}

export function EmptySection({ title, description }: EmptySectionProps) {
  return (
    <div className="rounded-xl border border-dashed border-arcane-darkBorder/80 bg-arcane-dark/30 p-6 text-center">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-sm text-arcane-grey mt-2">{description}</p>
    </div>
  );
}
