export type AnnouncementStatus = 'Draft' | 'Published' | 'Archived';

export interface Announcement {
  announcementId: string; // e.g. "ANN-001"
  title: string;
  image?: string;
  description: string;
  publishDate: string; // YYYY-MM-DD
  startDisplayDate?: string;
  endDisplayDate?: string;
  location?: string;
  eventDate?: string;
  linkedEventId?: string;
  status: AnnouncementStatus;
  featured: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
