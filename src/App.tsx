/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Official Public Homepage
 *
 * Phase 1: Complete DIMABIN Public Homepage
 */

import React from 'react';
import { BaseLayout } from './components/layout/BaseLayout';
import { SEOHead } from './components/seo/SEOHead';
import { HeroSection } from './components/home/HeroSection';
import { WelcomeSection } from './components/home/WelcomeSection';
import { VisionMissionSection } from './components/home/VisionMissionSection';
import { ProgramsSection } from './components/home/ProgramsSection';
import { WhyChooseSection } from './components/home/WhyChooseSection';
import { AdmissionCTASection } from './components/home/AdmissionCTASection';
import { INSTITUTE_CONFIG } from './config/institute';

export default function App() {
  const scrollToAdmissions = () => {
    const el = document.getElementById('admissions');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToAbout = () => {
    const el = document.getElementById('about');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <BaseLayout activePath="/">
      <SEOHead
        title="Divine Mandate Bible Institute | DIMABIN"
        description={`${INSTITUTE_CONFIG.name} (${INSTITUTE_CONFIG.shortName}) - ${INSTITUTE_CONFIG.heroSubtitle}. Motto: ${INSTITUTE_CONFIG.motto}. Equipping the saints for effective ministry and leadership.`}
      />

      {/* 1. Hero Section */}
      <HeroSection
        onApplyClick={scrollToAdmissions}
      />

      {/* 2. Welcome Section with Rector's Desk Card */}
      <WelcomeSection
        onLearnMore={scrollToAbout}
      />

      {/* 3. Vision & Mission Section */}
      <VisionMissionSection />

      {/* 4. Programs of Study Section */}
      <ProgramsSection
        onApplyClick={scrollToAdmissions}
      />

      {/* 5. Why Choose DIMABIN (6 Feature Cards) */}
      <WhyChooseSection />

      {/* 6. Admission Call-to-Action Section */}
      <AdmissionCTASection
        onApplyClick={scrollToAdmissions}
      />
    </BaseLayout>
  );
}
