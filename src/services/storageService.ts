import { Member, MemberStatusHistory } from '../types/member';
import { AttendanceEvent, EventSchedule } from '../types/event';
import { AttendanceRecord } from '../types/attendance';
import { SystemSettings } from '../types/settings';
import { ActivityLog, ReportSnapshot } from '../types/reports';
import { Announcement } from '../types/announcement';
import { LandingPageConfig } from '../types/landingPage';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import { SAMPLE_ANNOUNCEMENTS } from '../data/sampleAnnouncements';
import { DEFAULT_LANDING_PAGE_CONFIG } from '../data/defaultLandingPage';

const STORAGE_KEYS = {
  MEMBERS: 'mcgi_members',
  EVENTS: 'mcgi_events',
  SCHEDULES: 'mcgi_schedules',
  ATTENDANCE: 'mcgi_attendance',
  ANNOUNCEMENTS: 'mcgi_announcements',
  LANDING_PAGE: 'mcgi_landing_page',
  SETTINGS: 'mcgi_settings',
  LOGS: 'mcgi_logs',
  STATUS_HISTORY: 'mcgi_status_history',
  REPORTS: 'mcgi_reports',
  PENDING_SYNC: 'mcgi_pending_sync_queue',
  ANNOUNCEMENT_DEFAULTS_VERSION: 'mcgi_announcement_defaults_version',
};

export interface SyncQueueItem {
  id: string;
  action: string;
  data: any;
  timestamp: string;
}

export const StorageService = {
  // --- Members ---
  getMembers(): Member[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((m: any) => ({
          ...m,
          memberId: m.memberId || m.memberID || m.id || '',
        }));
        return normalized;
      }
      return [];
    } catch {
      return [];
    }
  },

  saveMembers(members: Member[]) {
    // Ensure all members have clean memberId
    const sanitized = members.map((m: any) => ({
      ...m,
      memberId: m.memberId || m.memberID || m.id || '',
    }));
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(sanitized));
  },

  // --- Events ---
  getEvents(): AttendanceEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((e: any) => ({
          ...e,
          eventId: e.eventId || e.eventID || e.id || '',
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  saveEvents(events: AttendanceEvent[]) {
    const sanitized = events.map((e: any) => ({
      ...e,
      eventId: e.eventId || e.eventID || e.id || '',
    }));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(sanitized));
  },

  // --- Schedules ---
  getSchedules(): EventSchedule[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((s: any) => ({
          ...s,
          scheduleId: s.scheduleId || s.scheduleID || s.id || '',
          eventId: s.eventId || s.eventID || '',
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  saveSchedules(schedules: EventSchedule[]) {
    const sanitized = schedules.map((s: any) => ({
      ...s,
      scheduleId: s.scheduleId || s.scheduleID || s.id || '',
      eventId: s.eventId || s.eventID || '',
    }));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(sanitized));
  },

  // --- Attendance Records ---
  getAttendance(): AttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((a: any) => ({
          ...a,
          attendanceId: a.attendanceId || a.attendanceID || a.id || '',
          memberId: a.memberId || a.memberID || '',
          scheduleId: a.scheduleId || a.scheduleID || '',
          eventId: a.eventId || a.eventID || '',
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  saveAttendance(records: AttendanceRecord[]) {
    const sanitized = records.map((a: any) => ({
      ...a,
      attendanceId: a.attendanceId || a.attendanceID || a.id || '',
      memberId: a.memberId || a.memberID || '',
      scheduleId: a.scheduleId || a.scheduleID || '',
      eventId: a.eventId || a.eventID || '',
    }));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(sanitized));
  },

  // --- Announcements ---
  getAnnouncements(): Announcement[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    if (!raw) {
      this.saveAnnouncements(SAMPLE_ANNOUNCEMENTS);
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENT_DEFAULTS_VERSION, '2026-10-events-v1');
      return SAMPLE_ANNOUNCEMENTS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return SAMPLE_ANNOUNCEMENTS;

      if (localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENT_DEFAULTS_VERSION) !== '2026-10-events-v1') {
        const existingIds = new Set(parsed.map((announcement: Announcement) => announcement.announcementId));
        const missingDefaults = SAMPLE_ANNOUNCEMENTS.filter(
          (announcement) => !existingIds.has(announcement.announcementId)
        );
        const migrated = [...parsed, ...missingDefaults];
        this.saveAnnouncements(migrated);
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENT_DEFAULTS_VERSION, '2026-10-events-v1');
        return migrated;
      }

      return parsed;
    } catch {
      return SAMPLE_ANNOUNCEMENTS;
    }
  },

  saveAnnouncements(announcements: Announcement[]) {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  },

  // --- Landing Page Configuration ---
  getLandingPageConfig(): LandingPageConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.LANDING_PAGE);
    if (!raw) {
      this.saveLandingPageConfig(DEFAULT_LANDING_PAGE_CONFIG);
      return DEFAULT_LANDING_PAGE_CONFIG;
    }
    try {
      return { ...DEFAULT_LANDING_PAGE_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_LANDING_PAGE_CONFIG;
    }
  },

  saveLandingPageConfig(config: LandingPageConfig) {
    localStorage.setItem(STORAGE_KEYS.LANDING_PAGE, JSON.stringify(config));
  },

  // --- Settings ---
  getSettings(): SystemSettings {
    const defaultUrl = (import.meta.env.VITE_APPS_SCRIPT_URL as string) || DEFAULT_SETTINGS.googleSheets.appsScriptUrl || '';
    const defaultSpreadsheetId = (import.meta.env.VITE_SPREADSHEET_ID as string) || DEFAULT_SETTINGS.googleSheets.spreadsheetId || '';

    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      const initial: SystemSettings = {
        ...DEFAULT_SETTINGS,
        googleSheets: {
          ...DEFAULT_SETTINGS.googleSheets,
          appsScriptUrl: defaultUrl,
          spreadsheetId: defaultSpreadsheetId,
        },
      };
      this.saveSettings(initial);
      return initial;
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        googleSheets: {
          ...DEFAULT_SETTINGS.googleSheets,
          ...(parsed.googleSheets || {}),
          // Fall back to permanent default if not set in local storage
          appsScriptUrl: (parsed.googleSheets?.appsScriptUrl && parsed.googleSheets.appsScriptUrl.trim()) || defaultUrl,
          spreadsheetId: (parsed.googleSheets?.spreadsheetId && parsed.googleSheets.spreadsheetId.trim()) || defaultSpreadsheetId,
        },
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: SystemSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- Activity Logs ---
  getLogs(): ActivityLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      const initialLogs: ActivityLog[] = [
        {
          logId: 'LOG-001',
          user: 'Officer Aljon',
          action: 'INITIALIZE',
          module: 'SETTINGS',
          description: 'MCGI Youth Administrative System initialized.',
          timestamp: new Date().toISOString(),
        },
      ];
      this.saveLogs(initialLogs);
      return initialLogs;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveLogs(logs: ActivityLog[]) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  addLog(user: string, action: string, module: ActivityLog['module'], description: string, recordId?: string) {
    const logs = this.getLogs();
    const newLog: ActivityLog = {
      logId: 'LOG-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      user,
      action,
      module,
      recordId,
      description,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.saveLogs(logs.slice(0, 500)); // retain last 500 logs
  },

  // --- Status History ---
  getStatusHistory(): MemberStatusHistory[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STATUS_HISTORY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveStatusHistory(history: MemberStatusHistory[]) {
    localStorage.setItem(STORAGE_KEYS.STATUS_HISTORY, JSON.stringify(history));
  },

  addStatusHistory(memberId: string, prevStatus: any, newStatus: any, reason: string, changedBy: string) {
    const history = this.getStatusHistory();
    history.unshift({
      historyId: 'HST-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      memberId,
      previousStatus: prevStatus,
      newStatus,
      reason,
      changedBy,
      changedAt: new Date().toISOString(),
    });
    this.saveStatusHistory(history);
  },

  // --- Report Snapshots ---
  getReports(): ReportSnapshot[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveReports(reports: ReportSnapshot[]) {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  },

  // --- Offline Sync Queue ---
  getSyncQueue(): SyncQueueItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  addToSyncQueue(action: string, data: any) {
    const queue = this.getSyncQueue();
    queue.push({
      id: 'Q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      action,
      data,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(queue));
  },

  clearSyncQueue() {
    localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
  },

  // --- Full Backup Export / Import ---
  exportBackupJson(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      members: this.getMembers(),
      events: this.getEvents(),
      schedules: this.getSchedules(),
      attendance: this.getAttendance(),
      announcements: this.getAnnouncements(),
      landingPage: this.getLandingPageConfig(),
      settings: this.getSettings(),
      logs: this.getLogs(),
      statusHistory: this.getStatusHistory(),
      reports: this.getReports(),
    };
    return JSON.stringify(backup, null, 2);
  },

  restoreBackupJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.members) this.saveMembers(data.members);
      if (data.events) this.saveEvents(data.events);
      if (data.schedules) this.saveSchedules(data.schedules);
      if (data.attendance) this.saveAttendance(data.attendance);
      if (data.announcements) this.saveAnnouncements(data.announcements);
      if (data.landingPage) this.saveLandingPageConfig(data.landingPage);
      if (data.settings) this.saveSettings(data.settings);
      if (data.logs) this.saveLogs(data.logs);
      if (data.statusHistory) this.saveStatusHistory(data.statusHistory);
      if (data.reports) this.saveReports(data.reports);
      return true;
    } catch (e) {
      console.error('Backup restore failed:', e);
      return false;
    }
  }
};
