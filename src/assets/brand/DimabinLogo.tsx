import React from 'react';
import { DimabinEmblem } from './DimabinEmblem';

interface DimabinLogoProps {
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
  className?: string;
  emblemSize?: number;
}

/**
 * Divine Mandate Bible Institute (DIMABIN) Official Logo Lockup
 * Strict typography in Poppins with Divine Mandate Bible Institute branding.
 */
export const DimabinLogo: React.FC<DimabinLogoProps> = ({
  variant = 'light',
  showSubtitle = true,
  className = '',
  emblemSize = 42,
}) => {
  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <DimabinEmblem size={emblemSize} variant={isDark ? 'dark' : 'light'} />
      <div className="flex flex-col text-left">
        <span
          className={`font-poppins font-extrabold tracking-tight leading-none text-base sm:text-lg ${
            isDark ? 'text-white' : 'text-[#122452]'
          }`}
        >
          DIVINE MANDATE
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`font-poppins font-semibold text-xs tracking-wider uppercase leading-none ${
              isDark ? 'text-[#F5B800]' : 'text-[#1F3C82]'
            }`}
          >
            BIBLE INSTITUTE
          </span>
          {showSubtitle && (
            <>
              <span className="text-[#F5B800] text-xs font-bold leading-none" aria-hidden="true">·</span>
              <span
                className={`font-poppins font-bold text-[10px] tracking-widest leading-none px-1 py-0.2 rounded ${
                  isDark ? 'bg-[#F5B800]/20 text-[#F5B800]' : 'bg-[#1F3C82]/10 text-[#1F3C82]'
                }`}
              >
                DIMABIN
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
