export type VerificationMethod = 'member_id' | 'birthday' | 'simple';
export type ThemePalette = 'beige' | 'slate' | 'navy';

export interface LandingPageConfig {
  chapterName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  featuredEventId?: string;
  featuredAnnouncementId?: string;
  verificationMethod: VerificationMethod;
  colorTheme: ThemePalette;
  contactEmail?: string;
  contactLocation?: string;
  showMemberSearch: boolean;
  showAnnouncements: boolean;
  showUpcomingEvents: boolean;
  updatedAt: string;
}
