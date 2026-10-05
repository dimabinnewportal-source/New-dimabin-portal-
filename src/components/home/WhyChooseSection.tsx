import React from 'react';
import { PageContainer } from '../common/Layout/PageContainer';
import { Heading } from '../common/Typography/Heading';
import { SectionEyebrow } from '../common/Typography/SectionEyebrow';
import { Subtitle } from '../common/Typography/Subtitle';
import { Text } from '../common/Typography/Text';

interface AdvantageFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ADVANTAGES: AdvantageFeature[] = [
  {
    title: 'Biblical Foundation',
    description:
      'Uncompromising adherence to the Word of God as the infallible source of truth and authority for Christian living and doctrine.',
    icon: (
      <svg className="w-6 h-6 text-[#1F3C82]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: 'Experienced Teaching',
    description:
      'Learn from seasoned scholars, dynamic pastors, and active leaders with decades of fruitful theological and pastoral excellence.',
    icon: (
      <svg className="w-6 h-6 text-[#DF9B00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    title: 'Practical Ministry',
    description:
      'Gain real-world experience through structured fieldwork, church internships, evangelistic campaigns, and community service.',
    icon: (
      <svg className="w-6 h-6 text-[#1F3C82]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Leadership Development',
    description:
      'Refine critical governance, emotional intelligence, and organizational management skills designed to oversee modern global ministries.',
    icon: (
      <svg className="w-6 h-6 text-[#DF9B00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Spiritual Growth',
    description:
      'Enrich your personal prayer life, foster spiritual disciplines, and develop genuine, scandal-free ministerial integrity.',
    icon: (
      <svg className="w-6 h-6 text-[#1F3C82]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    title: 'Academic Excellence',
    description:
      'Participate in structured lectures, advanced theological research, and insightful peer debates under a standardized university structure.',
    icon: (
      <svg className="w-6 h-6 text-[#DF9B00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
  },
];

/**
 * DIMABIN Why Choose DIMABIN Section
 * Section 8 of the DIMABIN Homepage Reference featuring 6 feature cards.
 */
export const WhyChooseSection: React.FC = () => {
  return (
    <section className="bg-[#F6F7FB] py-14 sm:py-20 lg:py-24 border-y border-[#E2E8F0]/80">
      <PageContainer>
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <SectionEyebrow variant="gold" align="center" className="mb-2">
            THE DIMABIN ADVANTAGE
          </SectionEyebrow>

          <Heading level="h2" align="center" className="text-2xl sm:text-3xl md:text-4xl text-[#122452] mb-3">
            Why Choose DIMABIN
          </Heading>

          <Subtitle align="center" className="text-base sm:text-lg">
            Developing outstanding Christian leaders for the global harvest
          </Subtitle>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {ADVANTAGES.map((adv, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-7 border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#1F3C82]/30 transition-all duration-300 flex flex-col group"
            >
              {/* Feature Icon Container */}
              <div className="w-12 h-12 rounded-xl bg-[#EEF3FD] group-hover:bg-[#FEF8E7] transition-colors flex items-center justify-center mb-5 shrink-0 border border-[#1F3C82]/10">
                {adv.icon}
              </div>

              {/* Title */}
              <Heading level="h3" className="text-lg sm:text-xl font-bold text-[#122452] mb-2.5">
                {adv.title}
              </Heading>

              {/* Description */}
              <Text variant="small" color="secondary" className="leading-relaxed">
                {adv.description}
              </Text>
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  );
};
