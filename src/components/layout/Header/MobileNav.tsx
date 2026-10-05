import React, { useEffect } from 'react';
import { MAIN_NAV_ITEMS, PORTAL_NAV_ITEMS } from '../../../config/navigation';
import { ROUTES } from '../../../config/routes';
import { DimabinLogo } from '../../../assets/brand/DimabinLogo';
import { Button } from '../../common/Button/Button';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  activePath?: string;
}

/**
 * DIMABIN Accessible Mobile Navigation Drawer
 * Compliant with 15% mobile sticky cap and WCAG touch targets (>= 44px).
 */
export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  activePath = '/',
}) => {
  // Lock body scroll when mobile navigation is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0]">
          <DimabinLogo emblemSize={34} />
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg text-[#5A6A85] hover:text-[#122452] hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close navigation menu"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Main Navigation Links */}
        <div className="px-6 py-6 flex-1 flex flex-col space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#DF9B00] mb-2 font-poppins">
            Public Website
          </span>
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = activePath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center justify-between px-3 py-3 rounded-lg text-base font-poppins font-medium transition-colors
                  ${isActive ? 'bg-[#EEF3FD] text-[#1F3C82] font-semibold' : 'text-[#122452] hover:bg-slate-50'}
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5B800]" aria-hidden="true" />
                )}
              </a>
            );
          })}

          {/* Portal Access Links */}
          <div className="pt-6 mt-6 border-t border-[#E2E8F0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#DF9B00] mb-2 block font-poppins">
              Institute Portals
            </span>
            <div className="space-y-1">
              {PORTAL_NAV_ITEMS.map((portal) => (
                <a
                  key={portal.href}
                  href={portal.href}
                  onClick={onClose}
                  className="flex flex-col px-3 py-2.5 rounded-lg text-sm text-[#122452] hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-[#1F3C82]">{portal.label}</span>
                  <span className="text-xs text-[#5A6A85] mt-0.5">{portal.description}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Actions */}
        <div className="p-6 border-t border-[#E2E8F0] bg-slate-50">
          <Button
            variant="secondary"
            fullWidth
            href="#admissions"
            onClick={onClose}
            className="mb-3 font-bold tracking-wider uppercase"
          >
            APPLY NOW
          </Button>
          <p className="text-center text-xs text-[#5A6A85] font-poppins">
            CITADEL OF LEARNING
          </p>
        </div>
      </div>
    </div>
  );
};
