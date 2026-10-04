import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Member, MemberStatusHistory } from '../types/member';
import { AttendanceEvent, EventSchedule } from '../types/event';
import { AttendanceRecord } from '../types/attendance';
import { SystemSettings } from '../types/settings';
import { ActivityLog, ReportSnapshot } from '../types/reports';
import { Announcement } from '../types/announcement';
import { LandingPageConfig } from '../types/landingPage';
import { StorageService } from '../services/storageService';
import { GasApiService, GasApiResponse } from '../services/gasApi';
import { StatsService } from '../services/statsService';
import { AttendanceService } from '../services/attendanceService';
import { SupabaseDataService, SupabaseDataSnapshot } from '../services/supabaseDataService';
import { isSupabaseConfigured, isSupabaseRequired, supabase } from '../services/supabaseClient';
import { DEFAULT_LANDING_PAGE_CONFIG } from '../data/defaultLandingPage';
import { useAuth } from './AuthContext';

interface AppDataContextType {
  // State
  members: Member[];
  events: AttendanceEvent[];
  schedules: EventSchedule[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  landingPageConfig: LandingPageConfig;
  settings: SystemSettings;
  logs: ActivityLog[];
  statusHistory: MemberStatusHistory[];
  reports: ReportSnapshot[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTimestamp?: string;
  connectionStatus: 'Connected' | 'Disconnected' | 'Checking' | 'Error';
  connectionError?: string;

  // Actions
  refreshLocalData: () => void;
  syncFromGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  testConnection: (urlOverride?: string) => Promise<GasApiResponse>;
  initGoogleSheets: () => Promise<GasApiResponse>;
  pushAllToGoogleSheets: () => Promise<GasApiResponse>;

  // Members
  saveMember: (member: Member) => Promise<{ success: boolean; message: string }>;
  archiveMember: (memberId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  deleteMember: (memberId: string) => Promise<{ success: boolean; message: string }>;
  importMembers: (imported: Member[]) => Promise<{ imported: number; updated: number }>;

  // Events & Schedules
  saveEvent: (event: AttendanceEvent) => Promise<{ success: boolean; message: string }>;
  deleteEvent: (eventId: string) => Promise<{ success: boolean; message: string }>;
  saveSchedule: (schedule: EventSchedule) => Promise<{ success: boolean; message: string }>;
  deleteSchedule: (scheduleId: string) => Promise<{ success: boolean; message: string }>;

  // Announcements
  saveAnnouncement: (announcement: Announcement) => Promise<{ success: boolean; message: string }>;
  deleteAnnouncement: (announcementId: string) => Promise<{ success: boolean; message: string }>;

  // Landing Page Configuration
  saveLandingPageConfig: (config: LandingPageConfig) => Promise<{ success: boolean; message: string }>;

  // Attendance & Member Check-in
  recordAttendanceBatch: (records: AttendanceRecord[]) => Promise<{ success: boolean; message: string }>;
  checkMemberAttendance: (memberId: string, scheduleId: string) => AttendanceRecord | undefined;
  recordMemberAttendance: (params: {
    memberId: string;
    eventId: string;
    scheduleId: string;
    scheduleLabel: string;
    eventName: string;
    eventDate: string;
    recordedBy?: string;
  }) => Promise<{ success: boolean; message: string; duplicate?: boolean; record?: AttendanceRecord }>;

  // Settings & Reports
  saveSettings: (settings: SystemSettings) => Promise<{ success: boolean; message: string }>;
  saveReportSnapshot: (snapshot: ReportSnapshot) => Promise<{ success: boolean; message: string }>;

  // Backup & Restore
  exportBackup: () => string;
  restoreBackup: (json: string) => boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const operatorName = user?.fullName || 'Youth Officer';

  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [landingPageConfig, setLandingPageConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_PAGE_CONFIG);
  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSettings());
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [statusHistory, setStatusHistory] = useState<MemberStatusHistory[]>([]);
  const [reports, setReports] = useState<ReportSnapshot[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocalDataReady, setIsLocalDataReady] = useState(false);
  const [isSupabaseDataReady, setIsSupabaseDataReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'Connected' | 'Disconnected' | 'Checking' | 'Error'>('Disconnected');
  const [connectionError, setConnectionError] = useState<string | undefined>();
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | undefined>(settings.googleSheets.lastSyncTimestamp);
  const previousSupabaseUserIdRef = useRef(user?.id ?? null);

  const persistSupabase = async (operation: () => Promise<void>): Promise<string | null> => {
    if (!supabase || !user || !isSupabaseDataReady) return null;
    try {
      await operation();
      await SupabaseDataService.saveLogs(StorageService.getLogs());
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Supabase write failed.';
      setConnectionStatus('Error');
      setConnectionError(message);
      console.error('Supabase write failed:', error);
      return message;
    }
  };

  const getPersistenceMessage = (response: GasApiResponse, fallback: string): string => {
    if (!isSupabaseConfigured) return response.message || fallback;
    if (response.success) return `${fallback} Supabase and Google Sheets are updated.`;
    return `${fallback} Saved to Supabase. Google Sheets was not updated: ${response.message || 'not configured.'}`;
  };

  // Load local data on mount
  const refreshLocalData = useCallback(() => {
    const includePrivateLocalData = !isSupabaseRequired || Boolean(user);
    const loadedMembers = includePrivateLocalData ? StorageService.getMembers() : [];
    const loadedEvents = StorageService.getEvents();
    const loadedSchedules = StorageService.getSchedules();
    const loadedAttendance = includePrivateLocalData ? StorageService.getAttendance() : [];
    const loadedAnnouncements = StorageService.getAnnouncements();
    const loadedLandingPage = StorageService.getLandingPageConfig();
    const loadedSettings = StorageService.getSettings();
    const loadedLogs = includePrivateLocalData ? StorageService.getLogs() : [];
    const loadedHistory = includePrivateLocalData ? StorageService.getStatusHistory() : [];
    const loadedReports = includePrivateLocalData ? StorageService.getReports() : [];

    setMembers(loadedMembers);
    setEvents(loadedEvents);
    setSchedules(loadedSchedules);
    setAttendance(loadedAttendance);
    setAnnouncements(loadedAnnouncements);
    setLandingPageConfig(loadedLandingPage);
    setSettings(loadedSettings);
    setLogs(loadedLogs);
    setStatusHistory(loadedHistory);
    setReports(loadedReports);
    setLastSyncTimestamp(loadedSettings.googleSheets.lastSyncTimestamp);
    setIsLoading(false);
    setIsLocalDataReady(true);
  }, [user?.id]);

  useEffect(() => {
    refreshLocalData();
  }, [refreshLocalData]);

  useEffect(() => {
    const previousUserId = previousSupabaseUserIdRef.current;
    if (isSupabaseRequired && previousUserId && !user) {
      StorageService.saveMembers([]);
      StorageService.saveAttendance([]);
      StorageService.saveLogs([]);
      StorageService.saveStatusHistory([]);
      StorageService.saveReports([]);
      localStorage.removeItem('mcgi_portal_member');
      setMembers([]);
      setAttendance([]);
      setLogs([]);
      setStatusHistory([]);
      setReports([]);
    }
    previousSupabaseUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    void SupabaseDataService.loadPublic()
      .then((remote) => {
        if (!active) return;
        if (remote.announcements.length) {
          StorageService.saveAnnouncements(remote.announcements);
          setAnnouncements(remote.announcements);
        }
        if (remote.events.length) {
          StorageService.saveEvents(remote.events);
          setEvents(remote.events);
        }
        if (remote.schedules.length) {
          StorageService.saveSchedules(remote.schedules);
          setSchedules(remote.schedules);
        }
        if (remote.landingPage) {
          StorageService.saveLandingPageConfig(remote.landingPage);
          setLandingPageConfig(remote.landingPage);
        }
      })
      .catch((error: unknown) => console.warn('Could not load public Supabase data:', error));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase || !user || !isLocalDataReady) {
      setIsSupabaseDataReady(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    const loadStaffData = async () => {
      try {
        if (user.role === 'ADMIN' && await SupabaseDataService.isEmpty()) {
          let localSnapshot: SupabaseDataSnapshot = {
            members: StorageService.getMembers(),
            events: StorageService.getEvents(),
            schedules: StorageService.getSchedules(),
            attendance: StorageService.getAttendance(),
            announcements: StorageService.getAnnouncements(),
            landingPage: StorageService.getLandingPageConfig(),
            settings: StorageService.getSettings(),
            logs: StorageService.getLogs(),
            statusHistory: StorageService.getStatusHistory(),
            reports: StorageService.getReports(),
          };

          if (!localSnapshot.members.length && GasApiService.isConfigured()) {
            const legacyData = await GasApiService.pullAllDataForInitialMigration();
            if (!legacyData.success || !legacyData.data) {
              throw new Error(legacyData.message || 'Could not securely import the existing Google Sheets roster.');
            }
            localSnapshot = {
              ...localSnapshot,
              members: (legacyData.data.members || []).map((member: any) => ({
                ...member,
                memberId: member.memberId || member.memberID || member.id || '',
                committees: Array.isArray(member.committees)
                  ? member.committees
                  : member.committees
                  ? String(member.committees).split(',').map((committee: string) => committee.trim()).filter(Boolean)
                  : [],
              })),
              events: (legacyData.data.events || []).map((event: any) => ({
                ...event,
                eventId: event.eventId || event.eventID || event.id || '',
              })),
              schedules: (legacyData.data.schedules || []).map((schedule: any) => ({
                ...schedule,
                scheduleId: schedule.scheduleId || schedule.scheduleID || schedule.id || '',
                eventId: schedule.eventId || schedule.eventID || '',
              })),
              attendance: (legacyData.data.attendance || []).map((record: any) => ({
                ...record,
                attendanceId: record.attendanceId || record.attendanceID || record.id || '',
                memberId: record.memberId || record.memberID || '',
                eventId: record.eventId || record.eventID || '',
                scheduleId: record.scheduleId || record.scheduleID || '',
              })),
              logs: legacyData.data.activityLogs || localSnapshot.logs,
              statusHistory: legacyData.data.statusHistory || localSnapshot.statusHistory,
              reports: legacyData.data.reports || localSnapshot.reports,
            };
          }

          if (localSnapshot.members.length) {
            await SupabaseDataService.seed(localSnapshot);
          } else {
            console.warn('Supabase is empty and no member roster was found. Import real members before seeding application data.');
          }
        }

        const remote = await SupabaseDataService.loadStaff();
        if (!active) return;

        StorageService.saveMembers(remote.members);
        StorageService.saveEvents(remote.events);
        StorageService.saveSchedules(remote.schedules);
        StorageService.saveAttendance(remote.attendance);
        StorageService.saveAnnouncements(remote.announcements);
        StorageService.saveLogs(remote.logs);
        StorageService.saveStatusHistory(remote.statusHistory);
        StorageService.saveReports(remote.reports);
        if (remote.landingPage) StorageService.saveLandingPageConfig(remote.landingPage);
        if (remote.settings) StorageService.saveSettings(remote.settings);

        setMembers(remote.members);
        setEvents(remote.events);
        setSchedules(remote.schedules);
        setAttendance(remote.attendance);
        setAnnouncements(remote.announcements);
        setLogs(remote.logs);
        setStatusHistory(remote.statusHistory);
        setReports(remote.reports);
        if (remote.landingPage) setLandingPageConfig(remote.landingPage);
        if (remote.settings) setSettings(remote.settings);
        setIsSupabaseDataReady(true);
        setConnectionStatus('Connected');
        setConnectionError(undefined);
      } catch (error) {
        console.error('Could not load Supabase data:', error);
        setConnectionStatus('Error');
        setConnectionError(error instanceof Error ? error.message : 'Could not load Supabase data.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadStaffData();
    return () => {
      active = false;
    };
  }, [user?.id, isLocalDataReady]);

  // Initial connection check & auto-sync from Google Sheets on mount / URL change
  useEffect(() => {
    if (GasApiService.isConfigured() && !isSupabaseRequired) {
      setConnectionStatus('Checking');
      GasApiService.testConnection().then((res) => {
        if (res.success) {
          setConnectionStatus('Connected');
          setConnectionError(undefined);
          // Two-way sync: fetch latest data from Google Sheet on startup
          syncFromGoogleSheets();
        } else {
          setConnectionStatus('Error');
          setConnectionError(res.message);
        }
      });
    } else {
      setConnectionStatus('Disconnected');
    }
  }, [settings.googleSheets.appsScriptUrl]);

  // Window focus listener: auto-fetch changes when user returns to web app after editing Google Sheets
  useEffect(() => {
    const handleFocus = () => {
      if (GasApiService.isConfigured() && !isSupabaseRequired && !isSyncing) {
        syncFromGoogleSheets();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isSyncing]);

  /**
   * Test Connection to GAS Web App
   */
  const testConnection = async (urlOverride?: string): Promise<GasApiResponse> => {
    setConnectionStatus('Checking');
    const res = await GasApiService.testConnection(urlOverride);
    if (res.success) {
      setConnectionStatus('Connected');
      setConnectionError(undefined);
    } else {
      setConnectionStatus('Error');
      setConnectionError(res.message);
    }
    return res;
  };

  /**
   * Sync All Data from Google Sheets
   */
  const syncFromGoogleSheets = async (): Promise<{ success: boolean; message: string }> => {
    if (isSupabaseRequired) {
      return { success: false, message: 'Supabase is the source of truth. Google Sheets pulls are disabled to prevent overwriting newer data.' };
    }
    if (!GasApiService.isConfigured()) {
      return { success: false, message: 'Google Apps Script Web App URL is not configured in Settings.' };
    }

    setIsSyncing(true);
    try {
      const res = await GasApiService.pullAllData();
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to pull Google Sheets data.');
      }

      const { data } = res;
      if (data.members && data.members.length > 0) {
        const cleanedMembers = data.members.map((m: any) => ({
          ...m,
          memberId: m.memberId || m.memberID || m.id || '',
          age: Number(m.age) || 0,
          attendanceCount: Number(m.attendanceCount) || 0,
          attendancePercentage: Number(m.attendancePercentage) || 0,
          registeredVoter: m.registeredVoter === true || m.registeredVoter === 'TRUE',
          workingStudent: m.workingStudent === true || m.workingStudent === 'TRUE',
          outOfSchoolYouth: m.outOfSchoolYouth === true || m.outOfSchoolYouth === 'TRUE',
          committees: Array.isArray(m.committees)
            ? m.committees
            : m.committees
            ? String(m.committees).split(',').map((c: string) => c.trim()).filter(Boolean)
            : [],
        }));
        StorageService.saveMembers(cleanedMembers);
        setMembers(cleanedMembers);
      }
      if (data.events && data.events.length > 0) {
        const cleanedEvents = data.events.map((e: any) => ({
          ...e,
          eventId: e.eventId || e.eventID || e.id || '',
        }));
        StorageService.saveEvents(cleanedEvents);
        setEvents(cleanedEvents);
      }
      if (data.schedules && data.schedules.length > 0) {
        const cleanedSchedules = data.schedules.map((s: any) => ({
          ...s,
          scheduleId: s.scheduleId || s.scheduleID || s.id || '',
          eventId: s.eventId || s.eventID || '',
        }));
        StorageService.saveSchedules(cleanedSchedules);
        setSchedules(cleanedSchedules);
      }
      if (data.attendance && data.attendance.length > 0) {
        const cleanedAttendance = data.attendance.map((a: any) => ({
          ...a,
          attendanceId: a.attendanceId || a.attendanceID || a.id || '',
          memberId: a.memberId || a.memberID || '',
          scheduleId: a.scheduleId || a.scheduleID || '',
          eventId: a.eventId || a.eventID || '',
        }));
        StorageService.saveAttendance(cleanedAttendance);
        setAttendance(cleanedAttendance);
      }

      const syncTime = new Date().toISOString();
      setLastSyncTimestamp(syncTime);

      const updatedSettings = {
        ...settings,
        googleSheets: {
          ...settings.googleSheets,
          lastSyncTimestamp: syncTime,
          connectionStatus: 'Connected' as const,
        },
      };
      StorageService.saveSettings(updatedSettings);
      setSettings(updatedSettings);

      StorageService.addLog(operatorName, 'SYNC', 'SETTINGS', 'Synced all data with Google Sheets database.');
      setLogs(StorageService.getLogs());

      return { success: true, message: 'Successfully synchronized with Google Sheets.' };
    } catch (err: any) {
      setConnectionStatus('Error');
      setConnectionError(err.message);
      return { success: false, message: err.message || 'Error synchronizing with Google Sheets.' };
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Initialize Spreadsheet Worksheets and Formatting
   */
  const initGoogleSheets = async (): Promise<GasApiResponse> => {
    return GasApiService.initializeSpreadsheet();
  };

  /**
   * Push All Web App Data to Google Sheets (Members, Events, Schedules, Attendance, Announcements, Summary)
   */
  const pushAllToGoogleSheets = async (): Promise<GasApiResponse> => {
    if (!GasApiService.isConfigured()) {
      return { success: false, message: 'Google Apps Script Web App URL is not configured or does not end in /exec.' };
    }

    setIsSyncing(true);
    try {
      const summaryData = StatsService.generateOfficialSummaryData(members);
      const res = await GasApiService.pushAllData({
        members,
        events,
        schedules,
        attendance,
        announcements,
        settings,
        officialSummary: summaryData,
      });

      if (res.success) {
        setConnectionStatus('Connected');
        setConnectionError(undefined);
        const syncTime = new Date().toISOString();
        setLastSyncTimestamp(syncTime);
        return res;
      }

      // If the deployed Apps Script is an earlier version lacking pushAllData, fallback to individual actions
      if (res.message && (res.message.includes('pushAllData') || res.message.includes('Unknown POST action'))) {
        // 1. Initialize worksheets & headers
        await GasApiService.initializeSpreadsheet();

        // 2. Format & populate Official Summary
        await GasApiService.pushOfficialSummary(summaryData);

        // 3. Batch save attendance
        if (attendance && attendance.length > 0) {
          await GasApiService.saveAttendanceBatch(attendance);
        }

        // 4. Save events & schedules
        for (const evt of events) {
          await GasApiService.saveEvent(evt);
        }
        for (const sch of schedules) {
          await GasApiService.saveSchedule(sch);
        }

        // 5. Save all members
        for (const mem of members) {
          await GasApiService.postAction('saveMember', mem);
        }

        // 6. Save announcements
        for (const ann of announcements) {
          await GasApiService.saveAnnouncement(ann);
        }

        const syncTime = new Date().toISOString();
        setLastSyncTimestamp(syncTime);
        setConnectionStatus('Connected');
        setConnectionError(undefined);

        return {
          success: true,
          message: `Successfully uploaded ${members.length} members, ${attendance.length} attendance records, and Official Summary table to Google Sheets via multi-stage push!`,
        };
      }

      return res;
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to push data to Google Sheets.' };
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Save or Update Member
   */
  const saveMember = async (memberData: Member): Promise<{ success: boolean; message: string }> => {
    const existingIdx = members.findIndex((m) => m.memberId === memberData.memberId);
    let updatedList: Member[];
    const now = new Date().toISOString();

    const memberToSave: Member = {
      ...memberData,
      updatedAt: now,
      createdAt: memberData.createdAt || now,
    };

    if (existingIdx >= 0) {
      const oldStatus = members[existingIdx].membershipStatus;
      if (oldStatus !== memberToSave.membershipStatus) {
        StorageService.addStatusHistory(
          memberToSave.memberId,
          oldStatus,
          memberToSave.membershipStatus,
          memberToSave.notes || 'Status changed in app',
          operatorName
        );
        setStatusHistory(StorageService.getStatusHistory());
      }
      updatedList = [...members];
      updatedList[existingIdx] = memberToSave;
    } else {
      StorageService.addStatusHistory(
        memberToSave.memberId,
        'Active',
        memberToSave.membershipStatus,
        'Initial registration',
        operatorName
      );
      setStatusHistory(StorageService.getStatusHistory());
      updatedList = [memberToSave, ...members];
    }

    StorageService.saveMembers(updatedList);
    setMembers(updatedList);

    StorageService.addLog(
      operatorName,
      existingIdx >= 0 ? 'UPDATE' : 'CREATE',
      'MEMBERS',
      `${existingIdx >= 0 ? 'Updated' : 'Registered'} member ${memberToSave.fullName} (${memberToSave.memberId})`,
      memberToSave.memberId
    );
    setLogs(StorageService.getLogs());

    // Send to Google Sheets (or queue if offline)
    const apiRes = await GasApiService.saveMember(memberToSave);
    const dbError = await persistSupabase(async () => {
      await SupabaseDataService.saveMembers([memberToSave]);
      await SupabaseDataService.saveStatusHistory(StorageService.getStatusHistory());
    });
    if (dbError) return { success: false, message: `Saved locally, but Supabase sync failed: ${dbError}` };
    return { success: true, message: getPersistenceMessage(apiRes, 'Member saved successfully.') };
  };

  /**
   * Archive Member (Change status to Inactive without destroying attendance history)
   */
  const archiveMember = async (memberId: string, reason: string = 'Archived by administrator'): Promise<{ success: boolean; message: string }> => {
    const member = members.find((m) => m.memberId === memberId);
    if (!member) return { success: false, message: 'Member not found.' };

    const oldStatus = member.membershipStatus;
    const updatedMember: Member = {
      ...member,
      membershipStatus: 'Inactive',
      activityStatus: 'Inactive',
      activityReason: reason,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = members.map((m) => (m.memberId === memberId ? updatedMember : m));
    StorageService.saveMembers(updatedList);
    setMembers(updatedList);

    StorageService.addStatusHistory(memberId, oldStatus, 'Inactive', reason, operatorName);
    setStatusHistory(StorageService.getStatusHistory());

    StorageService.addLog(
      operatorName,
      'UPDATE',
      'MEMBERS',
      `Archived member ${member.fullName} (${memberId}). Attendance history preserved.`,
      memberId
    );
    setLogs(StorageService.getLogs());

    const apiRes = await GasApiService.deleteMember(memberId, false); // Safe archive
    const dbError = await persistSupabase(async () => {
      await SupabaseDataService.saveMembers([updatedMember]);
      await SupabaseDataService.saveStatusHistory(StorageService.getStatusHistory());
    });
    if (dbError) return { success: false, message: `Archived locally, but Supabase sync failed: ${dbError}` };
    return { success: true, message: getPersistenceMessage(apiRes, 'Member archived as Inactive.') };
  };

  /**
   * Delete Member Permanently (Admin only)
   */
  const deleteMember = async (memberId: string): Promise<{ success: boolean; message: string }> => {
    const target = members.find((m) => m.memberId === memberId);
    if (!target) return { success: false, message: 'Member not found.' };

    const updatedList = members.filter((m) => m.memberId !== memberId);
    StorageService.saveMembers(updatedList);
    setMembers(updatedList);

    StorageService.addLog(
      operatorName,
      'DELETE',
      'MEMBERS',
      `Permanently deleted member ${target.fullName} (${memberId})`,
      memberId
    );
    setLogs(StorageService.getLogs());

    const apiRes = await GasApiService.deleteMember(memberId, true);
    const dbError = await persistSupabase(() => SupabaseDataService.deleteMember(memberId));
    if (dbError) return { success: false, message: `Deleted locally, but Supabase sync failed: ${dbError}` };
    return { success: true, message: getPersistenceMessage(apiRes, 'Member deleted.') };
  };

  /**
   * Import Members with Duplicate Prevention and Column Mapping
   */
  const importMembers = async (importedList: Member[]): Promise<{ imported: number; updated: number }> => {
    const currentList = [...members];
    const map = new Map<string, number>();
    currentList.forEach((m, idx) => map.set(m.memberId, idx));

    let importedCount = 0;
    let updatedCount = 0;

    importedList.forEach((imported) => {
      if (map.has(imported.memberId)) {
        const idx = map.get(imported.memberId)!;
        currentList[idx] = { ...currentList[idx], ...imported, updatedAt: new Date().toISOString() };
        updatedCount++;
      } else {
        currentList.push({
          ...imported,
          createdAt: imported.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        importedCount++;
      }
    });

    StorageService.saveMembers(currentList);
    setMembers(currentList);

    // Sync imported to Google Sheets in batches
    for (const mem of importedList) {
      GasApiService.saveMember(mem);
    }
    await persistSupabase(() => SupabaseDataService.saveMembers(currentList));

    StorageService.addLog(
      operatorName,
      'CREATE',
      'MEMBERS',
      `Imported ${importedCount} new member(s) and updated ${updatedCount} existing member(s).`
    );
    setLogs(StorageService.getLogs());

    return { imported: importedCount, updated: updatedCount };
  };

  /**
   * Save Event
   */
  const saveEvent = async (event: AttendanceEvent): Promise<{ success: boolean; message: string }> => {
    const existingIdx = events.findIndex((e) => e.eventId === event.eventId);
    let updatedList: AttendanceEvent[];
    const now = new Date().toISOString();

    const toSave: AttendanceEvent = {
      ...event,
      updatedAt: now,
      createdAt: event.createdAt || now,
    };

    if (existingIdx >= 0) {
      updatedList = [...events];
      updatedList[existingIdx] = toSave;
    } else {
      updatedList = [toSave, ...events];
    }

    StorageService.saveEvents(updatedList);
    setEvents(updatedList);

    StorageService.addLog(
      operatorName,
      existingIdx >= 0 ? 'UPDATE' : 'CREATE',
      'EVENTS',
      `${existingIdx >= 0 ? 'Updated' : 'Created'} event "${toSave.eventName}" (${toSave.eventType})`,
      toSave.eventId
    );
    setLogs(StorageService.getLogs());

    const apiRes = await GasApiService.saveEvent(toSave);
    const dbError = await persistSupabase(() => SupabaseDataService.saveEvents([toSave]));
    if (dbError) return { success: false, message: `Saved locally, but Supabase sync failed: ${dbError}` };
    return { success: true, message: getPersistenceMessage(apiRes, 'Event saved.') };
  };

  /**
   * Delete Event
   */
  const deleteEvent = async (eventId: string): Promise<{ success: boolean; message: string }> => {
    const ev = events.find((e) => e.eventId === eventId);
    const updatedList = events.filter((e) => e.eventId !== eventId);
    StorageService.saveEvents(updatedList);
    setEvents(updatedList);

    // Delete associated schedules
    const updatedSchedules = schedules.filter((s) => s.eventId !== eventId);
    StorageService.saveSchedules(updatedSchedules);
    setSchedules(updatedSchedules);

    StorageService.addLog(
      operatorName,
      'DELETE',
      'EVENTS',
      `Deleted event "${ev?.eventName || eventId}" and its schedules.`,
      eventId
    );
    setLogs(StorageService.getLogs());

    const apiRes = await GasApiService.deleteEvent(eventId);
    const dbError = await persistSupabase(() => SupabaseDataService.deleteEvent(eventId));
    if (dbError) return { success: false, message: `Deleted locally, but Supabase sync failed: ${dbError}` };
    return { success: true, message: getPersistenceMessage(apiRes, 'Event deleted.') };
  };

  /**
   * Save Schedule
   */
  const saveSchedule = async (schedule: EventSchedule): Promise<{ success: boolean; message: string }> => {
    const existingIdx = schedules.findIndex((s) => s.scheduleId === schedule.scheduleId);
    let updatedList: EventSchedule[];
    const now = new Date().toISOString();

    const toSave: EventSchedule = {
      ...schedule,
      updatedAt: now,
      createdAt: schedule.createdAt || now,
    };

    if (existingIdx >= 0) {
      updatedList = [...schedules];
      updatedList[existingIdx] = toSave;
    } else {
      updatedList = [...schedules, toSave];
    }

    StorageService.saveSchedules(updatedList);
    setSchedules(updatedList);

    StorageService.addLog(
      operatorName,
      existingIdx >= 0 ? 'UPDATE' : 'CREATE',
      'SCHEDULES',
      `${existingIdx >= 0 ? 'Updated' : 'Created'} schedule "${toSave.scheduleLabel}"`,
      toSave.scheduleId
    );
    setLogs(StorageService.getLogs());

    const apiRes = await GasApiService.saveSchedule(toSave);
    const dbError = await persistSupabase(() => SupabaseDataService.saveSchedules([toSave]));
    if (dbError) return { success: false, message: `Saved locally, but Supabase sync failed: ${dbError}` };
    return { success: true, message: getPersistenceMessage(apiRes, 'Schedule saved.') };
  };

  /**
   * Delete Schedule
   */
  const deleteSchedule = async (scheduleId: string): Promise<{ success: boolean; message: string }> => {
    const sched = schedules.find((s) => s.scheduleId === scheduleId);
    const updatedList = schedules.filter((s) => s.scheduleId !== scheduleId);
    StorageService.saveSchedules(updatedList);
    setSchedules(updatedList);

    StorageService.addLog(
      operatorName,
      'DELETE',
      'SCHEDULES',
      `Deleted schedule "${sched?.scheduleLabel || scheduleId}"`,
      scheduleId
    );
    setLogs(StorageService.getLogs());

    const apiRes = await GasApiService.deleteSchedule(scheduleId);
    const dbError = await persistSupabase(() => SupabaseDataService.deleteSchedule(scheduleId));
    if (dbError) return { success: false, message: `Deleted locally, but Supabase sync failed: ${dbError}` };
    return { success: true, message: getPersistenceMessage(apiRes, 'Schedule deleted.') };
  };

  /**
   * Fast Attendance Batch Recording
   */
  const recordAttendanceBatch = async (records: AttendanceRecord[]): Promise<{ success: boolean; message: string }> => {
    const res = await AttendanceService.saveBatch(records, members, settings.attendanceRules, operatorName);
    if (res.success) {
      setMembers(res.updatedMembers);
      setAttendance(res.allAttendance);
      setLogs(StorageService.getLogs());

      // Live sync to Google Sheets database
      GasApiService.saveAttendanceBatch(records);
      for (const m of res.updatedMembers) {
        GasApiService.saveMember(m);
      }
      const dbError = await persistSupabase(async () => {
        await SupabaseDataService.saveAttendance(records);
        await SupabaseDataService.saveMembers(res.updatedMembers);
      });
      if (dbError) return { success: false, message: `Saved locally, but Supabase sync failed: ${dbError}` };
    }
    return { success: res.success, message: res.message };
  };

  /**
   * Save System Settings
   */
  const saveSettings = async (newSettings: SystemSettings): Promise<{ success: boolean; message: string }> => {
    StorageService.saveSettings(newSettings);
    setSettings(newSettings);

    // Recalculate member activity statuses if rules were adjusted
    const recomputedMembers = members.map((m) =>
      AttendanceService.recalculateMemberAttendance(m, attendance, newSettings.attendanceRules)
    );
    StorageService.saveMembers(recomputedMembers);
    setMembers(recomputedMembers);

    StorageService.addLog(operatorName, 'UPDATE', 'SETTINGS', 'Updated system attendance rules and configurations.');
    setLogs(StorageService.getLogs());

    const apiRes = await GasApiService.saveSettings(newSettings);
    const dbError = await persistSupabase(async () => {
      await SupabaseDataService.saveAppSetting('system_settings', newSettings);
      await SupabaseDataService.saveMembers(recomputedMembers);
    });
    if (dbError) return { success: false, message: `Saved locally, but Supabase sync failed: ${dbError}` };
    return { success: true, message: getPersistenceMessage(apiRes, 'Settings saved.') };
  };

  /**
   * Save Report Snapshot
   */
  const saveReportSnapshot = async (snapshot: ReportSnapshot): Promise<{ success: boolean; message: string }> => {
    const existing = StorageService.getReports();
    const updated = [snapshot, ...existing];
    StorageService.saveReports(updated);
    setReports(updated);

    StorageService.addLog(operatorName, 'CREATE', 'REPORTS', `Saved report snapshot "${snapshot.title}" (${snapshot.periodLabel})`, snapshot.snapshotId);
    setLogs(StorageService.getLogs());

    const apiRes = await GasApiService.saveReportSnapshot(snapshot);
    const dbError = await persistSupabase(() => SupabaseDataService.saveReports([snapshot]));
    if (dbError) return { success: false, message: `Saved locally, but Supabase sync failed: ${dbError}` };
    return { success: true, message: getPersistenceMessage(apiRes, 'Report snapshot preserved in official records.') };
  };

  /**
   * Announcements
   */
  const saveAnnouncement = async (announcement: Announcement): Promise<{ success: boolean; message: string }> => {
    const existingIdx = announcements.findIndex((a) => a.announcementId === announcement.announcementId);
    let updatedList: Announcement[];
    const now = new Date().toISOString();

    const toSave: Announcement = {
      ...announcement,
      updatedAt: now,
      createdAt: announcement.createdAt || now,
    };

    if (existingIdx >= 0) {
      updatedList = [...announcements];
      updatedList[existingIdx] = toSave;
    } else {
      updatedList = [toSave, ...announcements];
    }

    StorageService.saveAnnouncements(updatedList);
    setAnnouncements(updatedList);

    StorageService.addLog(
      operatorName,
      existingIdx >= 0 ? 'UPDATE' : 'CREATE',
      'ANNOUNCEMENTS' as any,
      `${existingIdx >= 0 ? 'Updated' : 'Created'} announcement "${toSave.title}"`,
      toSave.announcementId
    );
    setLogs(StorageService.getLogs());

    const apiRes = await GasApiService.saveAnnouncement(toSave);
    const dbError = await persistSupabase(() => SupabaseDataService.saveAnnouncements([toSave]));
    if (dbError) return { success: false, message: `Saved locally, but Supabase sync failed: ${dbError}` };
    return { success: true, message: getPersistenceMessage(apiRes, 'Announcement saved successfully.') };
  };

  const deleteAnnouncement = async (announcementId: string): Promise<{ success: boolean; message: string }> => {
    const ann = announcements.find((a) => a.announcementId === announcementId);
    const updatedList = announcements.filter((a) => a.announcementId !== announcementId);
    StorageService.saveAnnouncements(updatedList);
    setAnnouncements(updatedList);

    StorageService.addLog(
      operatorName,
      'DELETE',
      'ANNOUNCEMENTS' as any,
      `Deleted announcement "${ann?.title || announcementId}"`,
      announcementId
    );
    setLogs(StorageService.getLogs());

    const apiRes = await GasApiService.deleteAnnouncement(announcementId);
    const dbError = await persistSupabase(() => SupabaseDataService.deleteAnnouncement(announcementId));
    if (dbError) return { success: false, message: `Deleted locally, but Supabase sync failed: ${dbError}` };
    return { success: true, message: getPersistenceMessage(apiRes, 'Announcement deleted.') };
  };

  /**
   * Landing Page Configuration
   */
  const saveLandingPageConfig = async (config: LandingPageConfig): Promise<{ success: boolean; message: string }> => {
    const toSave: LandingPageConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveLandingPageConfig(toSave);
    setLandingPageConfig(toSave);

    StorageService.addLog(operatorName, 'UPDATE', 'SETTINGS', 'Updated landing page configuration.');
    setLogs(StorageService.getLogs());

    const apiRes = await GasApiService.saveLandingPageConfig(toSave);
    const dbError = await persistSupabase(() => SupabaseDataService.saveAppSetting('landing_page_config', toSave));
    if (dbError) return { success: false, message: `Saved locally, but Supabase sync failed: ${dbError}` };
    return { success: true, message: getPersistenceMessage(apiRes, 'Landing page configuration saved.') };
  };

  /**
   * Check if a member has already attended a specific schedule
   */
  const checkMemberAttendance = useCallback((memberId: string, scheduleId: string): AttendanceRecord | undefined => {
    return attendance.find((a) => a.memberId === memberId && a.scheduleId === scheduleId);
  }, [attendance]);

  /**
   * Record Member Self Attendance (from landing page / member check-in)
   * With DUPLICATE PREVENTION enforced!
   */
  const recordMemberAttendance = async (params: {
    memberId: string;
    eventId: string;
    scheduleId: string;
    scheduleLabel: string;
    eventName: string;
    eventDate: string;
    recordedBy?: string;
  }): Promise<{ success: boolean; message: string; duplicate?: boolean; record?: AttendanceRecord }> => {
    const { memberId, eventId, scheduleId, scheduleLabel, eventName, eventDate, recordedBy } = params;

    const member = members.find((m) => m.memberId === memberId);
    if (!member) {
      return { success: false, message: 'Member profile not found. Please verify your Member ID.' };
    }

    // DUPLICATE CHECK: Has this member already checked in to this schedule?
    const existing = attendance.find((a) => a.memberId === memberId && a.scheduleId === scheduleId);
    if (existing) {
      return {
        success: false,
        duplicate: true,
        record: existing,
        message: `Your attendance for this schedule has already been recorded on ${new Date(existing.recordedAt).toLocaleDateString()}.`,
      };
    }

    const now = new Date().toISOString();
    const newRecord: AttendanceRecord = {
      attendanceId: 'ATT-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      eventId,
      scheduleId,
      memberId,
      memberName: member.fullName,
      eventName,
      eventDate,
      schedule: scheduleLabel,
      attendanceStatus: 'Present',
      recordedBy: recordedBy || `${member.fullName} (Self Check-in)`,
      recordedAt: now,
      updatedAt: now,
      notes: 'Recorded via Member Portal',
    };

    const res = await AttendanceService.saveBatch(
      [newRecord],
      members,
      settings.attendanceRules,
      recordedBy || `${member.fullName} (Self Check-in)`
    );

    if (res.success) {
      setMembers(res.updatedMembers);
      setAttendance(res.allAttendance);
      setLogs(StorageService.getLogs());

      // Live sync to Google Sheets
      GasApiService.saveAttendanceBatch([newRecord]);
      const updatedMem = res.updatedMembers.find((m) => m.memberId === memberId);
      if (updatedMem) {
        GasApiService.saveMember(updatedMem);
      }
      const dbError = await persistSupabase(async () => {
        await SupabaseDataService.saveAttendance([newRecord]);
        if (updatedMem) await SupabaseDataService.saveMembers([updatedMem]);
      });
      if (dbError) {
        return {
          success: false,
          message: `Attendance saved locally, but Supabase sync failed: ${dbError}`,
          record: newRecord,
        };
      }

      return {
        success: true,
        message: `Attendance confirmed! Thank you, ${member.firstName}.`,
        record: newRecord,
      };
    }

    return {
      success: false,
      message: res.message || 'Unable to record attendance at this time.',
    };
  };

  /**
   * Backup / Restore
   */
  const exportBackup = () => {
    return StorageService.exportBackupJson();
  };

  const restoreBackup = (json: string): boolean => {
    const success = StorageService.restoreBackupJson(json);
    if (success) {
      refreshLocalData();
      StorageService.addLog(operatorName, 'INITIALIZE', 'SETTINGS', 'Restored system database from backup JSON.');
      setLogs(StorageService.getLogs());
    }
    return success;
  };

  return (
    <AppDataContext.Provider
      value={{
        members,
        events,
        schedules,
        attendance,
        announcements,
        landingPageConfig,
        settings,
        logs,
        statusHistory,
        reports,
        isLoading,
        isSyncing,
        lastSyncTimestamp,
        connectionStatus,
        connectionError,
        refreshLocalData,
        syncFromGoogleSheets,
        testConnection,
        initGoogleSheets,
        pushAllToGoogleSheets,
        saveMember,
        archiveMember,
        deleteMember,
        importMembers,
        saveEvent,
        deleteEvent,
        saveSchedule,
        deleteSchedule,
        saveAnnouncement,
        deleteAnnouncement,
        saveLandingPageConfig,
        checkMemberAttendance,
        recordMemberAttendance,
        recordAttendanceBatch,
        saveSettings,
        saveReportSnapshot,
        exportBackup,
        restoreBackup,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within an AppDataProvider');
  return ctx;
};
