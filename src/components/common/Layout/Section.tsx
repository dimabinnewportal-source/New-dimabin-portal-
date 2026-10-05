import React from 'react';

export type SectionBackground = 'default' | 'white' | 'navy' | 'blue-subtle';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  bg?: SectionBackground;
  spacing?: 'default' | 'compact' | 'spacious' | 'none';
  className?: string;
  id?: string;
}

const bgStyles: Record<SectionBackground, string> = {
  default: 'bg-[#F6F7FB] text-[#122452]',
  white: 'bg-white text-[#122452]',
  navy: 'bg-[#122452] text-white',
  'blue-subtle': 'bg-[#EEF3FD] text-[#122452]',
};

const spacingStyles = {
  default: 'py-12 sm:py-16 lg:py-20',
  compact: 'py-8 sm:py-12',
  spacious: 'py-16 sm:py-24 lg:py-28',
  none: 'py-0',
};

/**
 * DIMABIN Global Section Component
 * Handles unified vertical whitespace rhythms and contrast backgrounds.
 */
export const Section: React.FC<SectionProps> = ({
  children,
  bg = 'default',
  spacing = 'default',
  className = '',
  id,
  ...rest
}) => {
  return (
    <section
      id={id}
      className={`w-full relative ${bgStyles[bg]} ${spacingStyles[spacing]} ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
};
