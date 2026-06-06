import { announcementRepository } from '@/repositories/announcement.repository';
import { audienceToLabel, estimateAudience, matchesAudience } from '@/services/targeting.service';
import type { CampusAnnouncement, CreateAnnouncementInput } from '@/types/announcement';
import type { TargetableProfile } from '@/types/targeting';

export async function listAnnouncementsForProfile(
  profile?: TargetableProfile | null,
): Promise<CampusAnnouncement[]> {
  const announcements = await announcementRepository.list();
  const active = announcements.filter((announcement) => announcement.status === 'active');
  return profile ? active.filter((announcement) => matchesAudience(profile, announcement.target)) : active;
}

export async function createAnnouncement(input: CreateAnnouncementInput): Promise<CampusAnnouncement> {
  return announcementRepository.create(input);
}

export function getAnnouncementAudienceLabel(announcement: CampusAnnouncement): string {
  return audienceToLabel(announcement.target);
}

export function estimateAnnouncementReach(input: Pick<CreateAnnouncementInput, 'target'>) {
  return estimateAudience(input.target);
}
