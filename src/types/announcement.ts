import type { AudienceTarget } from '@/types/targeting';

export type AnnouncementPriority = 'normal' | 'high' | 'urgent';
export type AnnouncementStatus = 'draft' | 'active' | 'archived';
export type AnnouncementCategory =
  | 'General Notice'
  | 'Assignment'
  | 'Study Material'
  | 'Important Alert'
  | 'Event'
  | 'Holiday';

export interface CampusAnnouncement {
  id: string;
  title: string;
  description: string;
  category: AnnouncementCategory;
  target: AudienceTarget;
  authorId: string;
  authorName: string;
  priority: AnnouncementPriority;
  isPinned: boolean;
  status: AnnouncementStatus;
  createdAt: string;
  updatedAt?: string;
  analytics: {
    delivered: number;
    viewed: number;
  };
}

export interface CreateAnnouncementInput {
  title: string;
  description: string;
  category: AnnouncementCategory;
  target: AudienceTarget;
  authorId: string;
  authorName: string;
  priority?: AnnouncementPriority;
  isPinned?: boolean;
}
