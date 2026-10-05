import React from 'react';

export type IconContainerVariant = 'blue' | 'gold' | 'navy' | 'light';
export type IconContainerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface IconContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: IconContainerVariant;
  size?: IconContainerSize;
  className?: string;
}

const variantStyles: Record<IconContainerVariant, string> = {
  blue: 'bg-[#EEF3FD] text-[#1F3C82] border border-[#1F3C82]/15',
  gold: 'bg-[#FEF8E7] text-[#DF9B00] border border-[#F5B800]/30',
  navy: 'bg-[#122452] text-[#F5B800]',
  light: 'bg-white text-[#1F3C82] shadow-sm border border-slate-200',
};

const sizeStyles: Record<IconContainerSize, string> = {
  sm: 'w-8 h-8 rounded-md p-1.5 text-sm',
  md: 'w-11 h-11 rounded-lg p-2.5 text-base',
  lg: 'w-14 h-14 rounded-xl p-3.5 text-xl',
  xl: 'w-16 h-16 rounded-2xl p-4 text-2xl',
};

/**
 * DIMABIN Icon Container
 * Enforces unified icon bounding boxes and brand color harmonies.
 */
export const IconContainer: React.FC<IconContainerProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  className = '',
  ...rest
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </div>
  );
};
