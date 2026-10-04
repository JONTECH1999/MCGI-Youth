import { supabase } from './supabaseClient';
import { Member, MemberStatusHistory } from '../types/member';
import { AttendanceEvent, EventSchedule } from '../types/event';
import { AttendanceRecord } from '../types/attendance';
import { Announcement } from '../types/announcement';
import { LandingPageConfig } from '../types/landingPage';
import { ActivityLog, ReportSnapshot } from '../types/reports';
import { SystemSettings } from '../types/settings';

export interface SupabaseDataSnapshot {
  members: Member[];
  events: AttendanceEvent[];
  schedules: EventSchedule[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  landingPage: LandingPageConfig | null;
  settings: SystemSettings | null;
  logs: ActivityLog[];
  statusHistory: MemberStatusHistory[];
  reports: ReportSnapshot[];
}

const requireClient = () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
};

const throwOnError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const readDataRows = <T,>(rows: Array<{ data: T }> | null): T[] => (rows || []).map((row) => row.data);

const migrateImageSource = async (imageSource?: string): Promise<string | undefined> => {
  if (!imageSource?.startsWith('data:image/') || !supabase) return imageSource;

  const imageBlob = await (await fetch(imageSource)).blob();
  const extension = imageBlob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const imagePath = `migrated/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('announcement-media')
    .upload(imagePath, imageBlob, { contentType: imageBlob.type, cacheControl: '31536000' });
  throwOnError(error);
  return supabase.storage.from('announcement-media').getPublicUrl(imagePath).data.publicUrl;
};

const migrateSnapshotImages = async (snapshot: SupabaseDataSnapshot): Promise<SupabaseDataSnapshot> => {
  const [events, announcements, landingPage] = await Promise.all([
    Promise.all(snapshot.events.map(async (event) => ({
      ...event,
      eventImage: await migrateImageSource(event.eventImage),
    }))),
    Promise.all(snapshot.announcements.map(async (announcement) => ({
      ...announcement,
      image: await migrateImageSource(announcement.image),
    }))),
    snapshot.landingPage
      ? Promise.all([
          migrateImageSource(snapshot.landingPage.heroImageUrl),
          Promise.all((snapshot.landingPage.heroImages || []).map((image) => migrateImageSource(image))),
          migrateImageSource(snapshot.landingPage.aboutImageUrl),
          migrateImageSource(snapshot.landingPage.processImageUrl),
          Promise.all((snapshot.landingPage.gatherings || []).map(async (gathering) => ({
            ...gathering,
            image: await migrateImageSource(gathering.image),
          }))),
          Promise.all(Object.entries(snapshot.landingPage.gatheringImages || {}).map(async ([key, image]) => [
            key,
            await migrateImageSource(image),
          ] as const)),
        ]).then(([heroImageUrl, heroImages, aboutImageUrl, processImageUrl, gatherings, gatheringImages]) => ({
          ...snapshot.landingPage!,
          heroImageUrl: heroImageUrl || '',
          heroImages,
          aboutImageUrl,
          processImageUrl,
          gatherings,
          gatheringImages: Object.fromEntries(gatheringImages),
        }))
      : Promise.resolve(null),
  ]);

  return { ...snapshot, events, announcements, landingPage };
};

export const SupabaseDataService = {
  async isEmpty(): Promise<boolean> {
    const client = requireClient();
    const tables = ['members', 'attendance_events', 'announcements'] as const;
    const counts = await Promise.all(
      tables.map((table) => client.from(table).select('*', { count: 'exact', head: true }))
    );
    counts.forEach(({ error }) => throwOnError(error));
    return counts.every(({ count }) => count === 0);
  },

  async loadPublic(): Promise<Pick<SupabaseDataSnapshot, 'events' | 'schedules' | 'announcements' | 'landingPage'>> {
    const client = requireClient();
    const [events, schedules, announcements, landingPage] = await Promise.all([
      client.from('attendance_events').select('data').eq('is_published', true),
      client
        .from('event_schedules')
        .select('data, attendance_events!inner(is_published)')
        .eq('status', 'Active')
        .eq('attendance_events.is_published', true),
      client.from('announcements').select('data').eq('status', 'Published'),
      client.from('app_settings').select('value').eq('setting_key', 'landing_page_config').maybeSingle(),
    ]);

    throwOnError(events.error);
    throwOnError(schedules.error);
    throwOnError(announcements.error);
    throwOnError(landingPage.error);

    return {
      events: readDataRows<AttendanceEvent>(events.data),
      schedules: readDataRows<EventSchedule>(schedules.data),
      announcements: readDataRows<Announcement>(announcements.data),
      landingPage: landingPage.data?.value as LandingPageConfig | null,
    };
  },

  async loadStaff(): Promise<SupabaseDataSnapshot> {
    const client = requireClient();
    const [members, events, schedules, attendance, announcements, landingPage, settings, logs, statusHistory, reports] = await Promise.all([
      client.from('members').select('data'),
      client.from('attendance_events').select('data'),
      client.from('event_schedules').select('data'),
      client.from('attendance_records').select('data'),
      client.from('announcements').select('data'),
      client.from('app_settings').select('value').eq('setting_key', 'landing_page_config').maybeSingle(),
      client.from('app_settings').select('value').eq('setting_key', 'system_settings').maybeSingle(),
      client.from('activity_logs').select('data').order('occurred_at', { ascending: false }),
      client.from('member_status_history').select('data').order('changed_at', { ascending: false }),
      client.from('report_snapshots').select('data').order('created_at', { ascending: false }),
    ]);

    [members, events, schedules, attendance, announcements, landingPage, settings, logs, statusHistory, reports]
      .forEach(({ error }) => throwOnError(error));

    return {
      members: readDataRows<Member>(members.data),
      events: readDataRows<AttendanceEvent>(events.data),
      schedules: readDataRows<EventSchedule>(schedules.data),
      attendance: readDataRows<AttendanceRecord>(attendance.data),
      announcements: readDataRows<Announcement>(announcements.data),
      landingPage: landingPage.data?.value as LandingPageConfig | null,
      settings: settings.data?.value as SystemSettings | null,
      logs: readDataRows<ActivityLog>(logs.data),
      statusHistory: readDataRows<MemberStatusHistory>(statusHistory.data),
      reports: readDataRows<ReportSnapshot>(reports.data),
    };
  },

  async seed(snapshot: SupabaseDataSnapshot): Promise<void> {
    const migratedSnapshot = await migrateSnapshotImages(snapshot);
    await this.saveMembers(migratedSnapshot.members);
    await this.saveEvents(migratedSnapshot.events);
    await this.saveSchedules(migratedSnapshot.schedules);
    await this.saveAttendance(migratedSnapshot.attendance);
    await this.saveAnnouncements(migratedSnapshot.announcements);
    if (migratedSnapshot.landingPage) await this.saveAppSetting('landing_page_config', migratedSnapshot.landingPage);
    if (migratedSnapshot.settings) await this.saveAppSetting('system_settings', migratedSnapshot.settings);
    await this.saveLogs(migratedSnapshot.logs);
    await this.saveStatusHistory(migratedSnapshot.statusHistory);
    await this.saveReports(migratedSnapshot.reports);
  },

  async saveMembers(records: Member[]): Promise<void> {
    if (!records.length) return;
    const { error } = await requireClient().from('members').upsert(records.map((record) => ({
      member_id: record.memberId,
      full_name: record.fullName,
      membership_status: record.membershipStatus,
      member_category: record.memberCategory,
      data: record,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    })));
    throwOnError(error);
  },

  async saveEvents(records: AttendanceEvent[]): Promise<void> {
    if (!records.length) return;
    const { error } = await requireClient().from('attendance_events').upsert(records.map((record) => ({
      event_id: record.eventId,
      event_name: record.eventName,
      event_type: record.eventType,
      start_date: record.startDate,
      end_date: record.endDate,
      is_published: record.isPublished !== false,
      data: record,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    })));
    throwOnError(error);
  },

  async saveSchedules(records: EventSchedule[]): Promise<void> {
    if (!records.length) return;
    const { error } = await requireClient().from('event_schedules').upsert(records.map((record) => ({
      schedule_id: record.scheduleId,
      event_id: record.eventId,
      scheduled_date: record.date,
      status: record.status,
      data: record,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    })));
    throwOnError(error);
  },

  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    if (!records.length) return;
    const { error } = await requireClient().from('attendance_records').upsert(records.map((record) => ({
      attendance_id: record.attendanceId,
      member_id: record.memberId,
      event_id: record.eventId,
      schedule_id: record.scheduleId,
      attendance_status: record.attendanceStatus,
      event_date: record.eventDate,
      recorded_at: record.recordedAt,
      data: record,
      created_at: record.recordedAt,
      updated_at: record.updatedAt,
    })), { onConflict: 'member_id,schedule_id' });
    throwOnError(error);
  },

  async saveAnnouncements(records: Announcement[]): Promise<void> {
    if (!records.length) return;
    const { error } = await requireClient().from('announcements').upsert(records.map((record) => ({
      announcement_id: record.announcementId,
      title: record.title,
      status: record.status,
      publish_date: record.publishDate,
      event_date: record.eventDate || null,
      data: record,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    })));
    throwOnError(error);
  },

  async saveAppSetting(settingKey: string, value: unknown): Promise<void> {
    const { error } = await requireClient().from('app_settings').upsert({
      setting_key: settingKey,
      value,
      updated_at: new Date().toISOString(),
    });
    throwOnError(error);
  },

  async saveLogs(records: ActivityLog[]): Promise<void> {
    if (!records.length) return;
    const { error } = await requireClient().from('activity_logs').upsert(records.map((record) => ({
      log_id: record.logId,
      occurred_at: record.timestamp,
      data: record,
    })));
    throwOnError(error);
  },

  async saveStatusHistory(records: MemberStatusHistory[]): Promise<void> {
    if (!records.length) return;
    const { error } = await requireClient().from('member_status_history').upsert(records.map((record) => ({
      history_id: record.historyId,
      member_id: record.memberId,
      changed_at: record.changedAt,
      data: record,
    })));
    throwOnError(error);
  },

  async saveReports(records: ReportSnapshot[]): Promise<void> {
    if (!records.length) return;
    const { error } = await requireClient().from('report_snapshots').upsert(records.map((record) => ({
      snapshot_id: record.snapshotId,
      created_at: record.createdAt,
      data: record,
    })));
    throwOnError(error);
  },

  async deleteMember(memberId: string): Promise<void> {
    const { error } = await requireClient().from('members').delete().eq('member_id', memberId);
    throwOnError(error);
  },

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await requireClient().from('attendance_events').delete().eq('event_id', eventId);
    throwOnError(error);
  },

  async deleteSchedule(scheduleId: string): Promise<void> {
    const { error } = await requireClient().from('event_schedules').delete().eq('schedule_id', scheduleId);
    throwOnError(error);
  },

  async deleteAnnouncement(announcementId: string): Promise<void> {
    const { error } = await requireClient().from('announcements').delete().eq('announcement_id', announcementId);
    throwOnError(error);
  },
};