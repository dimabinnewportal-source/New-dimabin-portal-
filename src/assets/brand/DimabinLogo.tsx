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
  emblemSize = 40,
}) => {
  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      <DimabinEmblem size={emblemSize} variant={isDark ? 'dark' : 'light'} />
      <div className="flex flex-col text-left">
        <span
          className={`font-poppins font-extrabold tracking-tight leading-none text-sm sm:text-base md:text-lg ${
            isDark ? 'text-white' : 'text-[#122452]'
          }`}
        >
          DIVINE MANDATE
        </span>
        <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
          <span
            className={`font-poppins font-bold text-[10px] sm:text-xs tracking-wider uppercase leading-none ${
              isDark ? 'text-[#F5B800]' : 'text-[#1F3C82]'
            }`}
          >
            BIBLE INSTITUTE
          </span>
          {showSubtitle && (
            <>
              <span className="text-[#F5B800] text-[10px] font-bold leading-none hidden xs:inline" aria-hidden="true">·</span>
              <span
                className={`font-poppins font-semibold text-[9px] sm:text-[10px] tracking-wider uppercase leading-none hidden sm:inline ${
                  isDark ? 'text-slate-300' : 'text-[#5A6A85]'
                }`}
              >
                CITADEL OF LEARNING
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
