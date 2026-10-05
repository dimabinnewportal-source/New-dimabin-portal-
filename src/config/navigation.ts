/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Central Navigation Architecture
 */

import { ROUTES } from './routes';

export interface NavLinkItem {
  readonly label: string;
  readonly href: string;
  readonly description?: string;
  readonly isExternal?: boolean;
}

export interface NavSection {
  readonly title: string;
  readonly items: readonly NavLinkItem[];
}

// Public Primary Navigation
export const MAIN_NAV_ITEMS: readonly NavLinkItem[] = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'About Us', href: ROUTES.ABOUT },
  { label: 'Admissions', href: ROUTES.ADMISSIONS },
  { label: 'Contact Us', href: ROUTES.CONTACT },
] as const;

// Portal Gateway Links for Header & Footer
export const PORTAL_NAV_ITEMS: readonly NavLinkItem[] = [
  {
    label: 'Student Portal',
    href: ROUTES.STUDENT_PORTAL.DASHBOARD,
    description: 'Course registration, lecture notes, academic results, and fees.',
  },
  {
    label: 'Lecturer Portal',
    href: ROUTES.LECTURER_PORTAL.DASHBOARD,
    description: 'Course management, student assessment, attendance, and grading.',
  },
  {
    label: 'Admin Portal',
    href: ROUTES.ADMIN_PORTAL.DASHBOARD,
    description: 'Admissions management, registry, finance, and institute settings.',
  },
] as const;

// Footer Link Architecture
export const FOOTER_NAVIGATION: {
  readonly quickLinks: readonly NavLinkItem[];
  readonly academicLinks: readonly NavLinkItem[];
  readonly portalLinks: readonly NavLinkItem[];
  readonly legalLinks: readonly NavLinkItem[];
} = {
  quickLinks: [
    { label: 'About DIMABIN', href: ROUTES.ABOUT },
    { label: 'Academic Programmes', href: ROUTES.PROGRAMMES },
    { label: 'Admissions & Apply', href: ROUTES.ADMISSIONS },
    { label: 'Campus & Centres', href: ROUTES.CAMPUS_CENTRES },
    { label: 'Contact Us', href: ROUTES.CONTACT },
  ],
  academicLinks: [
    { label: 'Certificate in Ministry', href: `${ROUTES.PROGRAMMES}#certificate` },
    { label: 'Diploma in Theology', href: `${ROUTES.PROGRAMMES}#diploma` },
    { label: 'Bachelor of Arts in Ministry', href: `${ROUTES.PROGRAMMES}#degree` },
    { label: 'Postgraduate Studies', href: `${ROUTES.PROGRAMMES}#postgraduate` },
  ],
  portalLinks: PORTAL_NAV_ITEMS,
  legalLinks: [
    { label: 'Privacy Policy', href: ROUTES.PRIVACY },
    { label: 'Terms of Use', href: ROUTES.TERMS },
  ],
};
