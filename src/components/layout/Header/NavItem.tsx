import React from 'react';

interface NavItemProps {
  label: string;
  href: string;
  isActive?: boolean;
  isDarkTheme?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * DIMABIN Navigation Item (Desktop)
 * Clean typography link with subtle underline hover, strictly adhering to anti-pill discipline.
 */
export const NavItem: React.FC<NavItemProps> = ({
  label,
  href,
  isActive = false,
  isDarkTheme = true,
  onClick,
  className = '',
}) => {
  const activeColor = isDarkTheme ? 'text-[#F5B800] font-semibold' : 'text-[#1F3C82] font-semibold';
  const inactiveColor = isDarkTheme
    ? 'text-slate-100 hover:text-[#F5B800]'
    : 'text-[#122452] hover:text-[#1F3C82]';

  return (
    <a
      href={href}
      onClick={onClick}
      className={`
        relative py-2 text-sm font-poppins font-medium whitespace-nowrap transition-colors
        ${isActive ? activeColor : inactiveColor}
        ${className}
      `.trim()}
      aria-current={isActive ? 'page' : undefined}
    >
      <span>{label}</span>
      {/* Bottom active indicator */}
      {isActive && (
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F5B800] rounded-full"
          aria-hidden="true"
        />
      )}
    </a>
  );
};
