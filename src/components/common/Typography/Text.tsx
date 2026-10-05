import React from 'react';

type TextVariant = 'body' | 'body-lg' | 'small' | 'caption' | 'lead';
type TextColor = 'primary' | 'secondary' | 'muted' | 'light' | 'gold';

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  color?: TextColor;
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<TextVariant, string> = {
  lead: 'text-lg sm:text-xl font-normal leading-relaxed',
  body: 'text-sm sm:text-base font-normal leading-relaxed',
  'body-lg': 'text-base sm:text-lg font-normal leading-relaxed',
  small: 'text-xs sm:text-sm font-normal leading-normal',
  caption: 'text-xs font-normal tracking-wide text-muted',
};

const colorStyles: Record<TextColor, string> = {
  primary: 'text-[#122452]',
  secondary: 'text-[#5A6A85]',
  muted: 'text-[#8896AB]',
  light: 'text-[#F6F7FB]',
  gold: 'text-[#DF9B00]',
};

/**
 * DIMABIN Standard Text Component
 * Strictly adheres to Poppins font family, clean geometry, and high legibility.
 */
export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  as: Component = 'p',
  className = '',
  children,
  ...rest
}) => {
  return (
    <Component
      className={`font-poppins ${variantStyles[variant]} ${colorStyles[color]} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
};
