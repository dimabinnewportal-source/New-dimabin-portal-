import React from 'react';
import { PageContainer } from '../Layout/PageContainer';
import { Heading } from '../Typography/Heading';
import { SectionEyebrow } from '../Typography/SectionEyebrow';
import { Subtitle } from '../Typography/Subtitle';
import { Button } from '../Button/Button';

export interface CTASectionProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionHref?: string;
  className?: string;
}

/**
 * DIMABIN Reusable Call-To-Action (CTA) Section
 * High-impact institutional banner using Dark Navy (#122452) and Gold (#F5B800) accents.
 */
export const CTASection: React.FC<CTASectionProps> = ({
  eyebrow = 'ADMISSIONS IN PROGRESS',
  title,
  subtitle,
  primaryActionLabel = 'Apply for Admission',
  onPrimaryAction,
  primaryActionHref,
  secondaryActionLabel = 'View Programmes',
  onSecondaryAction,
  secondaryActionHref,
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden bg-[#122452] text-white py-14 sm:py-20 border-y border-[#1F3C82] ${className}`}
    >
      {/* Decorative Subtle Gold Geometric Glow */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 bg-[#F5B800]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#1F3C82]/30 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <PageContainer className="relative z-10 text-center">
        {eyebrow && (
          <SectionEyebrow variant="gold" align="center" className="mb-3">
            {eyebrow}
          </SectionEyebrow>
        )}

        <Heading level="h2" variant="light" align="center" className="max-w-3xl mx-auto mb-4">
          {title}
        </Heading>

        {subtitle && (
          <Subtitle variant="light" align="center" className="mb-8 opacity-90">
            {subtitle}
          </Subtitle>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          {primaryActionLabel && (
            <Button
              variant="secondary"
              size="lg"
              onClick={onPrimaryAction}
              href={primaryActionHref}
            >
              {primaryActionLabel}
            </Button>
          )}

          {secondaryActionLabel && (
            <Button
              variant="gold-outline"
              size="lg"
              onClick={onSecondaryAction}
              href={secondaryActionHref}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      </PageContainer>
    </div>
  );
};
