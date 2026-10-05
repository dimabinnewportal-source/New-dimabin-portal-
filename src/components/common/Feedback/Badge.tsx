import React from 'react';

export type BadgeVariant = 'gold' | 'blue' | 'navy' | 'success' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  gold: 'bg-[#FEF8E7] text-[#DF9B00] border border-[#F5B800]/40',
  blue: 'bg-[#EEF3FD] text-[#1F3C82] border border-[#1F3C82]/20',
  navy: 'bg-[#122452]/10 text-[#122452] border border-[#122452]/20',
  success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
};

/**
 * DIMABIN Badge / Micro-Label
 * Clean, subtle tag with high-contrast text and disciplined geometry.
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  className = '',
  ...rest
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold tracking-wide font-poppins select-none ${variantStyles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
};
