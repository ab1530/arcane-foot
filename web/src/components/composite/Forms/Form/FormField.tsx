/**
 * FormField Component
 *
 * Field wrapper with label, error, and helper text
 * Part of Arcane Design System - Tier 2 Composite Components
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { FormFieldProps } from "./types";
import { useFormContext } from "./Form";

/**
 * FormField Component
 *
 * Features:
 * - Label with required indicator
 * - Error message display
 * - Helper text
 * - Accessible field grouping
 * - Multiple label positions
 */
export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      name,
      label,
      helperText,
      error: externalError,
      required = false,
      children,
      className,
      labelPosition = "top",
      showOptional = false,
      ...props
    },
    ref
  ) => {
    const formContext = useFormContext();

    // Use error from context if available, otherwise use external error
    const error = formContext?.errors[name] || externalError;

    const labelElement = label && (
      <label
        htmlFor={name}
        className={cn(
          "block font-medium text-arcane-gray-200 transition-colors",
          error && "text-error",
          formContext?.disabled && "opacity-50",
          labelPosition === "left" && "flex-shrink-0 w-32",
          labelPosition === "right" && "flex-shrink-0 w-32"
        )}
      >
        {label}
        {required && <span className="ml-1 text-error" aria-label="required">*</span>}
        {!required && showOptional && (
          <span className="ml-2 text-xs text-arcane-gray-400 font-normal">(Optional)</span>
        )}
      </label>
    );

    const errorElement = error && (
      <p
        className="mt-1.5 text-sm text-error flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
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
    );

    const helperElement = helperText && !error && (
      <p className="mt-1.5 text-sm text-arcane-gray-400" id={`${name}-helper`}>
        {helperText}
      </p>
    );

    return (
      <div
        ref={ref}
        className={cn(
          "relative",
          labelPosition === "left" && "flex items-start gap-4",
          labelPosition === "right" && "flex items-start gap-4 flex-row-reverse",
          className
        )}
        {...props}
      >
        {labelPosition === "left" || labelPosition === "right" ? (
          <>
            {labelElement}
            <div className="flex-1 min-w-0">
              {children}
              {errorElement}
              {helperElement}
            </div>
          </>
        ) : (
          <>
            {labelElement}
            <div className="mt-1.5">
              {children}
            </div>
            {errorElement}
            {helperElement}
          </>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
