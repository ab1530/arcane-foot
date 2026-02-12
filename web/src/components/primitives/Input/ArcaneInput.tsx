'use client';

import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { ArcaneInputProps } from './types';
import { cn } from '@/lib/utils';

/**
 * ArcaneInput - Premium input component following Arcane Design System
 *
 * @example
 * ```tsx
 * <ArcaneInput
 *   type="email"
 *   label="Email"
 *   placeholder="Enter your email"
 *   icon={<MailIcon />}
 *   error="Invalid email address"
 * />
 * ```
 */
export const ArcaneInput: React.FC<ArcaneInputProps> = ({
  type = 'text',
  variant = 'default',
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  icon,
  iconRight,
  error,
  helperText,
  clearable = false,
  onClear,
  disabled = false,
  required = false,
  fullWidth = false,
  className,
  name,
  id,
  'aria-label': ariaLabel,
  maxLength,
  min,
  max,
  autoComplete,
  autoFocus,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || '');

  const inputValue = value !== undefined ? value : internalValue;
  const hasValue = inputValue && inputValue.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleClear = () => {
    if (value === undefined) {
      setInternalValue('');
    }
    onClear?.();
  };

  // Determine actual input type
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Container styles
  const containerStyles = fullWidth ? 'w-full' : '';

  // Input wrapper base styles
  const wrapperBaseStyles = `
    relative flex items-center
    bg-arcane-anthracite
    border rounded-md
    transition-all duration-200
  `;

  // Input wrapper variant styles
  const wrapperVariantStyles = {
    default: cn(
      'border-arcane-slate',
      isFocused && 'border-arcane-yellow shadow-[0_0_0_3px_rgba(228,255,59,0.12)]',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
    error: 'border-error',
  };

  // Input base styles
  const inputBaseStyles = `
    flex-1
    bg-transparent
    px-4 py-3
    text-base text-arcane-gray-200
    font-body
    placeholder:text-arcane-gray-500
    focus:outline-none
    disabled:cursor-not-allowed
  `;

  // Icon styles
  const iconStyles = 'text-arcane-gray-500 shrink-0';

  // Adjust padding for icons
  const paddingStyles = cn(
    icon && 'pl-10',
    (iconRight || (type === 'password') || (clearable && hasValue)) && 'pr-10'
  );

  const renderIcon = (iconElement: React.ReactNode, size = 20) => {
    if (!iconElement) return null;

    if (React.isValidElement(iconElement)) {
      return React.cloneElement(iconElement as React.ReactElement<any>, {
        size,
        strokeWidth: 2,
        className: iconStyles,
      });
    }

    return iconElement;
  };

  const inputId = id || name;

  return (
    <div className={cn(containerStyles, className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-2 text-sm font-medium text-arcane-gray-300"
        >
          {label}
          {required && <span className="text-color-error ml-1">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div
        className={cn(
          wrapperBaseStyles,
          wrapperVariantStyles[error ? 'error' : variant]
        )}
      >
        {/* Left icon */}
        {icon && (
          <div className="absolute left-3 flex items-center pointer-events-none">
            {renderIcon(icon)}
          </div>
        )}

        {/* Input field */}
        <input
          type={inputType}
          id={inputId}
          name={name}
          value={inputValue}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          min={min}
          max={max}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={cn(inputBaseStyles, paddingStyles)}
        />

        {/* Right side icons/buttons */}
        <div className="absolute right-3 flex items-center gap-2">
          {/* Clear button */}
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-arcane-gray-500 hover:text-arcane-gray-300 transition-colors"
              aria-label="Clear input"
            >
              <X size={18} strokeWidth={2} />
            </button>
          )}

          {/* Password toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-arcane-gray-500 hover:text-arcane-gray-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={18} strokeWidth={2} />
              ) : (
                <Eye size={18} strokeWidth={2} />
              )}
            </button>
          )}

          {/* Right icon */}
          {iconRight && !clearable && type !== 'password' && renderIcon(iconRight)}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-sm text-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Helper text */}
      {!error && helperText && (
        <p
          id={`${inputId}-helper`}
          className="mt-1.5 text-sm text-arcane-gray-400"
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

ArcaneInput.displayName = 'ArcaneInput';
