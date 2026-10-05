import React from 'react';

export interface ContentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  bordered?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * DIMABIN Content Card
 * Single-elevation card with hairline border, subtle shadow, and consistent padding.
 */
export const ContentCard: React.FC<ContentCardProps> = ({
  children,
  className = '',
  hoverable = false,
  bordered = true,
  padding = 'md',
  ...rest
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl text-[#122452]
        ${bordered ? 'border border-[#E2E8F0]' : ''}
        ${hoverable ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#1F3C82]/30' : 'shadow-sm'}
        ${paddingStyles[padding]}
        ${className}
      `.trim()}
      {...rest}
    >
      {children}
    </div>
  );
};
