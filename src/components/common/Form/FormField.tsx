import React from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * DIMABIN FormField Wrapper
 * Accessible wrapper for form controls providing label, hint, and error associations.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="font-poppins text-xs sm:text-sm font-semibold text-[#122452] flex items-center justify-between"
      >
        <span>
          {label}
          {required && <span className="text-[#DC2626] ml-1" aria-hidden="true">*</span>}
        </span>
      </label>

      {children}

      {hint && !error && (
        <span className="font-poppins text-xs text-[#5A6A85]">{hint}</span>
      )}

      {error && (
        <span className="font-poppins text-xs font-medium text-[#DC2626] flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </span>
      )}
    </div>
  );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', hasError = false, disabled, ...rest }, ref) => {
    return (
      <input
        ref={ref}
        disabled={disabled}
        className={`
          w-full px-3.5 py-2.5 rounded-lg border bg-white font-poppins text-sm text-[#122452]
          placeholder:text-[#8896AB] transition-colors
          focus:outline-none focus:ring-2 focus:ring-[#1F3C82]/20 focus:border-[#1F3C82]
          disabled:bg-slate-100 disabled:cursor-not-allowed
          ${hasError ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20' : 'border-[#CBD5E1]'}
          ${className}
        `.trim()}
        {...rest}
      />
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', hasError = false, disabled, rows = 4, ...rest }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={`
          w-full px-3.5 py-2.5 rounded-lg border bg-white font-poppins text-sm text-[#122452]
          placeholder:text-[#8896AB] transition-colors resize-y
          focus:outline-none focus:ring-2 focus:ring-[#1F3C82]/20 focus:border-[#1F3C82]
          disabled:bg-slate-100 disabled:cursor-not-allowed
          ${hasError ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20' : 'border-[#CBD5E1]'}
          ${className}
        `.trim()}
        {...rest}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', hasError = false, disabled, children, ...rest }, ref) => {
    return (
      <select
        ref={ref}
        disabled={disabled}
        className={`
          w-full px-3.5 py-2.5 rounded-lg border bg-white font-poppins text-sm text-[#122452]
          transition-colors appearance-none cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-[#1F3C82]/20 focus:border-[#1F3C82]
          disabled:bg-slate-100 disabled:cursor-not-allowed
          ${hasError ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20' : 'border-[#CBD5E1]'}
          ${className}
        `.trim()}
        {...rest}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
