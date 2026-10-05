/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Admissions & Application Models
 */

import { ProgrammeLevel, StudyMode } from './academic';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'interview_scheduled'
  | 'accepted'
  | 'declined'
  | 'admitted';

export interface ChristianTestimony {
  salvationExperience: string;
  baptismStatus: 'water' | 'holy_spirit' | 'both' | 'none';
  homeChurchName: string;
  pastorName: string;
  pastorPhone: string;
  yearsInMinistry?: number;
  callingDescription: string;
}

export interface RefereeContact {
  fullName: string;
  relationship: string; // e.g. "Pastor", "Ministry Leader", "Employer"
  phoneNumber: string;
  email: string;
}

export interface ApplicantApplication {
  id: string;
  applicantUserId: string;
  applicationNumber: string; // e.g. "DIMABIN-2026-0012"
  programmeId: string;
  programmeLevel: ProgrammeLevel;
  studyMode: StudyMode;
  preferredStudyCentreId: string;

  // Personal Info
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  nationality: string;
  residentialAddress: string;
  phoneNumber: string;
  email: string;

  // Spiritual Profile
  testimony: ChristianTestimony;
  referee: RefereeContact;

  // Status & Timestamps
  status: ApplicationStatus;
  submittedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
}
