'use client';

import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputBaseProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

type InputFieldProps = InputBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
    as?: 'input';
  };

type TextareaFieldProps = InputBaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: 'textarea';
    rows?: number;
  };

type InputProps = InputFieldProps | TextareaFieldProps;

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (props, ref) => {
    const {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      ...restProps
    } = props;
    const isTextarea = props.as === 'textarea';
    const id =
      restProps.id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

    const baseInputClasses = [
      'w-full border rounded-lg outline-none transition-all duration-200',
      'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
      error
        ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300',
      leftIcon ? 'pl-10' : 'pl-4',
      rightIcon ? 'pr-10' : 'pr-4',
      'py-2.5 text-sm',
      'placeholder:text-gray-400',
      'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
            {restProps.required && (
              <span className="text-red-500 ml-0.5">*</span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          {isTextarea ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={id}
              rows={(props as TextareaFieldProps).rows || 4}
              className={baseInputClasses}
              {...(restProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              id={id}
              className={baseInputClasses}
              {...(restProps as InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <svg
              className="w-4 h-4 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
