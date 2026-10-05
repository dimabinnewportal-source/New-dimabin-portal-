/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Academic Management Data Models
 *
 * Covers institutional courses, programmes, study centres,
 * semester structures, and grading systems.
 */

export type StudyMode = 'regular' | 'weekend' | 'online';

export type ProgrammeLevel =
  | 'certificate'
  | 'diploma'
  | 'bachelor'
  | 'postgraduate';

export interface Programme {
  id: string;
  code: string; // e.g. "DIP-TH"
  title: string;
  level: ProgrammeLevel;
  durationMonths: number;
  description: string;
  requirements: string[];
  totalCreditUnits: number;
  availableModes: StudyMode[];
  isActive: boolean;
}

export interface Course {
  id: string;
  code: string; // e.g. "BIB101"
  title: string;
  creditUnits: number;
  level: string;
  semester: 1 | 2;
  programmeId: string;
  description: string;
  syllabusOutline?: string[];
}

export interface StudyCentre {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  coordinatorName: string;
  coordinatorPhone: string;
  coordinatorEmail: string;
  isActive: boolean;
}

export interface CourseEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  academicSession: string; // "2026/2027"
  semester: 1 | 2;
  status: 'registered' | 'completed' | 'dropped';
}

export interface AcademicResult {
  id: string;
  studentId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  caScore: number; // Continuous Assessment (0-30)
  examScore: number; // Examination (0-70)
  totalScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  gradePoint: number;
  academicSession: string;
  semester: 1 | 2;
  approvedBy?: string;
  isPublished: boolean;
}

export interface AcademicTranscriptSummary {
  studentId: string;
  totalUnitsRegistered: number;
  totalUnitsEarned: number;
  cumulativeGradePoints: number;
  cgpa: number; // 0.00 - 5.00
  classOfAward?: string;
}
