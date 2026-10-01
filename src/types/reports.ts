import { DemographicStatistics, MembershipStatistics } from './statistics';

export type ReportPeriodType = 'Monthly' | 'Quarterly' | 'Yearly' | 'Custom';

export interface ReportSnapshot {
  snapshotId: string;
  title: string;
  periodType: ReportPeriodType;
  periodLabel: string; // e.g. "September 2026", "Q3 2026", "Jan - Sep 2026"
  startDate: string;
  endDate: string;
  createdAt: string;
  createdBy: string;
  notes?: string;
  membershipStats: MembershipStatistics;
  demographicStats: DemographicStatistics;
  attendanceSummary: {
    totalEvents: number;
    totalAttendanceRecords: number;
    presentRate: number;
    presentCount: number;
    absentCount: number;
    excusedCount: number;
    lateCount: number;
  };
}

export interface ActivityLog {
  logId: string;
  user: string;
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'ATTENDANCE_RECORD', 'SYNC', 'SETTINGS_CHANGE'
  module: 'MEMBERS' | 'ATTENDANCE' | 'EVENTS' | 'SCHEDULES' | 'SETTINGS' | 'REPORTS';
  recordId?: string;
  description: string;
  timestamp: string;
}
