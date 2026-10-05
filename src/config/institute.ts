/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Official Institute Configuration & Metadata
 */

export const INSTITUTE_CONFIG = {
  name: 'Divine Mandate Bible Institute',
  shortName: 'DIMABIN',
  acronym: 'DIMABIN',
  motto: 'Equipping Leaders for Kingdom Impact',
  vision: 'To raise Christ-centered, scripture-grounded, and transformative leaders for the Church and society.',
  mission: 'Providing sound biblical instruction, practical ministry formation, and ethical leadership development through flexible and accessible theological education.',

  // Institutional contact placeholders (ready for official configuration)
  contact: {
    email: 'info@dimabin.org',
    admissionsEmail: 'admissions@dimabin.org',
    supportEmail: 'support@dimabin.org',
    phone: '+234 (0) 800-DIMABIN',
    address: 'Divine Mandate Bible Institute Campus & Study Centres',
    city: 'Lagos',
    country: 'Nigeria',
    operatingHours: 'Monday – Friday: 8:00 AM – 5:00 PM (WAT)',
  },

  socialLinks: [
    { label: 'Facebook', url: 'https://facebook.com', key: 'facebook' },
    { label: 'YouTube', url: 'https://youtube.com', key: 'youtube' },
    { label: 'WhatsApp', url: 'https://whatsapp.com', key: 'whatsapp' },
    { label: 'Instagram', url: 'https://instagram.com', key: 'instagram' },
  ],

  // Academic Framework Reference
  academicLevels: [
    'Certificate in Ministry',
    'Diploma in Theology & Christian Ministry',
    'Bachelor of Arts in Christian Leadership',
    'Postgraduate Diploma in Ministry',
  ],

  studyModes: [
    { id: 'regular', label: 'On-Campus (Regular)' },
    { id: 'weekend', label: 'Executive Weekend' },
    { id: 'online', label: 'Distance & Online Learning' },
  ],
} as const;
