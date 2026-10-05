import React from 'react';
import { PageContainer } from '../common/Layout/PageContainer';
import { Heading } from '../common/Typography/Heading';
import { SectionEyebrow } from '../common/Typography/SectionEyebrow';
import { Subtitle } from '../common/Typography/Subtitle';
import { Text } from '../common/Typography/Text';

/**
 * DIMABIN Vision & Mission Section (Light Grey Background #F6F7FB)
 * Section 6 of the DIMABIN Homepage Reference
 */
export const VisionMissionSection: React.FC = () => {
  return (
    <section id="about" className="bg-[#F6F7FB] py-14 sm:py-20 lg:py-24 border-y border-[#E2E8F0]/80">
      <PageContainer>
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <SectionEyebrow variant="gold" align="center" className="mb-2">
            OUR FOUNDATIONS
          </SectionEyebrow>

          <Heading level="h2" align="center" className="text-2xl sm:text-3xl md:text-4xl text-[#122452] mb-3">
            Vision &amp; Mission
          </Heading>

          <Subtitle align="center" className="text-base sm:text-lg">
            The spiritual coordinates guiding our educational mandate
          </Subtitle>
        </div>

        {/* 2 Responsive Cards: Vision Card and Mission Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-5xl mx-auto">
          {/* VISION CARD */}
          <div className="bg-white rounded-2xl p-7 sm:p-9 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden group">
            {/* Top Gold Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F5B800]" aria-hidden="true" />

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#EEF3FD] text-[#1F3C82] flex items-center justify-center font-bold text-lg border border-[#1F3C82]/15">
                👁
              </div>
              <Heading level="h3" className="text-xl sm:text-2xl text-[#1F3C82]">
                Our Vision
              </Heading>
            </div>

            <Text variant="body" color="secondary" className="mb-6 leading-relaxed">
              To be a globally recognized interdenominational Bible institute, producing
              spiritually robust, intellectually equipped, and morally sound Christian leaders
              who will propagate the Gospel of Christ with absolute integrity and power across
              all nations.
            </Text>

            {/* Bullet Points */}
            <div className="mt-auto pt-6 border-t border-[#E2E8F0]">
              <span className="font-poppins text-xs font-bold uppercase tracking-wider text-[#122452] block mb-3">
                Key Strategic Focus:
              </span>
              <ul className="space-y-2.5">
                {[
                  'Fostering global spiritual revivals',
                  'Restoring ethical standards in church leadership',
                  'Cultivating academic theological excellence',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#5A6A85] font-poppins">
                    <span className="text-[#F5B800] font-bold text-base leading-none mt-0.5" aria-hidden="true">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* MISSION CARD */}
          <div className="bg-white rounded-2xl p-7 sm:p-9 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden group">
            {/* Top Blue Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1F3C82]" aria-hidden="true" />

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#FEF8E7] text-[#DF9B00] flex items-center justify-center font-bold text-lg border border-[#F5B800]/30">
                ⚐
              </div>
              <Heading level="h3" className="text-xl sm:text-2xl text-[#1F3C82]">
                Our Mission
              </Heading>
            </div>

            <Text variant="body" color="secondary" className="mb-6 leading-relaxed">
              To deliver top-tier biblical and theological education through comprehensive training,
              mentoring, and practical service, instilling the fear of God as the core foundation
              for a successful, scandal-free Christian ministry and professional life.
            </Text>

            {/* Bullet Points */}
            <div className="mt-auto pt-6 border-t border-[#E2E8F0]">
              <span className="font-poppins text-xs font-bold uppercase tracking-wider text-[#122452] block mb-3">
                Action Pillars:
              </span>
              <ul className="space-y-2.5">
                {[
                  'Sound teaching based on biblical authority',
                  'Hands-on ministerial apprenticeship programs',
                  'Building standard, professional-level leadership skillsets',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#5A6A85] font-poppins">
                    <span className="text-[#F5B800] font-bold text-base leading-none mt-0.5" aria-hidden="true">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
};
