import React from 'react';
import { Heading } from '../common/Typography/Heading';
import { INSTITUTE_CONFIG } from '../../config/institute';

/**
 * DIMABIN Rector's Desk Card Component
 * Premium institutional card featuring quotation styling, gold accent border,
 * distinguished circular profile monogram, and clean responsive spacing.
 */
export const RectorsDeskCard: React.FC = () => {
  const { rector } = INSTITUTE_CONFIG;

  return (
    <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-md hover:shadow-lg transition-shadow duration-300 p-6 sm:p-8 lg:p-10 overflow-hidden">
      {/* Top Gold Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F5B800]" aria-hidden="true" />

      {/* Decorative Large Quotation Mark in Background */}
      <div
        className="absolute top-6 right-6 text-7xl sm:text-8xl font-serif text-[#1F3C82]/10 select-none pointer-events-none leading-none"
        aria-hidden="true"
      >
        “
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6 lg:gap-8">
        {/* Rector Profile Initials / Avatar Circle */}
        <div className="shrink-0 flex items-center gap-4 md:flex-col md:items-center">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#122452] border-3 border-[#F5B800] flex items-center justify-center shadow-md">
            <span className="font-poppins font-bold text-xl sm:text-2xl text-[#F5B800] tracking-wider">
              {rector.initials}
            </span>
            {/* Small emblem badge */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#F5B800] text-[#122452] flex items-center justify-center text-[10px] font-bold shadow-xs">
              ✦
            </div>
          </div>

          <div className="md:text-center">
            <span className="font-poppins font-bold text-sm sm:text-base text-[#122452] block leading-tight">
              {rector.name}
            </span>
            <span className="font-poppins text-xs text-[#5A6A85] block mt-0.5">
              {rector.title}
            </span>
          </div>
        </div>

        {/* Quotation Body */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#F5B800]" aria-hidden="true" />
            <Heading level="h3" className="text-xl sm:text-2xl text-[#122452]">
              From the Rector&apos;s Desk
            </Heading>
          </div>

          <blockquote className="font-poppins text-sm sm:text-base text-[#122452]/90 leading-relaxed italic border-l-3 border-[#F5B800] pl-4 sm:pl-5 my-2">
            &ldquo;{rector.quote}&rdquo;
          </blockquote>

          <div className="pt-3 flex items-center justify-between">
            <span className="font-poppins text-xs font-semibold uppercase tracking-wider text-[#DF9B00]">
              Motto: FEAR OF GOD WITHOUT A MESS
            </span>
            <span className="font-poppins text-xs text-[#5A6A85] italic hidden sm:inline">
              Citadel of Learning
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
