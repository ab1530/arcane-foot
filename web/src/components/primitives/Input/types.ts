import { ReactNode } from 'react';

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search';
export type InputVariant = 'default' | 'error';

export interface ArcaneInputProps {
  /** Input type */
  type?: InputType;
  /** Input variant */
  variant?: InputVariant;
  /** Input label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Input value */
  value?: string;
  /** Default value (for uncontrolled) */
  defaultValue?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Blur handler */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Focus handler */
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Icon to display on the left */
  icon?: ReactNode;
  /** Icon to display on the right */
  iconRight?: ReactNode;
  /** Error message to display */
  error?: string;
  /** Helper text below input */
  helperText?: string;
  /** Show clear button */
  clearable?: boolean;
  /** Clear button handler */
  onClear?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Required field */
  required?: boolean;
  /** Full width input */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Input name attribute */
  name?: string;
  /** Input id attribute */
  id?: string;
  /** ARIA label */
  'aria-label'?: string;
  /** Max length */
  maxLength?: number;
  /** Min value (for number type) */
  min?: number;
  /** Max value (for number type) */
  max?: number;
  /** Auto complete */
  autoComplete?: string;
  /** Auto focus */
  autoFocus?: boolean;
}
