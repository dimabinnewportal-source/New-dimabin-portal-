import React from 'react';
import { PageContainer } from '../common/Layout/PageContainer';
import { Heading } from '../common/Typography/Heading';
import { SectionEyebrow } from '../common/Typography/SectionEyebrow';
import { Subtitle } from '../common/Typography/Subtitle';
import { Button } from '../common/Button/Button';

interface ProgramsSectionProps {
  onApplyClick?: () => void;
}

/**
 * DIMABIN Programs of Study Section
 * Section 7 of the DIMABIN Homepage Reference featuring the
 * Diploma in Theology card and dark-blue scripture panel (2 Timothy 2:15).
 */
export const ProgramsSection: React.FC<ProgramsSectionProps> = ({ onApplyClick }) => {
  return (
    <section id="programs" className="bg-white py-14 sm:py-20 lg:py-24">
      <PageContainer>
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <SectionEyebrow variant="gold" align="center" className="mb-2">
            ACADEMIC OFFERINGS
          </SectionEyebrow>

          <Heading level="h2" align="center" className="text-2xl sm:text-3xl md:text-4xl text-[#122452] mb-3">
            Programs of Study
          </Heading>

          <Subtitle align="center" className="text-base sm:text-lg">
            Dignified training courses mapped for immediate kingdom impact
          </Subtitle>
        </div>

        {/* Featured Programme Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-[#E2E8F0] shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
          {/* Card Top Border Accent */}
          <div className="h-2 w-full bg-[#1F3C82]" aria-hidden="true" />

          {/* Main Card Content */}
          <div className="p-6 sm:p-9 lg:p-10">
            {/* Category Badge & Duration Pill */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="inline-block px-3 py-1 rounded bg-[#FEF8E7] text-[#DF9B00] border border-[#F5B800]/40 font-poppins text-xs font-bold uppercase tracking-wider">
                DIPLOMA COURSE
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#1F3C82] font-poppins">
                Executive &amp; Regular Tracks
              </span>
            </div>

            {/* Programme Title */}
            <Heading level="h3" className="text-2xl sm:text-3xl font-extrabold text-[#122452] mb-4">
              Diploma in Theology
            </Heading>

            {/* Image & Paragraphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              <div className="lg:col-span-8 space-y-3.5 text-sm sm:text-base text-[#5A6A85] leading-relaxed font-poppins">
                <p>
                  Our flagship program provides an extensive biblical framework designed to establish
                  a solid platform for theological, pastoral, or missionary journey. Students delve deeply
                  into Christian history, systematic theology, hermeneutics, and modern church administration.
                </p>
                <p>
                  This program is tailored specifically for aspiring ministers, evangelists, lay leaders,
                  and any believer seeking an organized, deeper understanding of the Scriptures.
                </p>
              </div>

              {/* Programme Graphic Thumbnail */}
              <div className="lg:col-span-4 rounded-xl overflow-hidden shadow-xs border border-slate-200 aspect-4/3 sm:aspect-16/9 lg:aspect-auto">
                <img
                  src="/src/assets/images/theology_diploma_study_1791217768692.jpg"
                  alt="Diploma in Theology study material and scripture"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* 4 Feature Badges/List */}
            <div className="pt-6 border-t border-[#E2E8F0] mb-8">
              <span className="font-poppins text-xs font-bold uppercase tracking-wider text-[#122452] block mb-3">
                Key Highlights:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  '1-Year Flexible Program',
                  'Experienced Theological Staff',
                  'Interdenominational Focus',
                  'Practical Ministry Projects',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#122452] font-poppins font-medium">
                    <span className="w-5 h-5 rounded-full bg-[#FEF8E7] text-[#DF9B00] flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div>
              <Button
                variant="primary"
                size="md"
                href="#admissions"
                onClick={onApplyClick}
                className="font-bold tracking-wider uppercase text-xs sm:text-sm px-7"
                rightIcon={<span aria-hidden="true">→</span>}
              >
                READ MORE &amp; APPLY
              </Button>
            </div>
          </div>

          {/* Bottom Dark-Blue Scripture Panel (As Specified in Reference) */}
          <div className="bg-[#122452] text-white p-6 sm:p-8 border-t-2 border-[#F5B800]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-poppins text-xs font-bold uppercase tracking-widest text-[#F5B800] block mb-1">
                  Dipl.Th.
                </span>
                <blockquote className="font-poppins text-sm sm:text-base italic text-slate-200">
                  &ldquo;Study to show thyself approved unto God, a workman that needeth not to be ashamed...&rdquo;
                </blockquote>
              </div>
              <div className="shrink-0 self-start sm:self-auto">
                <span className="inline-block px-3 py-1 rounded bg-white/10 text-[#F5B800] text-xs font-bold font-poppins tracking-wider">
                  2 TIMOTHY 2:15
                </span>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
};
