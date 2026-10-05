/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Centralized Route Map
 *
 * Defines the URL architecture for:
 * 1. Public Institutional Pages
 * 2. Admissions & Applications
 * 3. Future Portal Gateways (Student, Lecturer, Admin)
 */

export const ROUTES = {
  // Public Institutional Routes
  HOME: '/',
  ABOUT: '/about',
  PROGRAMMES: '/programmes',
  ADMISSIONS: '/admissions',
  ADMISSIONS_APPLY: '/admissions/apply',
  ADMISSIONS_REQUIREMENTS: '/admissions/requirements',
  CAMPUS_CENTRES: '/campus-centres',
  CONTACT: '/contact',

  // Portal Gateway & Authentication Routes (Future Phased Implementation)
  PORTAL_GATEWAY: '/portal',
  PORTAL_LOGIN: '/portal/login',

  // Student Portal Architecture (Future)
  STUDENT_PORTAL: {
    DASHBOARD: '/portal/student',
    COURSES: '/portal/student/courses',
    RESULTS: '/portal/student/results',
    FEES: '/portal/student/fees',
    PROFILE: '/portal/student/profile',
  },

  // Lecturer Portal Architecture (Future)
  LECTURER_PORTAL: {
    DASHBOARD: '/portal/lecturer',
    COURSES: '/portal/lecturer/courses',
    GRADING: '/portal/lecturer/grading',
    STUDENTS: '/portal/lecturer/students',
    PROFILE: '/portal/lecturer/profile',
  },

  // Admin Portal Architecture (Future)
  ADMIN_PORTAL: {
    DASHBOARD: '/portal/admin',
    APPLICATIONS: '/portal/admin/applications',
    STUDENTS: '/portal/admin/students',
    LECTURERS: '/portal/admin/lecturers',
    PROGRAMMES: '/portal/admin/programmes',
    FEES: '/portal/admin/fees',
    SETTINGS: '/portal/admin/settings',
  },

  // Legal & Institutional Compliance
  PRIVACY: '/privacy-policy',
  TERMS: '/terms-of-use',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
