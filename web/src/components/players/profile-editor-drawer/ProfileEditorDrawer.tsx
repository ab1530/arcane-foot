"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export interface ProfileEditorField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "date" | "textarea";
}

interface ProfileEditorDrawerProps {
  isOpen: boolean;
  title: string;
  fields: ProfileEditorField[];
  values: Record<string, string>;
  isSubmitting?: boolean;
  submitLabel: string;
  cancelLabel: string;
  onClose: () => void;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
}

export function ProfileEditorDrawer({
  isOpen,
  title,
  fields,
  values,
  isSubmitting = false,
  submitLabel,
  cancelLabel,
  onClose,
  onChange,
  onSubmit,
}: ProfileEditorDrawerProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        {fields.map((field) => {
          const value = values[field.key] ?? "";
          const baseClassName =
            "w-full rounded-xl border border-arcane-darkBorder bg-arcane-dark/70 px-3 py-2 text-sm text-white placeholder:text-arcane-grey focus:outline-none focus:ring-2 focus:ring-arcane-accent/60";

          return (
            <div key={field.key} className="space-y-1">
              <label className="text-sm font-medium text-arcane-grey">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  className={`${baseClassName} min-h-[110px]`}
                  placeholder={field.placeholder ?? ""}
                  value={value}
                  onChange={(event) => onChange(field.key, event.target.value)}
                />
              ) : (
                <input
                  className={baseClassName}
                  placeholder={field.placeholder ?? ""}
                  type={field.type ?? "text"}
                  value={value}
                  onChange={(event) => onChange(field.key, event.target.value)}
                />
              )}
            </div>
          );
        })}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? `${submitLabel}…` : submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
