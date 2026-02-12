/**
 * Checkbox Component
 *
 * Custom styled checkbox with accessibility support
 * Part of Arcane Design System - Tier 2 Composite Components
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { BaseFormFieldProps } from "./types";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type">,
    Pick<BaseFormFieldProps, "label" | "helperText" | "error" | "size"> {
  /** Indeterminate state (mixed) */
  indeterminate?: boolean;
  /** Label position */
  labelPosition?: "right" | "left";
  /** On change handler */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Checkbox Component
 *
 * Features:
 * - Custom styled (replaces native checkbox)
 * - Checked, unchecked, indeterminate states
 * - Label positioning
 * - Disabled and error states
 * - Helper text
 * - Smooth check animation
 * - Full keyboard accessibility
 * - ARIA attributes
 *
 * @example
 * ```tsx
 * <Checkbox
 *   name="terms"
 *   label="I agree to the terms and conditions"
 *   required
 * />
 * ```
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      helperText,
      error,
      size = "md",
      indeterminate = false,
      labelPosition = "right",
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
    const internalRef = React.useRef<HTMLInputElement>(null);
    const checkboxRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    const [isChecked, setIsChecked] = React.useState(defaultChecked || false);

    // Set indeterminate state
    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate, checkboxRef]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = event.target.checked;
      setIsChecked(newChecked);
      onCheckedChange?.(newChecked);
      onChange?.(event);
    };

    const isControlled = checked !== undefined;
    const checkboxChecked = isControlled ? checked : isChecked;

    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    const iconSizeClasses = {
      sm: "h-3 w-3",
      md: "h-3.5 w-3.5",
      lg: "h-4 w-4",
    };

    const labelSizeClasses = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    const checkboxId = id || `checkbox-${name}`;

    const checkboxElement = (
      <div className="relative inline-flex items-center">
        <input
          ref={checkboxRef}
          type="checkbox"
          id={checkboxId}
          name={name}
          checked={checkboxChecked}
          disabled={disabled}
          onChange={handleChange}
          required={required}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error
              ? `${checkboxId}-error`
              : helperText
              ? `${checkboxId}-helper`
              : undefined
          }
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            sizeClasses[size],
            "flex items-center justify-center rounded-md border-2 transition-all duration-200 ease-spring cursor-pointer",
            // Default state
            "border-arcane-slate bg-arcane-charcoal",
            // Hover state
            "peer-hover:border-arcane-gray-400",
            // Checked state
            "peer-checked:bg-arcane-yellow peer-checked:border-arcane-yellow peer-checked:shadow-glow-yellow",
            // Indeterminate state
            indeterminate && "bg-arcane-yellow border-arcane-yellow shadow-glow-yellow",
            // Focus state
            "peer-focus-visible:ring-2 peer-focus-visible:ring-arcane-yellow peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-arcane-black",
            // Error state
            error && "border-error peer-checked:border-error",
            // Disabled state
            disabled && "opacity-50 cursor-not-allowed peer-hover:border-arcane-slate",
            className
          )}
        >
          {/* Check icon */}
          {checkboxChecked && !indeterminate && (
            <svg
              className={cn(
                iconSizeClasses[size],
                "text-arcane-black animate-in zoom-in-50 duration-200"
              )}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.3333 4L6 11.3333L2.66667 8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* Indeterminate icon */}
          {indeterminate && (
            <svg
              className={cn(
                iconSizeClasses[size],
                "text-arcane-black animate-in zoom-in-50 duration-200"
              )}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 8H12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      </div>
    );

    const labelElement = label && (
      <label
        htmlFor={checkboxId}
        className={cn(
          labelSizeClasses[size],
          "font-medium text-arcane-gray-200 cursor-pointer select-none transition-colors",
          disabled && "opacity-50 cursor-not-allowed",
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
          {checkboxElement}
          {labelPosition === "right" && labelElement}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${checkboxId}-error`}
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
          <p id={`${checkboxId}-helper`} className="text-sm text-arcane-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
