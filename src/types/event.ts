export type EventType = 
  | 'Prayer Meeting' 
  | 'Thanksgiving' 
  | 'Worship Service' 
  | 'Youth Activity' 
  | 'Bible Study' 
  | 'Meeting' 
  | 'Other';

export type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

export interface AttendanceEvent {
  eventId: string; // EVT001
  eventName: string;
  eventType: EventType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  location: string;
  description?: string;
  attendanceRule?: string; // Custom rule override if applicable
  eventImage?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  status: EventStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventSchedule {
  scheduleId: string; // SCH001
  eventId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. 07:00 PM
  endTime?: string;
  scheduleLabel: string; // e.g. "7:00 PM Thursday", "3:30 AM Live", "5:00 AM Sunday"
  location: string;
  status: 'Active' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}
