import React from 'react';
import { PageContainer } from '../common/Layout/PageContainer';
import { Heading } from '../common/Typography/Heading';
import { SectionEyebrow } from '../common/Typography/SectionEyebrow';
import { Button } from '../common/Button/Button';
import { RectorsDeskCard } from './RectorsDeskCard';

interface WelcomeSectionProps {
  onLearnMore?: () => void;
}

/**
 * DIMABIN Welcome Section (White Background)
 * Section 4 & 5 of the DIMABIN Homepage Reference
 */
export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ onLearnMore }) => {
  return (
    <section id="welcome" className="bg-white py-14 sm:py-20 lg:py-24">
      <PageContainer>
        {/* Welcome Intro Header & Prose */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
          <SectionEyebrow variant="gold" className="mb-3 block">
            WELCOME TO DIMABIN
          </SectionEyebrow>

          <Heading level="h2" className="text-2xl sm:text-3xl md:text-4xl text-[#122452] mb-6">
            Preparing Leaders with Spiritual Depth and Academic Integrity
          </Heading>

          <div className="space-y-4 text-sm sm:text-base text-[#5A6A85] leading-relaxed font-poppins">
            <p>
              Welcome to the Divine Mandate Bible Institute (DIMABIN), an interdenominational
              citadel of learning dedicated to cultivating a deep theological understanding,
              uncompromised spiritual devotion, and practical ministry capacity.
            </p>
            <p>
              At DIMABIN, we hold the absolute authority of Scripture as our highest standard.
              Our dynamic learning atmosphere bridges profound biblical study with realistic training,
              raising graduates who are capable of responding effectively to modern global ministry
              challenges while maintaining an unwavering moral stance.
            </p>
          </div>

          <div className="mt-8">
            <Button
              variant="outline"
              size="md"
              href="#about"
              onClick={onLearnMore}
              className="font-bold tracking-wider uppercase text-xs sm:text-sm"
              rightIcon={<span aria-hidden="true">→</span>}
            >
              LEARN MORE ABOUT US
            </Button>
          </div>
        </div>

        {/* From the Rector's Desk Card */}
        <div className="max-w-4xl mx-auto">
          <RectorsDeskCard />
        </div>
      </PageContainer>
    </section>
  );
};
