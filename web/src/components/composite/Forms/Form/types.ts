/**
 * Types for Form component
 */
import * as React from "react";
import { FormSubmitHandler } from "../types";

export interface FormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  /** Form submit handler */
  onSubmit?: FormSubmitHandler;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Show validation on blur */
  validateOnBlur?: boolean;
  /** Show validation on change */
  validateOnChange?: boolean;
  /** Children components */
  children: React.ReactNode;
  /** Custom className */
  className?: string;
}

export interface FormFieldProps {
  /** Field name */
  name: string;
  /** Field label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Required indicator */
  required?: boolean;
  /** Children (input/select/textarea) */
  children: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Label alignment */
  labelPosition?: "top" | "left" | "right";
  /** Show optional indicator */
  showOptional?: boolean;
}

export interface FormActionsProps {
  /** Submit button text */
  submitText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Submit button loading state */
  loading?: boolean;
  /** Disable all buttons */
  disabled?: boolean;
  /** Cancel handler */
  onCancel?: () => void;
  /** Hide cancel button */
  hideCancelButton?: boolean;
  /** Custom className */
  className?: string;
  /** Alignment */
  align?: "left" | "right" | "center" | "between";
  /** Additional actions */
  children?: React.ReactNode;
}

export interface FormContextValue {
  loading: boolean;
  disabled: boolean;
  validateOnBlur: boolean;
  validateOnChange: boolean;
  errors: Record<string, string>;
  setError: (name: string, error: string) => void;
  clearError: (name: string) => void;
}
