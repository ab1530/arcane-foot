/**
 * FormActions Component
 *
 * Form action buttons (submit, cancel, etc.)
 * Part of Arcane Design System - Tier 2 Composite Components
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { FormActionsProps } from "./types";
import { useFormContext } from "./Form";

/**
 * FormActions Component
 *
 * Features:
 * - Submit and cancel buttons
 * - Loading state
 * - Flexible alignment
 * - Custom actions support
 */
export const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(
  (
    {
      submitText = "Submit",
      cancelText = "Cancel",
      loading: externalLoading,
      disabled: externalDisabled,
      onCancel,
      hideCancelButton = false,
      className,
      align = "right",
      children,
      ...props
    },
    ref
  ) => {
    const formContext = useFormContext();

    // Use context values if available, otherwise use props
    const loading = externalLoading ?? formContext?.loading ?? false;
    const disabled = externalDisabled ?? formContext?.disabled ?? false;

    const alignmentClasses = {
      left: "justify-start",
      right: "justify-end",
      center: "justify-center",
      between: "justify-between",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 pt-6 border-t border-arcane-slate",
          alignmentClasses[align],
          className
        )}
        {...props}
      >
        {/* Custom actions on the left for 'between' alignment */}
        {align === "between" && children && (
          <div className="flex items-center gap-3">{children}</div>
        )}

        {/* Main action buttons */}
        <div className="flex items-center gap-3">
          {!hideCancelButton && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={disabled || loading}
              className={cn(
                "px-5 py-2.5 text-sm font-semibold rounded-lg",
                "border-2 border-arcane-slate text-arcane-gray-200",
                "bg-transparent hover:border-arcane-gray-400 hover:text-white",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcane-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-arcane-black",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-arcane-slate"
              )}
            >
              {cancelText}
            </button>
          )}

          <button
            type="submit"
            disabled={disabled || loading}
            className={cn(
              "px-5 py-2.5 text-sm font-bold uppercase tracking-wide rounded-lg",
              "bg-arcane-yellow text-arcane-black",
              "hover:bg-arcane-yellow hover:shadow-glow-yellow",
              "transition-all duration-200 ease-spring",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arcane-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-arcane-black",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
              "flex items-center gap-2"
            )}
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {loading ? "Submitting..." : submitText}
          </button>
        </div>

        {/* Custom actions on the right for non-'between' alignments */}
        {align !== "between" && children && (
          <div className="flex items-center gap-3">{children}</div>
        )}
      </div>
    );
  }
);

FormActions.displayName = "FormActions";
