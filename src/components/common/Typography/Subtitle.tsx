import React from 'react';

interface SubtitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'muted' | 'light' | 'navy';
  align?: 'left' | 'center' | 'right';
}

const variantStyles = {
  muted: 'text-[#5A6A85]',
  light: 'text-slate-300',
  navy: 'text-[#122452]/80',
};

const alignStyles = {
  left: 'text-left',
  center: 'text-center mx-auto',
  right: 'text-right ml-auto',
};

/**
 * DIMABIN Italic Secondary Section Subtitle
 * Follows the visual reference for secondary descriptive subtitles.
 */
export const Subtitle: React.FC<SubtitleProps> = ({
  children,
  className = '',
  variant = 'muted',
  align = 'left',
  ...rest
}) => {
  return (
    <p
      className={`font-poppins text-base sm:text-lg italic font-normal max-w-2xl leading-relaxed ${variantStyles[variant]} ${alignStyles[align]} ${className}`}
      {...rest}
    >
      {children}
    </p>
  );
};
