import { SystemSettings } from '../types/settings';
import { DEFAULT_COMMITTEE_SETTINGS } from './sampleCommittees';

export const DEFAULT_SETTINGS: SystemSettings = {
  attendanceRules: {
    regularThresholdPercent: 75,
    activeThresholdPercent: 50,
    missedEventsBeforeAtRisk: 3,
    missedEventsBeforeInactive: 5,
    daysWithoutAttendanceBeforeInactive: 30,
    monitoringPeriodDays: 60,
    excusedCountsAsMissed: false,
    qualifyingEventTypes: ['Prayer Meeting', 'Thanksgiving', 'Worship Service'],
    countingMethod: 'event_level', // Default to event-level attendance, but configurable
  },
  googleSheets: {
    spreadsheetId: (import.meta.env.VITE_SPREADSHEET_ID as string) || '',
    appsScriptUrl: (import.meta.env.VITE_APPS_SCRIPT_URL as string) || '',
    connectionStatus: 'Disconnected',
    lastSyncTimestamp: undefined,
  },
  committees: DEFAULT_COMMITTEE_SETTINGS,
};
