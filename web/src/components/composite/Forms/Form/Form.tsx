/**
 * Form Component
 *
 * Main form wrapper with validation and state management
 * Part of Arcane Design System - Tier 2 Composite Components
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { FormProps, FormContextValue } from "./types";

// Form Context for managing form state
export const FormContext = React.createContext<FormContextValue | undefined>(undefined);

export const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a Form component");
  }
  return context;
};

/**
 * Form Component
 *
 * Features:
 * - Form validation with error handling
 * - Loading state management
 * - Disabled state
 * - Submit handler with form data
 * - Context for child components
 */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      onSubmit,
      loading = false,
      disabled = false,
      validateOnBlur = true,
      validateOnChange = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (loading || disabled || isSubmitting) return;

      // Get form data
      const formData = new FormData(event.currentTarget);
      const data: Record<string, any> = {};

      formData.forEach((value, key) => {
        // Handle multiple values (checkboxes, multi-select)
        if (data[key]) {
          if (Array.isArray(data[key])) {
            data[key].push(value);
          } else {
            data[key] = [data[key], value];
          }
        } else {
          data[key] = value;
        }
      });

      if (onSubmit) {
        try {
          setIsSubmitting(true);
          await onSubmit({ data, event });
        } catch (error) {
          console.error("Form submission error:", error);
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    const setError = React.useCallback((name: string, error: string) => {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }, []);

    const clearError = React.useCallback((name: string) => {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }, []);

    const contextValue: FormContextValue = React.useMemo(
      () => ({
        loading: loading || isSubmitting,
        disabled,
        validateOnBlur,
        validateOnChange,
        errors,
        setError,
        clearError,
      }),
      [loading, isSubmitting, disabled, validateOnBlur, validateOnChange, errors, setError, clearError]
    );

    return (
      <FormContext.Provider value={contextValue}>
        <form
          ref={ref}
          onSubmit={handleSubmit}
          className={cn(
            "space-y-6",
            (loading || isSubmitting) && "pointer-events-none opacity-60",
            className
          )}
          noValidate
          {...props}
        >
          {children}
        </form>
      </FormContext.Provider>
    );
  }
);

Form.displayName = "Form";
