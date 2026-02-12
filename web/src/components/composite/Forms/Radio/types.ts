/**
 * Types for Radio components
 */
import { BaseFormFieldProps } from "../types";

export interface RadioOption {
  /** Value of the radio option */
  value: string;
  /** Label text */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Disabled state for this option */
  disabled?: boolean;
}

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  /** Radio label */
  label?: string;
  /** Optional description */
  description?: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Size variant */
  size?: BaseFormFieldProps["size"];
}

export interface RadioGroupProps extends Omit<BaseFormFieldProps, "id"> {
  /** Radio options */
  options: RadioOption[];
  /** Currently selected value */
  value?: string;
  /** Default selected value */
  defaultValue?: string;
  /** On value change handler */
  onValueChange?: (value: string) => void;
  /** Layout direction */
  direction?: "vertical" | "horizontal";
  /** Custom className */
  className?: string;
}

export interface RadioGroupContextValue {
  name: string;
  value?: string;
  onValueChange: (value: string) => void;
  disabled: boolean;
  size: BaseFormFieldProps["size"];
}
