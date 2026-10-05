/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Central Design System Tokens
 *
 * Core Visual Identity:
 * - Primary Blue: #1F3C82
 * - Dark Navy: #122452
 * - Gold/Yellow: #F5B800
 * - White: #FFFFFF
 * - Light Background: #F6F7FB
 * - Primary Text: Dark Navy / Charcoal (#122452)
 * - Secondary Text: Cool Grey (#5A6A85)
 *
 * Primary Font: Poppins (Google Fonts)
 */

export const DIMABIN_COLORS = {
  // Brand Core
  primaryBlue: '#1F3C82',
  primaryBlueHover: '#172F68',
  primaryBlueSubtle: '#EEF3FD',

  darkNavy: '#122452',
  darkNavyDeep: '#0A1430',
  darkNavyHover: '#1B2F63',

  gold: '#F5B800',
  goldHover: '#DF9B00',
  goldSubtle: '#FEF8E7',
  goldBorder: '#F5B80033',

  white: '#FFFFFF',
  bgLight: '#F6F7FB',
  bgCard: '#FFFFFF',

  // Typography
  textPrimary: '#122452',
  textSecondary: '#5A6A85',
  textMuted: '#8896AB',
  textLight: '#F6F7FB',

  // Status & Feedback (paired with explicit labels/icons)
  statusSuccess: '#16A34A',
  statusWarning: '#D97706',
  statusDanger: '#DC2626',
  statusInfo: '#1F3C82',

  // Borders & Dividers
  borderSubtle: '#E2E8F0',
  borderNavySubtle: 'rgba(18, 36, 82, 0.08)',
  borderGoldSubtle: 'rgba(245, 184, 0, 0.25)',
} as const;

export const DIMABIN_FONTS = {
  family: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
    extraBold: 800,
  },
} as const;

export const DIMABIN_SPACING = {
  // Page Sections
  sectionYMobile: 'py-12',
  sectionYDesktop: 'py-20',
  sectionSpacingLarge: 'py-28',

  // Component Paddings
  cardPadding: 'p-6 sm:p-8',
  containerPaddingMobile: 'px-4',
  containerPaddingTablet: 'px-6',
  containerPaddingDesktop: 'px-8',

  // Container Max Widths
  maxContainer: 'max-w-7xl', // 1280px
  narrowContainer: 'max-w-4xl', // 896px
  proseContainer: 'max-w-2xl', // 672px
} as const;

export const DIMABIN_BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
