import { StorageService } from './storageService';
import { Member } from '../types/member';
import { AttendanceEvent, EventSchedule } from '../types/event';
import { AttendanceRecord } from '../types/attendance';
import { SystemSettings } from '../types/settings';
import { ReportSnapshot } from '../types/reports';
import { Announcement } from '../types/announcement';
import { LandingPageConfig } from '../types/landingPage';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const getSupabaseAccessToken = async (): Promise<string | null> => {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  return error ? null : data.session?.access_token || null;
};

const verifyAppsScriptStaffAccess = async (url: string, token: string): Promise<GasApiResponse> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'authCheck', authToken: token }),
  });
  if (!response.ok) return { success: false, message: `Google Apps Script returned HTTP ${response.status}.` };
  return await response.json();
};

export interface GasApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
  spreadsheetTitle?: string;
  spreadsheetId?: string;
}

export const GasApiService = {
  getApiUrl(): string {
    const settings = StorageService.getSettings();
    return settings.googleSheets.appsScriptUrl ? settings.googleSheets.appsScriptUrl.trim() : '';
  },

  isConfigured(): boolean {
    const url = this.getApiUrl();
    return Boolean(url && url.startsWith('http') && url.includes('/exec'));
  },

  /**
   * Ping / Test Connection with smart diagnostics
   */
  async testConnection(urlOverride?: string): Promise<GasApiResponse> {
    const rawUrl = (urlOverride || this.getApiUrl() || '').trim();
    if (!rawUrl) {
      return {
        success: false,
        message: 'No Google Apps Script Web App URL provided.',
      };
    }

    if (rawUrl.includes('docs.google.com/spreadsheets')) {
      return {
        success: false,
        message: 'Spreadsheet URL detected instead of Apps Script Web App URL! You must open Extensions > Apps Script > Deploy > New deployment > Web app, and paste the Web App URL that ends in /exec.',
      };
    }

    if (!rawUrl.includes('/exec')) {
      return {
        success: false,
        message: 'Invalid Web App URL. The URL must end with /exec (e.g. https://script.google.com/macros/s/.../exec).',
      };
    }

    try {
      if (isSupabaseConfigured) {
        const token = await getSupabaseAccessToken();
        if (!token) return { success: false, message: 'Sign in with an active officer account first.' };
        return await verifyAppsScriptStaffAccess(rawUrl, token);
      }

      const pingUrl = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}action=ping`;
      const response = await fetch(pingUrl, { method: 'GET', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const json = await response.json();
      return json;
    } catch (err: any) {
      console.warn('Google Apps Script connection test error:', err);
      let msg = err.message || 'Failed to connect to Google Apps Script Web App.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
        msg = 'Connection blocked (Failed to fetch). Crucial check: In Google Apps Script, make sure your deployment has "Who has access" set to "Anyone". If set to "Only myself", Google blocks all browser connections!';
      }
      return {
        success: false,
        message: msg,
      };
    }
  },

  /**
   * Pull all latest data from Google Sheets
   */
  async pullAllData(): Promise<GasApiResponse<{
    members: Member[];
    events: AttendanceEvent[];
    schedules: EventSchedule[];
    attendance: AttendanceRecord[];
    settings: any[];
    activityLogs: any[];
    statusHistory: any[];
    reports: ReportSnapshot[];
  }>> {
    if (isSupabaseConfigured) {
      return { success: false, message: 'Supabase is the source of truth. Pull data from Supabase instead of Google Sheets.' };
    }
    const url = this.getApiUrl();
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Google Apps Script URL is not configured.',
      };
    }

    try {
      const authToken = await getSupabaseAccessToken();
      if (isSupabaseConfigured && !authToken) {
        return { success: false, message: 'Sign in with an active officer account before reading Google Sheets.' };
      }
      const tokenQuery = authToken ? `&authToken=${encodeURIComponent(authToken)}` : '';
      const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=getAllData${tokenQuery}`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return json;
    } catch (err: any) {
      console.error('Failed to pull all data from Google Sheets:', err);
      return {
        success: false,
        message: err.message || 'Error pulling data from Google Sheets.',
      };
    }
  },

  async pullAllDataForInitialMigration(): Promise<GasApiResponse<{
    members: Member[];
    events: AttendanceEvent[];
    schedules: EventSchedule[];
    attendance: AttendanceRecord[];
    settings: any[];
    activityLogs: any[];
    statusHistory: any[];
    reports: ReportSnapshot[];
  }>> {
    if (!isSupabaseConfigured || !this.isConfigured()) {
      return { success: false, message: 'Supabase and a configured Google Apps Script connection are required for initial import.' };
    }
    return this.postAction('getAllData', {});
  },

  /**
   * Generic POST caller to Google Apps Script
   */
  async postAction<T = any>(action: string, data: any): Promise<GasApiResponse<T>> {
    const url = this.getApiUrl();

    // If not configured
    if (!this.isConfigured()) {
      if (isSupabaseConfigured) {
        return {
          success: false,
          message: 'Google Apps Script is not configured; the Supabase save can still succeed without a Sheets copy.',
        };
      }
      if (['initSpreadsheet', 'pushAllData', 'saveOfficialSummary'].includes(action)) {
        return {
          success: false,
          message: 'Google Apps Script URL is not configured or does not end in /exec.',
        };
      }
      StorageService.addToSyncQueue(action, data);
      return {
        success: true,
        message: 'Saved to local system (Google Sheets URL not configured yet; action queued).',
      };
    }

    try {
      const authToken = await getSupabaseAccessToken();
      if (isSupabaseConfigured && !authToken) {
        return { success: false, message: 'Sign in with an active officer account before writing to Google Sheets.' };
      }
      if (authToken) {
        const authorization = await verifyAppsScriptStaffAccess(url, authToken);
        if (!authorization.success) {
          return { success: false, message: authorization.message || 'Google Apps Script authorization is not configured.' };
        }
      }
      // Use text/plain to avoid CORS preflight issues with Google Apps Script web apps
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, data, authToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: GasApiResponse<T> = await response.json();
      return json;
    } catch (err: any) {
      console.warn(`GAS POST failed for action ${action}:`, err);
      let errMsg = err.message || 'Network error communicating with Google Sheets.';
      if (errMsg.includes('Failed to fetch')) {
        errMsg = 'Failed to reach Google Sheets (Failed to fetch). Check if Apps Script is deployed with "Who has access: Anyone", or run initializeSpreadsheetStructure directly in Apps Script editor.';
      }
      if (['initSpreadsheet', 'pushAllData', 'saveOfficialSummary'].includes(action)) {
        return {
          success: false,
          message: errMsg,
        };
      }
      StorageService.addToSyncQueue(action, data);
      return {
        success: true, // Gracefully processed locally for background edits
        message: 'Saved locally. Queued for background synchronization when connection restores.',
      };
    }
  },

  /**
   * Process all queued changes to Google Sheets
   */
  async flushSyncQueue(): Promise<{ total: number; succeeded: number; failed: number }> {
    const queue = StorageService.getSyncQueue();
    if (queue.length === 0 || !this.isConfigured()) {
      return { total: 0, succeeded: 0, failed: 0 };
    }

    let succeeded = 0;
    let failed = 0;
    const remainingQueue = [];

    for (const item of queue) {
      try {
        const res = await this.postAction(item.action, item.data);
        if (res.success) {
          succeeded++;
        } else {
          failed++;
          remainingQueue.push(item);
        }
      } catch {
        failed++;
        remainingQueue.push(item);
      }
    }

    localStorage.setItem('mcgi_pending_sync_queue', JSON.stringify(remainingQueue));
    return { total: queue.length, succeeded, failed };
  },

  /**
   * Helper: ensure member has non-empty lastName for Google Apps Script validation
   */
  sanitizeMember(member: Member): any {
    return {
      ...member,
      lastName: (member.lastName && member.lastName.trim()) || '.',
      fullName: member.fullName || (member.firstName + (member.lastName ? ' ' + member.lastName : '')),
    };
  },

  /**
   * Member Operations
   */
  async saveMember(member: Member): Promise<GasApiResponse> {
    return this.postAction('saveMember', this.sanitizeMember(member));
  },

  async deleteMember(memberId: string, hardDelete: boolean = false): Promise<GasApiResponse> {
    return this.postAction('deleteMember', { memberId, hardDelete });
  },

  /**
   * Event Operations
   */
  async saveEvent(event: AttendanceEvent): Promise<GasApiResponse> {
    return this.postAction('saveEvent', event);
  },

  async deleteEvent(eventId: string): Promise<GasApiResponse> {
    return this.postAction('deleteEvent', { eventId });
  },

  /**
   * Schedule Operations
   */
  async saveSchedule(schedule: EventSchedule): Promise<GasApiResponse> {
    return this.postAction('saveSchedule', schedule);
  },

  async deleteSchedule(scheduleId: string): Promise<GasApiResponse> {
    return this.postAction('deleteSchedule', { scheduleId });
  },

  /**
   * Batch Attendance Operations
   */
  async saveAttendanceBatch(records: AttendanceRecord[]): Promise<GasApiResponse> {
    return this.postAction('saveAttendanceBatch', records);
  },

  /**
   * Settings
   */
  async saveSettings(settings: SystemSettings): Promise<GasApiResponse> {
    return this.postAction('saveSettings', settings);
  },

  /**
   * Report Snapshot
   */
  async saveReportSnapshot(report: ReportSnapshot): Promise<GasApiResponse> {
    return this.postAction('saveReportSnapshot', report);
  },

  /**
   * Announcement Operations
   */
  async saveAnnouncement(announcement: Announcement): Promise<GasApiResponse> {
    return this.postAction('saveAnnouncement', announcement);
  },

  async deleteAnnouncement(announcementId: string): Promise<GasApiResponse> {
    return this.postAction('deleteAnnouncement', { announcementId });
  },

  /**
   * Landing Page Configuration
   */
  async saveLandingPageConfig(config: LandingPageConfig): Promise<GasApiResponse> {
    return this.postAction('saveLandingPageConfig', config);
  },

  /**
   * Auto initialize spreadsheet structure
   */
  async initializeSpreadsheet(): Promise<GasApiResponse> {
    return this.postAction('initSpreadsheet', {});
  },

  /**
   * Push Official MCGI Youth Membership Statistics & Demographics Summary
   */
  async pushOfficialSummary(summaryData: any): Promise<GasApiResponse> {
    return this.postAction('saveOfficialSummary', summaryData);
  },

  /**
   * Bulk Push all current application data into Google Sheets
   */
  async pushAllData(payload: {
    members: Member[];
    events: AttendanceEvent[];
    schedules: EventSchedule[];
    attendance: AttendanceRecord[];
    announcements: Announcement[];
    settings?: SystemSettings;
    officialSummary?: any;
  }): Promise<GasApiResponse> {
    const sanitizedPayload = {
      ...payload,
      members: payload.members.map((m) => this.sanitizeMember(m)),
    };
    return this.postAction('pushAllData', sanitizedPayload);
  }
};
