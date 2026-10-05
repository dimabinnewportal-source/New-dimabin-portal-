/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Content Management (CMS) Types
 */

export interface TestimonialItem {
  id: string;
  fullName: string;
  roleOrMinistry: string;
  programmeGraduated: string;
  quote: string;
  photoUrl?: string;
  yearOfGraduation: number;
}

export interface NewsOrEvent {
  id: string;
  title: string;
  slug: string;
  type: 'news' | 'event' | 'academic_calendar';
  summary: string;
  content: string;
  eventDate?: string;
  location?: string;
  imageUrl?: string;
  publishedAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'admissions' | 'academics' | 'fees' | 'portals';
}
