/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Authentication & Identity Models
 *
 * Designed to cleanly map to future Firebase Authentication
 * and Firestore user profile documents without refactoring.
 */

export type UserRole = 'student' | 'lecturer' | 'admin' | 'applicant';

export type UserStatus = 'active' | 'suspended' | 'pending_verification' | 'graduated';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  middleName?: string;
  phoneNumber?: string;
  photoUrl?: string;
  studyCentreId?: string;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

export interface StudentProfile extends UserProfile {
  role: 'student';
  matriculationNumber: string;
  programmeId: string;
  currentLevel: string; // e.g. "Year 1", "Certificate"
  admissionSession: string; // e.g. "2026/2027"
}

export interface LecturerProfile extends UserProfile {
  role: 'lecturer';
  staffId: string;
  assignedDepartment: string;
  assignedCourseIds: string[];
}

export interface AdminProfile extends UserProfile {
  role: 'admin';
  staffId: string;
  permissions: string[];
}

export interface AuthSessionState {
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}
