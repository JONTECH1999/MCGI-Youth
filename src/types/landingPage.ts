export type VerificationMethod = 'member_id' | 'birthday' | 'simple';
export type ThemePalette = 'beige' | 'slate' | 'navy';

export interface GatheringImagesConfig {
  prayerMeeting?: string;
  worshipService?: string;
  thanksgiving?: string;
  fellowship?: string;
}

export interface GatheringItem {
  id: string;
  num?: string;
  title: string;
  subtitle?: string;
  date?: string;
  desc?: string;
  image: string;
  type?: string;
  linkedEventId?: string;
}

export interface LandingPageConfig {
  chapterName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroImages?: string[];
  aboutImageUrl?: string;
  processImageUrl?: string;
  gatherings?: GatheringItem[];
  gatheringImages?: GatheringImagesConfig;
  featuredEventId?: string;
  featuredAnnouncementId?: string;
  verificationMethod: VerificationMethod;
  colorTheme: ThemePalette;
  contactEmail?: string;
  contactLocation?: string;
  showMemberSearch: boolean;
  showAnnouncements: boolean;
  announcementsTitle?: string;
  announcementsSubtitle?: string;
  announcementsLimit?: number;
  showUpcomingEvents: boolean;
  updatedAt: string;
}

