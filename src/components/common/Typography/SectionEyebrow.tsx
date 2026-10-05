import React from 'react';

interface SectionEyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'gold' | 'blue' | 'light';
  align?: 'left' | 'center' | 'right';
}

const variantStyles = {
  gold: 'text-[#DF9B00] dark:text-[#F5B800]',
  blue: 'text-[#1F3C82]',
  light: 'text-[#F5B800]',
};

const alignStyles = {
  left: 'text-left',
  center: 'text-center block',
  right: 'text-right',
};

/**
 * DIMABIN Uppercase Section Eyebrow Label
 * Characteristic gold eyebrow used to introduce section topics.
 */
export const SectionEyebrow: React.FC<SectionEyebrowProps> = ({
  children,
  className = '',
  variant = 'gold',
  align = 'left',
  ...rest
}) => {
  return (
    <span
      className={`font-poppins text-xs sm:text-sm font-bold uppercase tracking-widest ${variantStyles[variant]} ${alignStyles[align]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
};
