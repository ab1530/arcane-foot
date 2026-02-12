/**
 * Shared types for Form components
 */

export type FormFieldSize = "sm" | "md" | "lg";

export type ValidationStatus = "idle" | "validating" | "valid" | "invalid";

export interface BaseFormFieldProps {
  /** Unique identifier for the field */
  id?: string;
  /** Field name for form handling */
  name?: string;
  /** Field label */
  label?: string;
  /** Helper text displayed below the field */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: FormFieldSize;
  /** Custom className */
  className?: string;
}

export interface FormFieldValidation {
  /** Validation function */
  validate?: (value: any) => boolean | string | Promise<boolean | string>;
  /** Validation rules */
  rules?: {
    required?: boolean | string;
    minLength?: number | { value: number; message: string };
    maxLength?: number | { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    custom?: (value: any) => boolean | string;
  };
}

export interface FormSubmitEvent<T = any> {
  /** Form data as object */
  data: T;
  /** Form native event */
  event: React.FormEvent<HTMLFormElement>;
}

export type FormSubmitHandler<T = any> = (submitEvent: FormSubmitEvent<T>) => void | Promise<void>;
