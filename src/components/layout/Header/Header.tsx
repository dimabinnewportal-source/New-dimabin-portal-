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
      setIsScrolled(window.scrollY > 16);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`
          sticky top-0 z-40 w-full transition-all duration-200
          ${
            isScrolled
              ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E2E8F0] py-3'
              : 'bg-white border-b border-[#E2E8F0]/70 py-4'
          }
          ${className}
        `.trim()}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Zone 1: Brand Lockup */}
            <a
              href={ROUTES.HOME}
              className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] rounded-lg"
              aria-label="Divine Mandate Bible Institute - Return to Home"
            >
              <DimabinLogo emblemSize={isScrolled ? 36 : 42} />
            </a>

            {/* Zone 2: Navigation Links (Desktop) */}
            <nav
              className="hidden lg:flex items-center gap-7"
              aria-label="Primary Navigation"
            >
              {MAIN_NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  isActive={activePath === item.href}
                />
              ))}
            </nav>

            {/* Zone 3: Portal Access & Apply Now Actions */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Portal Gateway Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPortalDropdownOpen((prev) => !prev)}
                  onBlur={() => setTimeout(() => setIsPortalDropdownOpen(false), 200)}
                  aria-expanded={isPortalDropdownOpen}
                  aria-haspopup="true"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#1F3C82] hover:bg-[#EEF3FD] rounded-lg transition-colors cursor-pointer font-poppins"
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
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-[#E2E8F0] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    role="menu"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#DF9B00] border-b border-slate-100 font-poppins">
                      DIMABIN Portals
                    </div>
                    {PORTAL_NAV_ITEMS.map((portal) => (
                      <a
                        key={portal.href}
                        href={portal.href}
                        role="menuitem"
                        className="block px-3 py-2 rounded-lg text-xs hover:bg-[#EEF3FD] transition-colors"
                      >
                        <div className="font-semibold text-[#1F3C82] font-poppins">
                          {portal.label}
                        </div>
                        <div className="text-[11px] text-[#5A6A85] line-clamp-1">
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
                href={ROUTES.ADMISSIONS}
                className="shadow-xs"
              >
                Apply Now
              </Button>
            </div>

            {/* Mobile Navigation Toggle Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <Button
                variant="secondary"
                size="sm"
                href={ROUTES.ADMISSIONS}
                className="text-xs px-2.5 py-1.5 sm:hidden"
              >
                Apply
              </Button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg text-[#122452] hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Open navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
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
