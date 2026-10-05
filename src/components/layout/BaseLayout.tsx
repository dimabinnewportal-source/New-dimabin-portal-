import React from 'react';
import { Header } from './Header/Header';
import { Footer } from './Footer/Footer';

export interface BaseLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  className?: string;
}

/**
 * DIMABIN BaseLayout
 * Universal page wrapper containing the sticky Header, responsive content stage, and Footer.
 */
export const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  activePath = '/',
  className = '',
}) => {
  return (
    <div className={`min-h-screen flex flex-col bg-[#F6F7FB] text-[#122452] ${className}`}>
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-[#F5B800] focus:text-[#122452] focus:font-bold"
      >
        Skip to main content
      </a>

      {/* Global Header */}
      <Header activePath={activePath} />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full" tabIndex={-1}>
        {children}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
