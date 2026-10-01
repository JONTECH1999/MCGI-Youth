export type AttendanceStatus = 'Present' | 'Absent' | 'Excused' | 'Late';

export interface AttendanceRecord {
  attendanceId: string; // ATT001 (Unique)
  eventId: string;
  scheduleId: string;
  memberId: string;
  memberName: string;
  eventName: string;
  eventDate: string; // YYYY-MM-DD
  schedule: string; // e.g. "7:00 PM Thursday"
  attendanceStatus: AttendanceStatus;
  recordedBy: string;
  recordedAt: string;
  updatedAt: string;
  notes?: string;
}

export interface AttendanceFilter {
  eventId?: string;
  scheduleId?: string;
  date?: string;
  memberSearch?: string;
  memberCategory?: 'All' | 'Junior' | 'Senior';
  membershipStatus?: 'All' | 'Active' | 'On & Off' | 'Inactive' | 'Suspended' | 'Missing';
  committee?: string;
}
