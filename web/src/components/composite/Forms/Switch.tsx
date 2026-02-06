/**
 * Switch Component
 *
 * Toggle switch with loading state and smooth animations
 * Part of Arcane Design System - Tier 2 Composite Components
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { BaseFormFieldProps } from "./types";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type">,
    Pick<BaseFormFieldProps, "label" | "helperText" | "error" | "size"> {
  /** Label position */
  labelPosition?: "right" | "left";
  /** Loading state (shows spinner) */
  loading?: boolean;
  /** On checked change handler */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Switch Component
 *
 * Features:
 * - Toggle switch with smooth slide animation
 * - Three sizes: sm, md, lg
 * - Yellow accent when checked
 * - Loading state with spinner
 * - Label positioning
 * - Disabled and error states
 * - Helper text
 * - Full keyboard accessibility
 * - ARIA switch role
 *
 * @example
 * ```tsx
 * <Switch
 *   name="notifications"
 *   label="Enable notifications"
 *   onCheckedChange={(checked) => console.log(checked)}
 * />
 * ```
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      helperText,
      error,
      size = "md",
      labelPosition = "right",
      loading = false,
      disabled = false,
      checked,
      defaultChecked,
      onCheckedChange,
      onChange,
      className,
      id,
      name,
      required,
      ...props
    },
    ref
  ) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked || false);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (loading) return;

      const newChecked = event.target.checked;
      setIsChecked(newChecked);
      onCheckedChange?.(newChecked);
      onChange?.(event);
    };

    const isControlled = checked !== undefined;
    const switchChecked = isControlled ? checked : isChecked;
    const isDisabled = disabled || loading;

    const switchSizes = {
      sm: {
        track: "h-5 w-9",
        thumb: "h-4 w-4",
        translate: "translate-x-4",
        spinner: "h-2.5 w-2.5",
      },
      md: {
        track: "h-6 w-11",
        thumb: "h-5 w-5",
        translate: "translate-x-5",
        spinner: "h-3 w-3",
      },
      lg: {
        track: "h-7 w-14",
        thumb: "h-6 w-6",
        translate: "translate-x-7",
        spinner: "h-4 w-4",
      },
    };

    const labelSizes = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    const switchId = id || `switch-${name}`;
    const sizes = switchSizes[size];

    const switchElement = (
      <div className="relative inline-flex items-center flex-shrink-0">
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          id={switchId}
          name={name}
          checked={switchChecked}
          disabled={isDisabled}
          onChange={handleChange}
          required={required}
          aria-checked={switchChecked}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error
              ? `${switchId}-error`
              : helperText
              ? `${switchId}-helper`
              : undefined
          }
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            sizes.track,
            "relative rounded-full transition-all duration-200 ease-spring cursor-pointer",
            // Default state
            "bg-arcane-slate",
            // Hover state
            "peer-hover:bg-arcane-gray-600",
            // Checked state
            "peer-checked:bg-arcane-yellow peer-checked:shadow-glow-yellow",
            // Focus state
            "peer-focus-visible:ring-2 peer-focus-visible:ring-arcane-yellow peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-arcane-black",
            // Error state
            error && "bg-error-bg peer-checked:bg-error",
            // Disabled state
            isDisabled && "opacity-50 cursor-not-allowed peer-hover:bg-arcane-slate",
            className
          )}
        >
          {/* Thumb */}
          <div
            className={cn(
              sizes.thumb,
              "absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ease-spring flex items-center justify-center",
              "bg-white shadow-md",
              switchChecked && sizes.translate,
              switchChecked && "bg-arcane-black"
            )}
          >
            {/* Loading spinner */}
            {loading && (
              <svg
                className={cn(sizes.spinner, "animate-spin text-arcane-yellow")}
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
          </div>
        </div>
      </div>
    );

    const labelElement = label && (
      <label
        htmlFor={switchId}
        className={cn(
          labelSizes[size],
          "font-medium text-arcane-gray-200 cursor-pointer select-none transition-colors",
          isDisabled && "opacity-50 cursor-not-allowed",
          error && "text-error"
        )}
      >
        {label}
        {required && <span className="ml-1 text-error" aria-label="required">*</span>}
      </label>
    );

    return (
      <div className="flex flex-col gap-1.5">
        <div
          className={cn(
            "flex items-center gap-3",
            labelPosition === "left" && "flex-row-reverse justify-end"
          )}
        >
          {labelPosition === "left" && labelElement}
          {switchElement}
          {labelPosition === "right" && labelElement}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${switchId}-error`}
            className="text-sm text-error flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
            role="alert"
            aria-live="polite"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p id={`${switchId}-helper`} className="text-sm text-arcane-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";
