/**
 * RadioGroup Component
 *
 * Wrapper for multiple radio options with keyboard navigation
 * Part of Arcane Design System - Tier 2 Composite Components
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { RadioGroupProps, RadioGroupContextValue } from "./types";
import { Radio } from "./Radio";

// RadioGroup Context
export const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(
  undefined
);

export const useRadioGroupContext = () => {
  return React.useContext(RadioGroupContext);
};

/**
 * RadioGroup Component
 *
 * Features:
 * - Multiple radio options
 * - Vertical/horizontal layout
 * - Keyboard navigation (arrow keys)
 * - Label, error, and helper text
 * - Icon support for options
 * - Disabled state
 * - ARIA attributes
 *
 * @example
 * ```tsx
 * <RadioGroup
 *   name="plan"
 *   label="Select a plan"
 *   options={[
 *     { value: "free", label: "Free", description: "Basic features" },
 *     { value: "pro", label: "Pro", description: "All features" }
 *   ]}
 *   onValueChange={(value) => console.log(value)}
 * />
 * ```
 */
export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      name = "",
      label,
      helperText,
      error,
      required = false,
      disabled = false,
      size = "md",
      options = [],
      value: externalValue,
      defaultValue,
      onValueChange,
      direction = "vertical",
      className,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "");
    const groupRef = React.useRef<HTMLDivElement>(null);

    const isControlled = externalValue !== undefined;
    const currentValue = isControlled ? externalValue : internalValue;

    const handleValueChange = (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    // Keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      const { key } = event;
      const currentIndex = options.findIndex((opt) => opt.value === currentValue);

      let nextIndex = currentIndex;

      // Arrow navigation
      if (key === "ArrowDown" || key === "ArrowRight") {
        event.preventDefault();
        nextIndex = (currentIndex + 1) % options.length;
        // Skip disabled options
        while (options[nextIndex]?.disabled && nextIndex !== currentIndex) {
          nextIndex = (nextIndex + 1) % options.length;
        }
      } else if (key === "ArrowUp" || key === "ArrowLeft") {
        event.preventDefault();
        nextIndex = currentIndex - 1 < 0 ? options.length - 1 : currentIndex - 1;
        // Skip disabled options
        while (options[nextIndex]?.disabled && nextIndex !== currentIndex) {
          nextIndex = nextIndex - 1 < 0 ? options.length - 1 : nextIndex - 1;
        }
      }

      if (nextIndex !== currentIndex && !options[nextIndex]?.disabled) {
        handleValueChange(options[nextIndex].value);
        // Focus the radio input
        const radioInput = groupRef.current?.querySelector(
          `input[value="${options[nextIndex].value}"]`
        ) as HTMLInputElement;
        radioInput?.focus();
      }
    };

    const contextValue: RadioGroupContextValue = React.useMemo(
      () => ({
        name,
        value: currentValue,
        onValueChange: handleValueChange,
        disabled,
        size,
      }),
      [name, currentValue, disabled, size]
    );

    const groupId = `radio-group-${name}`;

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <div ref={ref} className={cn("space-y-2", className)} {...props}>
          {/* Label */}
          {label && (
            <label
              className={cn(
                "block font-medium text-arcane-gray-200 transition-colors",
                error && "text-error",
                disabled && "opacity-50"
              )}
            >
              {label}
              {required && <span className="ml-1 text-error" aria-label="required">*</span>}
            </label>
          )}

          {/* Radio Options */}
          <div
            ref={groupRef}
            role="radiogroup"
            aria-labelledby={label ? groupId : undefined}
            aria-describedby={
              error
                ? `${groupId}-error`
                : helperText
                ? `${groupId}-helper`
                : undefined
            }
            aria-invalid={error ? "true" : "false"}
            aria-required={required}
            onKeyDown={handleKeyDown}
            className={cn(
              "space-y-3",
              direction === "horizontal" && "flex flex-wrap gap-4 space-y-0"
            )}
          >
            {options.map((option) => (
              <Radio
                key={option.value}
                name={name}
                value={option.value}
                label={option.label}
                description={option.description}
                icon={option.icon}
                disabled={option.disabled || disabled}
                size={size}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <p
              id={`${groupId}-error`}
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
            <p id={`${groupId}-helper`} className="text-sm text-arcane-gray-400">
              {helperText}
            </p>
          )}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = "RadioGroup";
