/**
 * Radio Component
 *
 * Custom styled radio button with accessibility support
 * Part of Arcane Design System - Tier 2 Composite Components
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { RadioProps } from "./types";
import { useRadioGroupContext } from "./RadioGroup";

/**
 * Radio Component
 *
 * Features:
 * - Custom styled (replaces native radio)
 * - Icon support in labels
 * - Disabled state
 * - Full keyboard accessibility
 * - ARIA attributes
 * - Description text
 *
 * @example
 * ```tsx
 * <Radio
 *   name="plan"
 *   value="pro"
 *   label="Pro Plan"
 *   description="Best for teams"
 * />
 * ```
 */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      description,
      icon,
      size = "md",
      disabled = false,
      checked: externalChecked,
      value,
      onChange,
      className,
      id,
      name: externalName,
      ...props
    },
    ref
  ) => {
    const groupContext = useRadioGroupContext();

    // Use group context if available
    const name = externalName || groupContext?.name;
    const groupSize = groupContext?.size || size;
    const isDisabled = disabled || groupContext?.disabled || false;
    const isChecked = externalChecked !== undefined
      ? externalChecked
      : groupContext?.value === value;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (value !== undefined && value !== null) {
        groupContext?.onValueChange(String(value));
      }
      onChange?.(event);
    };

    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    const dotSizeClasses = {
      sm: "h-2 w-2",
      md: "h-2.5 w-2.5",
      lg: "h-3 w-3",
    };

    const labelSizeClasses = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    const radioId = id || `radio-${name}-${value}`;

    return (
      <div className={cn("flex gap-3", className)}>
        <div className="relative inline-flex items-center flex-shrink-0">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            name={name}
            value={value}
            checked={isChecked}
            disabled={isDisabled}
            onChange={handleChange}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              sizeClasses[groupSize],
              "flex items-center justify-center rounded-full border-2 transition-all duration-200 ease-spring cursor-pointer",
              // Default state
              "border-arcane-slate bg-arcane-charcoal",
              // Hover state
              "peer-hover:border-arcane-gray-400",
              // Checked state
              "peer-checked:border-arcane-yellow peer-checked:bg-arcane-charcoal",
              // Focus state
              "peer-focus-visible:ring-2 peer-focus-visible:ring-arcane-yellow peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-arcane-black",
              // Disabled state
              isDisabled && "opacity-50 cursor-not-allowed peer-hover:border-arcane-slate"
            )}
          >
            {/* Inner dot */}
            {isChecked && (
              <div
                className={cn(
                  dotSizeClasses[groupSize],
                  "rounded-full bg-arcane-yellow animate-in zoom-in-50 duration-200"
                )}
              />
            )}
          </div>
        </div>

        {(label || description || icon) && (
          <label
            htmlFor={radioId}
            className={cn(
              "flex-1 cursor-pointer select-none",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-2">
              {icon && <div className="flex-shrink-0">{icon}</div>}
              {label && (
                <span
                  className={cn(
                    labelSizeClasses[groupSize],
                    "font-medium text-arcane-gray-200 transition-colors"
                  )}
                >
                  {label}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1 text-sm text-arcane-gray-400">{description}</p>
            )}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = "Radio";
