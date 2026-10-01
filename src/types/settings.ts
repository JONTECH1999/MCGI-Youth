export type AttendanceCountingMethod = 'separate' | 'event_level';

export interface AttendanceRules {
  regularThresholdPercent: number; // e.g., 75%
  activeThresholdPercent: number; // e.g., 50%
  missedEventsBeforeAtRisk: number; // e.g., 3 missed events
  missedEventsBeforeInactive: number; // e.g., 5 missed events
  daysWithoutAttendanceBeforeInactive: number; // e.g., 30 days
  monitoringPeriodDays: number; // e.g., 60 days
  excusedCountsAsMissed: boolean; // false by default
  qualifyingEventTypes: string[]; // ['Prayer Meeting', 'Thanksgiving', 'Worship Service']
  countingMethod: AttendanceCountingMethod; // 'separate' or 'event_level'
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  appsScriptUrl: string;
  lastSyncTimestamp?: string;
  connectionStatus: 'Connected' | 'Disconnected' | 'Checking' | 'Error';
  lastError?: string;
}

export interface SystemSettings {
  attendanceRules: AttendanceRules;
  googleSheets: GoogleSheetsConfig;
}
