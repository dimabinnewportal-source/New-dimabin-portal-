import React from 'react';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  className?: string;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  variant?: 'navy' | 'light' | 'gold';
}

const levelStyles: Record<HeadingLevel, string> = {
  h1: 'text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]',
  h2: 'text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight',
  h3: 'text-xl sm:text-2xl font-bold tracking-tight leading-snug',
  h4: 'text-lg sm:text-xl font-semibold leading-snug',
};

const variantStyles = {
  navy: 'text-[#122452]',
  light: 'text-white',
  gold: 'text-[#F5B800]',
};

const alignStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * DIMABIN Heading Component
 * Uses Poppins with strong bold geometric presence and strict typographic hierarchy.
 */
export const Heading: React.FC<HeadingProps> = ({
  level = 'h2',
  className = '',
  children,
  align = 'left',
  variant = 'navy',
  ...rest
}) => {
  const Component = level;

  return (
    <Component
      className={`font-poppins ${levelStyles[level]} ${variantStyles[variant]} ${alignStyles[align]} [text-wrap:balance] ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
};
