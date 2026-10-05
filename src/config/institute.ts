/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Official Institute Configuration & Metadata
 */

export const INSTITUTE_CONFIG = {
  name: 'DIVINE MANDATE BIBLE INSTITUTE',
  shortName: 'DIMABIN',
  acronym: 'DIMABIN',
  subtitle: 'CITADEL OF LEARNING',
  heroSubtitle: 'Interdenominational Citadel of Learning',
  motto: 'FEAR OF GOD WITHOUT A MESS',
  rector: {
    name: 'Sorinola J.O.',
    title: 'Rector, Divine Mandate Bible Institute',
    initials: 'SJ',
    quote:
      "Our vision is simple yet profound: to establish a world-class training center that balances deep scriptural analysis with uncompromising spiritual development. At DIMABIN, we strive for 'Fear of God without a Mess'—maintaining pristine ethical standards alongside rigorous academic discipline. We invite you to join us as we embark on this sacred journey of learning and spiritual transformation.",
  },
  vision:
    'To be a globally recognized interdenominational Bible institute, producing spiritually robust, intellectually equipped, and morally sound Christian leaders who will propagate the Gospel of Christ with absolute integrity and power across all nations.',
  mission:
    'To deliver top-tier biblical and theological education through comprehensive training, mentoring, and practical service, instilling the fear of God as the core foundation for a successful, scandal-free Christian ministry and professional life.',

  // Institutional contact placeholders
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
