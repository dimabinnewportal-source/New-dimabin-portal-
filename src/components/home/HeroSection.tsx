import React from 'react';
import { PageContainer } from '../common/Layout/PageContainer';
import { Button } from '../common/Button/Button';
import { ROUTES } from '../../config/routes';

interface HeroSectionProps {
  onApplyClick?: () => void;
  onPortalClick?: () => void;
}

/**
 * DIMABIN Homepage Hero Section
 * Large, academic, and spiritually dignified hero banner with
 * dark navy scrim over theological library imagery and gold brand accents.
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  onApplyClick,
  onPortalClick,
}) => {
  return (
    <section
      id="hero"
      className="relative min-h-[90vh] sm:min-h-[85vh] lg:min-h-[88vh] flex items-center justify-center pt-24 pb-16 sm:pt-28 sm:pb-20 overflow-hidden bg-[#122452]"
      aria-label="Welcome and Institute Introduction"
    >
      {/* High-Resolution Theological Library Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_theological_library_1791217754173.jpg"
          alt="Divine Mandate Bible Institute Theological Library and Seminary"
          className="w-full h-full object-cover object-center filter brightness-90 transform scale-105 transition-transform duration-1000 ease-out"
          referrerPolicy="no-referrer"
          loading="eager"
        />

        {/* Strong Dark Navy Gradient Overlays for Guaranteed Legibility */}
        <div className="absolute inset-0 bg-[#122452]/80 backdrop-brightness-75 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#122452]/95 via-[#122452]/80 to-[#122452]/95" />
        <div className="absolute inset-0 bg-radial at-center from-transparent via-transparent to-[#0A1430]/90" />
      </div>

      {/* Hero Content Stage */}
      <PageContainer className="relative z-10 text-center py-6 sm:py-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Gold Outlined Motto Label */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#F5B800] bg-[#122452]/60 backdrop-blur-xs mb-5 sm:mb-6 shadow-sm">
            <span className="font-poppins text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F5B800]">
              MOTTO: FEAR OF GOD WITHOUT A MESS
            </span>
          </div>

          {/* Main Institute Heading */}
          <h1 className="font-poppins font-extrabold text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.15] sm:leading-[1.12] [text-wrap:balance] mb-3 sm:mb-4">
            DIVINE MANDATE BIBLE INSTITUTE <span className="text-[#F5B800]">(DIMABIN)</span>
          </h1>

          {/* Gold & Italic Subtitle */}
          <p className="font-poppins italic font-semibold text-lg sm:text-xl md:text-2xl text-[#F5B800] tracking-wide mb-5 sm:mb-6">
            Interdenominational Citadel of Learning
          </p>

          {/* Descriptive Mission Narrative */}
          <p className="font-poppins font-normal text-slate-200 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl sm:max-w-3xl mb-8 sm:mb-10 [text-wrap:pretty]">
            Equipping the saints for effective ministry, leadership, and professional excellence.
            Discover an academically rigorous, spiritually enriching theological education designed
            to empower your divine calling.
          </p>

          {/* Hero Call To Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-5 w-full sm:w-auto">
            {/* APPLY NOW Button (Gold Background, Dark Navy Text) */}
            <a
              href="#admissions"
              onClick={onApplyClick}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 min-h-[48px] rounded-lg bg-[#F5B800] hover:bg-[#DF9B00] active:bg-[#C98B00] text-[#122452] font-poppins font-bold text-sm tracking-wider uppercase shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer select-none"
            >
              APPLY NOW
            </a>

            {/* STUDENT PORTAL Button (Transparent/Outlined with Gold/White Border) */}
            <a
              href={ROUTES.STUDENT_PORTAL.DASHBOARD}
              onClick={onPortalClick}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 min-h-[48px] rounded-lg bg-transparent hover:bg-white/10 active:bg-white/20 text-white hover:text-[#F5B800] border-2 border-white/70 hover:border-[#F5B800] font-poppins font-bold text-sm tracking-wider uppercase transition-all duration-200 cursor-pointer select-none"
            >
              STUDENT PORTAL
            </a>
          </div>
        </div>
      </PageContainer>

      {/* Subtle Gold Accent Line at the Bottom of Hero */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F5B800] to-transparent z-20"
        aria-hidden="true"
      />
    </section>
  );
};
