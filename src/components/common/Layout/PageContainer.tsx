import React from 'react';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'prose' | 'full';
}

const sizeClasses = {
  default: 'max-w-7xl', // 1280px
  narrow: 'max-w-5xl',  // 1024px
  prose: 'max-w-3xl',   // 768px
  full: 'max-w-full',
};

/**
 * DIMABIN Global Page Container
 * Enforces unified max-width and responsive horizontal padding across all pages.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  size = 'default',
  ...rest
}) => {
  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
