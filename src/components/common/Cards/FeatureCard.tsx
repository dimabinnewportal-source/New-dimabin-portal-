import React from 'react';
import { IconContainer, IconContainerVariant } from '../Feedback/IconContainer';
import { Heading } from '../Typography/Heading';
import { Text } from '../Typography/Text';

export interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconVariant?: IconContainerVariant;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * DIMABIN Feature Card
 * Standard pattern for institutional pillars, academic features, and student benefits.
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  iconVariant = 'blue',
  actionText,
  onAction,
  className = '',
  ...rest
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl p-6 sm:p-7 border border-[#E2E8F0] shadow-sm
        transition-all duration-200 hover:shadow-md hover:border-[#1F3C82]/30
        flex flex-col h-full ${className}
      `.trim()}
      {...rest}
    >
      <IconContainer variant={iconVariant} size="lg" className="mb-5">
        {icon}
      </IconContainer>

      <Heading level="h4" className="mb-2 text-[#122452]">
        {title}
      </Heading>

      <Text variant="body" color="secondary" className="flex-1 mb-4">
        {description}
      </Text>

      {actionText && (
        <button
          type="button"
          onClick={onAction}
          className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F3C82] hover:text-[#172F68] transition-colors self-start cursor-pointer group"
        >
          <span>{actionText}</span>
          <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
            →
          </span>
        </button>
      )}
    </div>
  );
};
