import React from 'react';
import { Heading } from '../Typography/Heading';
import { Text } from '../Typography/Text';
import { Button } from '../Button/Button';
import { Badge } from '../Feedback/Badge';

export interface ProgrammeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  level: string;
  duration: string;
  description: string;
  features?: string[];
  ctaLabel?: string;
  onApply?: () => void;
  onLearnMore?: () => void;
  className?: string;
}

/**
 * DIMABIN Programme Card
 * Structured academic card building block designed for Certificate, Diploma,
 * Degree, and Postgraduate study programmes.
 */
export const ProgrammeCard: React.FC<ProgrammeCardProps> = ({
  title,
  level,
  duration,
  description,
  features = [],
  ctaLabel = 'Apply Now',
  onApply,
  onLearnMore,
  className = '',
  ...rest
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl border border-[#E2E8F0] shadow-sm
        flex flex-col h-full overflow-hidden transition-all duration-200
        hover:shadow-md hover:border-[#1F3C82]/30 ${className}
      `.trim()}
      {...rest}
    >
      {/* Top Banner Accent */}
      <div className="h-1.5 w-full bg-[#1F3C82]" />

      <div className="p-6 sm:p-7 flex flex-col flex-1">
        {/* Level and Duration Metadata (disciplined unboxed text) */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="blue">{level}</Badge>
          <span className="text-xs font-medium text-[#5A6A85] font-poppins">{duration}</span>
        </div>

        <Heading level="h4" className="mb-2 text-[#122452]">
          {title}
        </Heading>

        <Text variant="body" color="secondary" className="mb-5 flex-1 line-clamp-3">
          {description}
        </Text>

        {features.length > 0 && (
          <ul className="mb-6 space-y-2 border-t border-[#E2E8F0] pt-4">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-[#5A6A85]">
                <span className="text-[#F5B800] font-bold" aria-hidden="true">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-[#E2E8F0] mt-auto">
          <Button variant="primary" size="sm" onClick={onApply} className="flex-1">
            {ctaLabel}
          </Button>
          {onLearnMore && (
            <Button variant="ghost" size="sm" onClick={onLearnMore}>
              Details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
