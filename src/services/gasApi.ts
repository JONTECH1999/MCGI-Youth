import { StorageService } from './storageService';
import { Member } from '../types/member';
import { AttendanceEvent, EventSchedule } from '../types/event';
import { AttendanceRecord } from '../types/attendance';
import { SystemSettings } from '../types/settings';
import { ReportSnapshot } from '../types/reports';
import { Announcement } from '../types/announcement';
import { LandingPageConfig } from '../types/landingPage';

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
   * Ping / Test Connection
   */
  async testConnection(urlOverride?: string): Promise<GasApiResponse> {
    const url = urlOverride || this.getApiUrl();
    if (!url) {
      return {
        success: false,
        message: 'No Google Apps Script Web App URL provided.',
      };
    }

    try {
      const pingUrl = `${url}${url.includes('?') ? '&' : '?'}action=ping`;
      const response = await fetch(pingUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      return json;
    } catch (err: any) {
      console.warn('Google Apps Script connection test error:', err);
      return {
        success: false,
        message: err.message || 'Failed to connect to Google Apps Script Web App.',
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
    const url = this.getApiUrl();
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Google Apps Script URL is not configured.',
      };
    }

    try {
      const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=getAllData`;
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

  /**
   * Generic POST caller to Google Apps Script
   */
  async postAction<T = any>(action: string, data: any): Promise<GasApiResponse<T>> {
    const url = this.getApiUrl();

    // If not configured, seamlessly queue in storage service
    if (!this.isConfigured()) {
      StorageService.addToSyncQueue(action, data);
      return {
        success: true,
        message: 'Saved to local system (Google Sheets URL not configured yet; action queued).',
      };
    }

    try {
      // Use text/plain to avoid CORS preflight issues with Google Apps Script web apps
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, data }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: GasApiResponse<T> = await response.json();
      return json;
    } catch (err: any) {
      console.warn(`GAS POST failed for action ${action}, queuing for offline sync:`, err);
      StorageService.addToSyncQueue(action, data);
      return {
        success: true, // Gracefully processed locally
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
   * Member Operations
   */
  async saveMember(member: Member): Promise<GasApiResponse> {
    return this.postAction('saveMember', member);
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
  }
};
