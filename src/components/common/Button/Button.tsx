import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold-outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  href?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  // Primary: DIMABIN Blue (#1F3C82), White text
  primary:
    'bg-[#1F3C82] text-white hover:bg-[#172F68] active:bg-[#122452] shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-[#F5B800] border border-transparent',

  // Secondary: DIMABIN Gold (#F5B800), Dark Navy (#122452) text
  secondary:
    'bg-[#F5B800] text-[#122452] font-semibold hover:bg-[#DF9B00] active:bg-[#C98B00] shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-[#1F3C82] border border-transparent',

  // Outline: 2px border in DIMABIN Blue
  outline:
    'bg-transparent text-[#1F3C82] border-2 border-[#1F3C82] hover:bg-[#1F3C82]/5 active:bg-[#1F3C82]/10 focus-visible:ring-2 focus-visible:ring-[#F5B800]',

  // Gold Outline (for dark banners/headers)
  'gold-outline':
    'bg-transparent text-[#F5B800] border-2 border-[#F5B800] hover:bg-[#F5B800]/10 focus-visible:ring-2 focus-visible:ring-white',

  // Ghost
  ghost:
    'bg-transparent text-[#122452] hover:bg-[#1F3C82]/10 focus-visible:ring-2 focus-visible:ring-[#F5B800] border border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs font-semibold px-3 py-1.5 min-h-[36px] gap-1.5 rounded-md',
  md: 'text-sm font-semibold px-5 py-2.5 min-h-[44px] gap-2 rounded-lg',
  lg: 'text-base font-bold px-7 py-3 min-h-[50px] gap-2.5 rounded-lg',
};

/**
 * DIMABIN Global Button Component
 * High-legibility, touch-target compliant (min 44px on standard sizes),
 * strictly adhering to Poppins and core brand colors.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  href,
  className = '',
  disabled,
  children,
  ...rest
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-poppins
    whitespace-nowrap transition-all duration-200 cursor-pointer
    select-none disabled:opacity-50 disabled:cursor-not-allowed
    disabled:pointer-events-none focus:outline-none
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  const content = (
    <>
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 shrink-0 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </>
  );

  if (href) {
    return (
      <a href={href} className={baseClasses} role="button">
        {content}
      </a>
    );
  }

  return (
    <button
      className={baseClasses}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {content}
    </button>
  );
};
