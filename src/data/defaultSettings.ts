import { SystemSettings } from '../types/settings';

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
    spreadsheetId: '',
    appsScriptUrl: '',
    connectionStatus: 'Disconnected',
    lastSyncTimestamp: undefined,
  },
};
