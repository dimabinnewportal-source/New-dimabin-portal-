import React, { useState, useEffect } from 'react';
import { MAIN_NAV_ITEMS, PORTAL_NAV_ITEMS } from '../../../config/navigation';
import { ROUTES } from '../../../config/routes';
import { DimabinLogo } from '../../../assets/brand/DimabinLogo';
import { Button } from '../../common/Button/Button';
import { NavItem } from './NavItem';
import { MobileNav } from './MobileNav';

export interface HeaderProps {
  activePath?: string;
  className?: string;
}

/**
 * DIMABIN Global Header Component
 * Strict 3-Zone Top Bar Contract with sticky scroll detection,
 * desktop navigation, portal gateway dropdown, and accessible mobile drawer.
 */
export const Header: React.FC<HeaderProps> = ({
  activePath = '/',
  className = '',
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPortalDropdownOpen, setIsPortalDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300
          ${
            isScrolled
              ? 'bg-[#122452] shadow-md border-b border-[#F5B800]/40 py-2.5 sm:py-3'
              : 'bg-[#122452]/85 backdrop-blur-sm border-b border-white/10 py-3 sm:py-4'
          }
          ${className}
        `.trim()}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            {/* Zone 1: Brand Lockup (Desktop & Mobile) */}
            <a
              href="/"
              className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] rounded-lg group"
              aria-label="Divine Mandate Bible Institute - Home"
            >
              <DimabinLogo variant="dark" emblemSize={isScrolled ? 34 : 38} />
            </a>

            {/* Zone 2: Navigation Links (Desktop) */}
            <nav
              className="hidden lg:flex items-center gap-7 xl:gap-8"
              aria-label="Primary Navigation"
            >
              {MAIN_NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  isDarkTheme={true}
                  isActive={activePath === item.href}
                />
              ))}
            </nav>

            {/* Zone 3: Desktop Portal Access & Apply Now Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Portal Access Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPortalDropdownOpen((prev) => !prev)}
                  onBlur={() => setTimeout(() => setIsPortalDropdownOpen(false), 200)}
                  aria-expanded={isPortalDropdownOpen}
                  aria-haspopup="true"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 hover:text-[#F5B800] hover:bg-white/5 rounded-lg transition-colors cursor-pointer font-poppins"
                >
                  <span>Portals</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isPortalDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isPortalDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-[#122452] rounded-xl shadow-xl border border-[#1F3C82] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    role="menu"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#F5B800] border-b border-white/10 font-poppins">
                      DIMABIN Portals
                    </div>
                    {PORTAL_NAV_ITEMS.map((portal) => (
                      <a
                        key={portal.href}
                        href={portal.href}
                        role="menuitem"
                        className="block px-3 py-2 rounded-lg text-xs hover:bg-[#1F3C82] transition-colors"
                      >
                        <div className="font-semibold text-white font-poppins">
                          {portal.label}
                        </div>
                        <div className="text-[11px] text-slate-300 line-clamp-1">
                          {portal.description}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Apply Now Primary Action */}
              <Button
                variant="secondary"
                size="sm"
                href="#admissions"
                className="font-bold tracking-wider uppercase text-xs px-4"
              >
                APPLY NOW
              </Button>
            </div>

            {/* Mobile Header Right Zone (APPLY NOW button + Hamburger menu) */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <a
                href="#admissions"
                className="inline-flex items-center justify-center font-poppins text-xs font-bold px-3 py-1.5 min-h-[36px] rounded-md bg-[#F5B800] text-[#122452] shadow-xs active:scale-95 transition-all select-none uppercase tracking-wider"
              >
                APPLY NOW
              </a>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Open navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Accessible Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activePath={activePath}
      />
    </>
  );
};
