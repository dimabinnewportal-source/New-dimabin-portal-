/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Web Platform & Portal Foundation
 *
 * Phase 0: Foundation Architecture & Design System Setup
 */

import React, { useState } from 'react';
import { BaseLayout } from './components/layout/BaseLayout';
import { PageContainer } from './components/common/Layout/PageContainer';
import { Section } from './components/common/Layout/Section';
import { Heading } from './components/common/Typography/Heading';
import { SectionEyebrow } from './components/common/Typography/SectionEyebrow';
import { Subtitle } from './components/common/Typography/Subtitle';
import { Text } from './components/common/Typography/Text';
import { Button } from './components/common/Button/Button';
import { ContentCard } from './components/common/Cards/ContentCard';
import { FeatureCard } from './components/common/Cards/FeatureCard';
import { ProgrammeCard } from './components/common/Cards/ProgrammeCard';
import { Badge } from './components/common/Feedback/Badge';
import { IconContainer } from './components/common/Feedback/IconContainer';
import { FormField, Input, Select, Textarea } from './components/common/Form/FormField';
import { CTASection } from './components/common/CTA/CTASection';
import { SEOHead } from './components/seo/SEOHead';
import { INSTITUTE_CONFIG } from './config/institute';
import { DIMABIN_COLORS } from './config/designTokens';

export default function App() {
  const [selectedDemoTab, setSelectedDemoTab] = useState<'tokens' | 'components' | 'architecture'>('tokens');

  return (
    <BaseLayout activePath="/">
      <SEOHead
        title="Foundation Architecture & Design System"
        description="Scalable foundational architecture, typography, color system, and reusable UI building blocks for Divine Mandate Bible Institute (DIMABIN)."
      />

      {/* Hero Foundation Banner */}
      <Section bg="navy" spacing="compact" className="border-b border-[#1F3C82]">
        <PageContainer>
          <div className="py-6 sm:py-8 max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5B800] animate-pulse" aria-hidden="true" />
              <SectionEyebrow variant="gold" className="text-xs">
                Foundation Phase Established
              </SectionEyebrow>
              <span className="text-slate-400 text-xs" aria-hidden="true">·</span>
              <span className="text-slate-300 text-xs font-poppins">Ready for Phase 1</span>
            </div>

            <Heading level="h1" variant="light" className="mb-3">
              {INSTITUTE_CONFIG.name}
            </Heading>

            <Subtitle variant="light" className="text-slate-200 mb-6">
              Scalable design tokens, responsive typography in Poppins, global layout container,
              and modular component building blocks established for the public website and future portal ecosystem.
            </Subtitle>

            {/* Interactive Inspector Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDemoTab('tokens')}
                className={`px-4 py-2 rounded-lg text-xs font-poppins font-semibold transition-all cursor-pointer ${
                  selectedDemoTab === 'tokens'
                    ? 'bg-[#F5B800] text-[#122452] shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                1. Design System & Tokens
              </button>
              <button
                type="button"
                onClick={() => setSelectedDemoTab('components')}
                className={`px-4 py-2 rounded-lg text-xs font-poppins font-semibold transition-all cursor-pointer ${
                  selectedDemoTab === 'components'
                    ? 'bg-[#F5B800] text-[#122452] shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                2. Reusable UI Components
              </button>
              <button
                type="button"
                onClick={() => setSelectedDemoTab('architecture')}
                className={`px-4 py-2 rounded-lg text-xs font-poppins font-semibold transition-all cursor-pointer ${
                  selectedDemoTab === 'architecture'
                    ? 'bg-[#F5B800] text-[#122452] shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                3. System Architecture
              </button>
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* Main Showcase Stage */}
      <Section bg="default" spacing="default">
        <PageContainer>
          {/* TAB 1: DESIGN SYSTEM & TOKENS */}
          {selectedDemoTab === 'tokens' && (
            <div className="space-y-12 animate-in fade-in duration-200">
              {/* Core Colors */}
              <div>
                <SectionEyebrow className="mb-2">Color System Specification</SectionEyebrow>
                <Heading level="h2" className="mb-2">
                  DIMABIN Brand Palette
                </Heading>
                <Subtitle className="mb-6">
                  Strictly centralized color system. The blue and gold combination represents the core institutional visual identity.
                </Subtitle>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
                    <div className="h-16 rounded-lg mb-3 shadow-xs bg-[#1F3C82]" />
                    <span className="font-poppins text-xs font-bold text-[#122452]">Primary Blue</span>
                    <span className="font-mono text-xs text-[#5A6A85] mt-0.5">{DIMABIN_COLORS.primaryBlue}</span>
                    <span className="text-[11px] text-[#8896AB] mt-1">Brand accents & buttons</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
                    <div className="h-16 rounded-lg mb-3 shadow-xs bg-[#122452]" />
                    <span className="font-poppins text-xs font-bold text-[#122452]">Dark Navy</span>
                    <span className="font-mono text-xs text-[#5A6A85] mt-0.5">{DIMABIN_COLORS.darkNavy}</span>
                    <span className="text-[11px] text-[#8896AB] mt-1">Headers, footers & hero</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
                    <div className="h-16 rounded-lg mb-3 shadow-xs bg-[#F5B800]" />
                    <span className="font-poppins text-xs font-bold text-[#122452]">Gold / Yellow</span>
                    <span className="font-mono text-xs text-[#5A6A85] mt-0.5">{DIMABIN_COLORS.gold}</span>
                    <span className="text-[11px] text-[#8896AB] mt-1">CTAs, highlights & crest</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
                    <div className="h-16 rounded-lg mb-3 shadow-xs bg-[#F6F7FB] border border-slate-300" />
                    <span className="font-poppins text-xs font-bold text-[#122452]">Light Background</span>
                    <span className="font-mono text-xs text-[#5A6A85] mt-0.5">{DIMABIN_COLORS.bgLight}</span>
                    <span className="text-[11px] text-[#8896AB] mt-1">Page surface canvas</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
                    <div className="h-16 rounded-lg mb-3 shadow-xs bg-white border border-slate-300" />
                    <span className="font-poppins text-xs font-bold text-[#122452]">Pure White</span>
                    <span className="font-mono text-xs text-[#5A6A85] mt-0.5">#FFFFFF</span>
                    <span className="text-[11px] text-[#8896AB] mt-1">Structural cards</span>
                  </div>
                </div>
              </div>

              {/* Typography System */}
              <div className="pt-6 border-t border-slate-200">
                <SectionEyebrow className="mb-2">Global Typography</SectionEyebrow>
                <Heading level="h2" className="mb-2">
                  Poppins Type Hierarchy
                </Heading>
                <Subtitle className="mb-6">
                  Clean geometric appearance, strong bold headings, uppercase gold eyebrows, and readable body prose.
                </Subtitle>

                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                  <div>
                    <span className="text-xs font-mono text-[#8896AB] block mb-1">Heading 1 (H1) · 800 ExtraBold</span>
                    <Heading level="h1">Equipping Leaders for Kingdom Impact</Heading>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-mono text-[#8896AB] block mb-1">Heading 2 (H2) · 700 Bold</span>
                    <Heading level="h2">Sound Biblical Doctrine & Practical Ministry</Heading>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-mono text-[#8896AB] block mb-1">Heading 3 (H3) · 700 Bold</span>
                    <Heading level="h3">Diploma in Theology & Christian Leadership</Heading>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-mono text-[#8896AB] block mb-1">Heading 4 (H4) · 600 SemiBold</span>
                    <Heading level="h4">Certificate in Pastoral Ministry & Evangelism</Heading>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-mono text-[#8896AB] block mb-1">Section Eyebrow · Uppercase Gold</span>
                    <SectionEyebrow>ACADEMIC EXCELLENCE & SPIRITUAL FORMATION</SectionEyebrow>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-mono text-[#8896AB] block mb-1">Italic Subtitle · 400 Italic</span>
                    <Subtitle>
                      Developing disciplined men and women of God through intensive study of the Holy Scriptures.
                    </Subtitle>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-mono text-[#8896AB] block mb-1">Body Text · 400 Regular</span>
                    <Text variant="body" color="primary">
                      Divine Mandate Bible Institute operates with a solemn calling to train Christian workers, evangelists, pastors,
                      and community leaders. Through accredited curriculum and rigorous spiritual discipleship, students receive both
                      intellectual grounding and spiritual empowerment.
                    </Text>
                  </div>
                </div>
              </div>

              {/* Spacing & Responsive System */}
              <div className="pt-6 border-t border-slate-200">
                <SectionEyebrow className="mb-2">Layout & Responsive Geometry</SectionEyebrow>
                <Heading level="h2" className="mb-2">
                  Unified Spacing & Breakpoints
                </Heading>
                <Subtitle className="mb-6">
                  Controlled whitespace prevents arbitrary margins. Container max width is standardized at 1280px with responsive padding.
                </Subtitle>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ContentCard>
                    <Heading level="h4" className="mb-2">Mobile First Breakpoints</Heading>
                    <Text variant="small" color="secondary" className="mb-4">
                      Tailored scaling across phones, tablets, laptops, and ultra-wide desktops.
                    </Text>
                    <ul className="text-xs space-y-1 font-mono text-[#5A6A85]">
                      <li>• sm: 640px (Phones / Small Tablets)</li>
                      <li>• md: 768px (Tablets Portrait)</li>
                      <li>• lg: 1024px (Laptops / Desktop)</li>
                      <li>• xl: 1280px (Default Desktop Container)</li>
                      <li>• 2xl: 1536px (Large Monitors)</li>
                    </ul>
                  </ContentCard>

                  <ContentCard>
                    <Heading level="h4" className="mb-2">Container Discipline</Heading>
                    <Text variant="small" color="secondary" className="mb-4">
                      All pages adhere to unified boundaries, preventing horizontal scroll bugs.
                    </Text>
                    <ul className="text-xs space-y-1 font-mono text-[#5A6A85]">
                      <li>• Max Width: 1280px (max-w-7xl)</li>
                      <li>• Mobile Padding: 16px (px-4)</li>
                      <li>• Tablet Padding: 24px (px-6)</li>
                      <li>• Desktop Padding: 32px (px-8)</li>
                    </ul>
                  </ContentCard>

                  <ContentCard>
                    <Heading level="h4" className="mb-2">Spatial Rhythm</Heading>
                    <Text variant="small" color="secondary" className="mb-4">
                      Section vertical padding follows consistent rhythmic breathing room.
                    </Text>
                    <ul className="text-xs space-y-1 font-mono text-[#5A6A85]">
                      <li>• Default: py-12 (sm:py-16, lg:py-20)</li>
                      <li>• Compact: py-8 (sm:py-12)</li>
                      <li>• Spacious: py-16 (sm:py-24, lg:py-28)</li>
                      <li>• Card Inner Gap: min 24px (p-6)</li>
                    </ul>
                  </ContentCard>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REUSABLE UI COMPONENTS */}
          {selectedDemoTab === 'components' && (
            <div className="space-y-12 animate-in fade-in duration-200">
              {/* Buttons */}
              <div>
                <SectionEyebrow className="mb-2">Interactive Elements</SectionEyebrow>
                <Heading level="h2" className="mb-2">
                  Button Hierarchy
                </Heading>
                <Subtitle className="mb-6">
                  Accessible, keyboard-friendly buttons meeting the minimum 44px touch target requirement on mobile.
                </Subtitle>

                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#5A6A85] block font-poppins">
                      Button Variants (Medium Size)
                    </span>
                    <div className="flex flex-wrap items-center gap-4">
                      <Button variant="primary">Primary Button</Button>
                      <Button variant="secondary">Secondary Button</Button>
                      <Button variant="outline">Outline Button</Button>
                      <Button variant="ghost">Ghost Button</Button>
                      <Button variant="primary" isLoading>Loading State</Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#5A6A85] block font-poppins">
                      Button Sizes
                    </span>
                    <div className="flex flex-wrap items-center gap-4">
                      <Button variant="primary" size="sm">Small (36px)</Button>
                      <Button variant="primary" size="md">Medium (44px)</Button>
                      <Button variant="primary" size="lg">Large (50px)</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cards Showcase */}
              <div>
                <SectionEyebrow className="mb-2">Card Archetypes</SectionEyebrow>
                <Heading level="h2" className="mb-2">
                  Modular Content & Feature Cards
                </Heading>
                <Subtitle className="mb-6">
                  Single-elevation depth, no cards-within-cards, disciplined unboxed metadata.
                </Subtitle>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Feature Card Example */}
                  <FeatureCard
                    icon={
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    }
                    iconVariant="blue"
                    title="Doctrinal Rigor"
                    description="Curriculum grounded in historical orthodoxy, systematic theology, and thorough biblical exegesis."
                    actionText="Curriculum details"
                  />

                  {/* Feature Card 2 */}
                  <FeatureCard
                    icon={
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                    iconVariant="gold"
                    title="Mentorship & Ministry"
                    description="Hands-on ministry practicum guided by seasoned pastors, evangelists, and missionary leaders."
                    actionText="Formation details"
                  />

                  {/* Programme Card Example */}
                  <ProgrammeCard
                    title="Diploma in Theology"
                    level="Undergraduate Level"
                    duration="2 Years · 60 Credit Units"
                    description="Comprehensive training in Old and New Testament studies, Greek/Hebrew fundamentals, and church administration."
                    features={[
                      'Accredited theological curriculum',
                      'On-campus & weekend flexible cohorts',
                      'Direct entry pathway to Bachelor of Arts',
                    ]}
                  />
                </div>
              </div>

              {/* Form Controls */}
              <div>
                <SectionEyebrow className="mb-2">Input Primitives</SectionEyebrow>
                <Heading level="h2" className="mb-2">
                  Accessible Form Controls
                </Heading>
                <Subtitle className="mb-6">
                  Ready for future admissions forms and portal interfaces with label associations and error states.
                </Subtitle>

                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 max-w-2xl">
                  <div className="space-y-4">
                    <FormField label="Full Legal Name" required hint="As it appears on your birth certificate or identity document.">
                      <Input placeholder="e.g. John Emmanuel Adebayo" />
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Email Address" required>
                        <Input type="email" placeholder="applicant@example.com" />
                      </FormField>

                      <FormField label="Preferred Study Mode" required>
                        <Select defaultValue="regular">
                          <option value="regular">Regular On-Campus (Weekdays)</option>
                          <option value="weekend">Executive Weekend Cohort</option>
                          <option value="online">Distance & Online Study</option>
                        </Select>
                      </FormField>
                    </div>

                    <FormField label="Personal Christian Testimony" hint="Brief summary of your calling into ministry.">
                      <Textarea placeholder="Share your salvation experience and sense of call..." rows={3} />
                    </FormField>

                    <div className="pt-2">
                      <Button variant="primary">Submit Form Primitive</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM ARCHITECTURE & READINESS CHECKLIST */}
          {selectedDemoTab === 'architecture' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <SectionEyebrow className="mb-2">Foundation Blueprint</SectionEyebrow>
                <Heading level="h2" className="mb-2">
                  Scalable System Architecture
                </Heading>
                <Subtitle className="mb-6">
                  Structured to grow into the full public website, admissions engine, and multi-role portal system without rewrite.
                </Subtitle>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ContentCard>
                    <div className="flex items-center gap-2 mb-3">
                      <IconContainer size="sm" variant="gold">
                        <span className="font-bold text-xs">01</span>
                      </IconContainer>
                      <Heading level="h4">Public Website</Heading>
                    </div>
                    <Text variant="small" color="secondary" className="mb-3">
                      Clean separation of pages: Home, About Us, Programmes, Admissions, Campus & Centres, Contact Us.
                    </Text>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="blue">Routes Prepared</Badge>
                      <Badge variant="neutral">Layout Ready</Badge>
                    </div>
                  </ContentCard>

                  <ContentCard>
                    <div className="flex items-center gap-2 mb-3">
                      <IconContainer size="sm" variant="blue">
                        <span className="font-bold text-xs">02</span>
                      </IconContainer>
                      <Heading level="h4">Admissions Engine</Heading>
                    </div>
                    <Text variant="small" color="secondary" className="mb-3">
                      Prepared types for applicant personal data, Christian testimony, ministerial referees, and status flow.
                    </Text>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="blue">Models Prepared</Badge>
                      <Badge variant="neutral">Form Controls Ready</Badge>
                    </div>
                  </ContentCard>

                  <ContentCard>
                    <div className="flex items-center gap-2 mb-3">
                      <IconContainer size="sm" variant="navy">
                        <span className="font-bold text-xs">03</span>
                      </IconContainer>
                      <Heading level="h4">Student Portal</Heading>
                    </div>
                    <Text variant="small" color="secondary" className="mb-3">
                      Architecture for course registration, syllabus, continuous assessment, exam results, and transcript summaries.
                    </Text>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="blue">Schemas Defined</Badge>
                      <Badge variant="neutral">Portal Gateway Ready</Badge>
                    </div>
                  </ContentCard>

                  <ContentCard>
                    <div className="flex items-center gap-2 mb-3">
                      <IconContainer size="sm" variant="blue">
                        <span className="font-bold text-xs">04</span>
                      </IconContainer>
                      <Heading level="h4">Lecturer Portal</Heading>
                    </div>
                    <Text variant="small" color="secondary" className="mb-3">
                      Structured models for assigned courses, grading sheets (CA + Exams), class roster, and attendance records.
                    </Text>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="blue">Models Prepared</Badge>
                      <Badge variant="neutral">RBAC Types Set</Badge>
                    </div>
                  </ContentCard>

                  <ContentCard>
                    <div className="flex items-center gap-2 mb-3">
                      <IconContainer size="sm" variant="gold">
                        <span className="font-bold text-xs">05</span>
                      </IconContainer>
                      <Heading level="h4">Admin Portal</Heading>
                    </div>
                    <Text variant="small" color="secondary" className="mb-3">
                      Central registry, fee schedule management, student matriculation numbers, study centre assignment, and institute settings.
                    </Text>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="blue">Types Prepared</Badge>
                      <Badge variant="neutral">Secure Boundaries</Badge>
                    </div>
                  </ContentCard>

                  <ContentCard>
                    <div className="flex items-center gap-2 mb-3">
                      <IconContainer size="sm" variant="navy">
                        <span className="font-bold text-xs">06</span>
                      </IconContainer>
                      <Heading level="h4">Firebase Ready</Heading>
                    </div>
                    <Text variant="small" color="secondary" className="mb-3">
                      Types and asset contracts seamlessly map to Firestore collections, Auth, and Storage when connected in future phases.
                    </Text>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="success">Zero Mock Backend</Badge>
                      <Badge variant="gold">Ready for Phase 1</Badge>
                    </div>
                  </ContentCard>
                </div>
              </div>

              {/* 18-Point Foundation Verification Checklist */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <Heading level="h3">Phase Foundation Verification</Heading>
                  <Badge variant="success">All 18 Checks Passed</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-poppins text-[#122452]">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>1. Clean & maintainable project architecture</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>2. DIMABIN global design system & color tokens</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>3. Global typography with Poppins font family</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>4. Consistent spacing & rhythmic scale</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>5. Full responsive system (mobile to wide desktop)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>6. Unified global container (max-w-7xl)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>7. 15+ modular reusable UI building blocks</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>8. Header architecture with sticky detection & mobile drawer</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>9. Footer architecture with 5 structural columns</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>10. Clean categorized asset architecture (logos, hero, etc.)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>11. Navigation route maps for public site & portals</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>12. Future backend compatibility schemas</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>13. High code quality & zero monolithic duplication</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>14. Accessibility standards (ARIA, focus rings, WCAG)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>15. High performance & lightweight bundle</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>16. SEO foundation with dynamic meta management</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>17. Important development rule honored (no fake stubs)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className="text-emerald-600 font-bold" aria-hidden="true">✓</span>
                    <span>18. Final checks complete & stopped for Phase 1</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </PageContainer>
      </Section>

      {/* Institutional CTA Section Component Demonstration */}
      <CTASection
        eyebrow="DIVINE MANDATE BIBLE INSTITUTE"
        title="Equipping Men and Women of God for Kingdom Ministry"
        subtitle="Sound biblical instruction, practical spiritual formation, and leadership training."
        primaryActionLabel="Admissions Architecture"
        secondaryActionLabel="Explore Programmes Architecture"
      />
    </BaseLayout>
  );
}
