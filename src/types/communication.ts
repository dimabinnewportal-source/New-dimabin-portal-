/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Notifications, Announcements & Communication Models
 */

import { UserRole } from './auth';

export type AnnouncementAudience = 'all' | UserRole;

export interface InstituteAnnouncement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  publishedAt: string;
  expiresAt?: string;
  isUrgent: boolean;
  authorName: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}
