import { AttendanceEvent, EventSchedule, EventType } from '../types/event';

export interface RegularGatheringSlot {
  slotId: string;
  eventType: EventType;
  eventName: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  dayName: 'Mon' | 'Wed' | 'Thurs' | 'Sat' | 'Sun' | string;
  dayFullName: 'Monday' | 'Wednesday' | 'Thursday' | 'Saturday' | 'Sunday' | string;
  time: string;
  time24: string; // HH:mm
  mproIncharge: string;
  officersAssigned: string;
  hasZoom: boolean;
  notes?: string;
  dateStr?: string;
  sourceScheduleId?: string;
  sourceEventId?: string;
}

export const LOKAL_REGULAR_SCHEDULES: RegularGatheringSlot[] = [
  // --- Prayer Meeting ---
  {
    slotId: 'PM-WED-0330',
    eventType: 'Prayer Meeting',
    eventName: 'Congregational Prayer Meeting',
    dayOfWeek: 3,
    dayName: 'Wed',
    dayFullName: 'Wednesday',
    time: '3:30 am',
    time24: '03:30',
    mproIncharge: 'S. Joy Ann / S. Eunice (w/ zoom)',
    officersAssigned: 'B. Francis / B. Henry / S. Julianne',
    hasZoom: true,
  },
  {
    slotId: 'PM-WED-0700',
    eventType: 'Prayer Meeting',
    eventName: 'Congregational Prayer Meeting',
    dayOfWeek: 3,
    dayName: 'Wed',
    dayFullName: 'Wednesday',
    time: '7:00 am',
    time24: '07:00',
    mproIncharge: 'B. Mark MJ / B. Riyadh (w/ zoom)',
    officersAssigned: 'B. Chito / S. Luz Igay',
    hasZoom: true,
  },
  {
    slotId: 'PM-WED-1730',
    eventType: 'Prayer Meeting',
    eventName: 'Congregational Prayer Meeting',
    dayOfWeek: 3,
    dayName: 'Wed',
    dayFullName: 'Wednesday',
    time: '5:30 pm',
    time24: '17:30',
    mproIncharge: 'S. Eunice / S. Florwyn',
    officersAssigned: 'B. Donderick / B. Manny',
    hasZoom: false,
  },
  {
    slotId: 'PM-THU-0700',
    eventType: 'Prayer Meeting',
    eventName: 'Congregational Prayer Meeting',
    dayOfWeek: 4,
    dayName: 'Thurs',
    dayFullName: 'Thursday',
    time: '7:00 am',
    time24: '07:00',
    mproIncharge: 'S. Joy / B. Riyadh',
    officersAssigned: 'B. Edwin C.',
    hasZoom: false,
  },
  {
    slotId: 'PM-THU-1900',
    eventType: 'Prayer Meeting',
    eventName: 'Congregational Prayer Meeting',
    dayOfWeek: 4,
    dayName: 'Thurs',
    dayFullName: 'Thursday',
    time: '7:00 pm',
    time24: '19:00',
    mproIncharge: 'B. Orven / B. EJ / B. Vince (w/ zoom)',
    officersAssigned: 'B. Leo',
    hasZoom: true,
  },

  // --- Worship Service ---
  {
    slotId: 'WS-SAT-0330',
    eventType: 'Worship Service',
    eventName: 'Worship Service',
    dayOfWeek: 6,
    dayName: 'Sat',
    dayFullName: 'Saturday',
    time: '3:30 am',
    time24: '03:30',
    mproIncharge: 'S. Joy Ann / S. Eunice (w/ zoom)',
    officersAssigned: 'B. Francis / B. Edgar / B. Henry / S. Julianne',
    hasZoom: true,
  },
  {
    slotId: 'WS-SAT-0700',
    eventType: 'Worship Service',
    eventName: 'Worship Service',
    dayOfWeek: 6,
    dayName: 'Sat',
    dayFullName: 'Saturday',
    time: '7:00 am',
    time24: '07:00',
    mproIncharge: 'B. MJ / B. Riyadh / B. Vince (w/ zoom)',
    officersAssigned: 'B. Manny / S. Grace Ann',
    hasZoom: true,
  },
  {
    slotId: 'WS-SAT-1130',
    eventType: 'Worship Service',
    eventName: 'Worship Service',
    dayOfWeek: 6,
    dayName: 'Sat',
    dayFullName: 'Saturday',
    time: '11:30 am',
    time24: '11:30',
    mproIncharge: 'B. Erhize / S. Florwyn (substitute)',
    officersAssigned: 'B. Osbie / S. Lina / S. Mai / S. Cristel',
    hasZoom: false,
  },
  {
    slotId: 'WS-SUN-1200',
    eventType: 'Worship Service',
    eventName: 'Worship Service',
    dayOfWeek: 0,
    dayName: 'Sun',
    dayFullName: 'Sunday',
    time: '12:00 pm',
    time24: '12:00',
    mproIncharge: 'B. Orven / S. Joy / B. Riyadh',
    officersAssigned: 'B. Dennis / B. Chito / S. Hazel',
    hasZoom: false,
  },

  // --- Weekly Thanksgiving to God ---
  {
    slotId: 'TG-SAT-1600',
    eventType: 'Thanksgiving',
    eventName: 'Weekly Thanksgiving to God',
    dayOfWeek: 6,
    dayName: 'Sat',
    dayFullName: 'Saturday',
    time: '4:00 pm',
    time24: '16:00',
    mproIncharge: 'All Available MPRO (w/ zoom)',
    officersAssigned: 'B. Osbie / S. Ofel',
    hasZoom: true,
  },
  {
    slotId: 'TG-SUN-0500',
    eventType: 'Thanksgiving',
    eventName: 'Weekly Thanksgiving to God',
    dayOfWeek: 0,
    dayName: 'Sun',
    dayFullName: 'Sunday',
    time: '5:00 am',
    time24: '05:00',
    mproIncharge: 'S. Joy (set up), B. Orven / B. MJ / S. Eunice (inc. GA, Caravan)',
    officersAssigned: 'B. Edd Sumawang / B. Virgelio / B. Chito',
    hasZoom: false,
  },
  {
    slotId: 'TG-MON-0830',
    eventType: 'Thanksgiving',
    eventName: 'Weekly Thanksgiving to God',
    dayOfWeek: 1,
    dayName: 'Mon',
    dayFullName: 'Monday',
    time: '8:30 am',
    time24: '08:30',
    mproIncharge: 'B. Remo',
    officersAssigned: 'B. Gener / B. Edwin C. / B. Edwin G.',
    hasZoom: false,
  },
];

export function compareRegularGatheringSlots(
  first: RegularGatheringSlot,
  second: RegularGatheringSlot
): number {
  const firstWeekday = (first.dayOfWeek + 6) % 7;
  const secondWeekday = (second.dayOfWeek + 6) % 7;
  return firstWeekday - secondWeekday || first.time24.localeCompare(second.time24);
}

/**
 * Format local Date to YYYY-MM-DD
 */
export function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const getPhilippineDateTime = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);
  const year = part('year');
  const month = part('month');
  const day = part('day');
  const hour = part('hour');
  const minute = part('minute');
  return {
    year,
    month,
    day,
    currentDay: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
    currentMinutes: hour * 60 + minute,
  };
};

const formatUTCDate = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function getUpcomingRegularGatheringDate(slot: RegularGatheringSlot, now: Date = new Date()): string {
  const { year, month, day, currentDay, currentMinutes } = getPhilippineDateTime(now);
  const [hours, minutes] = slot.time24.split(':').map(Number);
  let daysUntilSlot = (slot.dayOfWeek - currentDay + 7) % 7;
  if (daysUntilSlot === 0 && hours * 60 + minutes <= currentMinutes) daysUntilSlot = 7;
  return formatUTCDate(new Date(Date.UTC(year, month - 1, day + daysUntilSlot)));
}

export function getRegularGatheringDateForCurrentWeek(
  slot: RegularGatheringSlot,
  now: Date = new Date()
): string {
  const { year, month, day, currentDay } = getPhilippineDateTime(now);
  const daysSinceMonday = (currentDay + 6) % 7;
  const daysFromMonday = (slot.dayOfWeek + 6) % 7;
  return formatUTCDate(new Date(Date.UTC(year, month - 1, day - daysSinceMonday + daysFromMonday)));
}

export function getScheduleDisplayTime(startTime?: string, scheduleLabel?: string): string {
  const value = String(startTime || '').trim();
  if (!/^1899-12-30(?:T|$)/.test(value)) return value;

  const match = String(scheduleLabel || '').match(/\b(\d{1,2}:\d{2})\s*(am|pm)\b/i);
  return match ? `${match[1]} ${match[2].toUpperCase()}` : 'Time unavailable';
}

const normalizeTo24Hour = (timeValue: string): string => {
  const raw = String(timeValue || '').trim();
  if (!raw) return '00:00';

  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) {
    const fallback = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (fallback) return `${fallback[1].padStart(2, '0')}:${fallback[2]}`;
    return raw;
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const suffix = match[3].toLowerCase();
  if (suffix === 'pm' && hours < 12) hours += 12;
  if (suffix === 'am' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

export function buildGatheringSlotFromSchedule(
  event: AttendanceEvent,
  schedule: EventSchedule
): RegularGatheringSlot {
  const date = String(schedule.date || event.startDate || '').slice(0, 10);
  const dateValue = date ? new Date(`${date}T12:00:00Z`) : new Date();
  const dayOfWeek = Number.isNaN(dateValue.getUTCDay()) ? 0 : dateValue.getUTCDay();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayFullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeValue = String(schedule.startTime || '07:00 PM').trim() || '07:00 PM';
  const timeLabel = timeValue.toLowerCase().includes('am') || timeValue.toLowerCase().includes('pm')
    ? timeValue
    : `${timeValue} ${dayNames[dayOfWeek].toLowerCase() === 'sun' ? 'AM' : 'PM'}`;
  const notes = [event.description, schedule.scheduleLabel].filter(Boolean).join(' • ');

  return {
    slotId: schedule.scheduleId || `${event.eventId}-${date}`,
    eventType: event.eventType || 'Other',
    eventName: event.eventName || schedule.scheduleLabel || 'Gathering',
    dayOfWeek,
    dayName: dayNames[dayOfWeek] as RegularGatheringSlot['dayName'],
    dayFullName: dayFullNames[dayOfWeek] as RegularGatheringSlot['dayFullName'],
    time: timeValue,
    time24: normalizeTo24Hour(timeLabel),
    mproIncharge: event.description || 'Local of Ascoville',
    officersAssigned: 'Local officers assigned',
    hasZoom: /live|zoom/i.test(`${schedule.scheduleLabel} ${event.description || ''}`),
    notes,
    dateStr: date,
    sourceScheduleId: schedule.scheduleId,
    sourceEventId: event.eventId,
  };
}

export function getSavedScheduleGatheringSlots(
  events: AttendanceEvent[],
  schedules: EventSchedule[]
): RegularGatheringSlot[] {
  return schedules
    .filter((schedule) => String(schedule.status || '').toLowerCase() !== 'cancelled')
    .map((schedule) => {
      const event = events.find((entry) => entry.eventId === schedule.eventId) || {
        eventId: schedule.eventId,
        eventName: schedule.scheduleLabel,
        eventType: 'Other',
        startDate: schedule.date,
        endDate: schedule.date,
        location: 'Local of Ascoville',
        description: schedule.scheduleLabel,
        status: 'Upcoming',
        createdBy: 'Officer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as AttendanceEvent;
      return buildGatheringSlotFromSchedule(event, schedule);
    })
    .sort((first, second) => {
      const left = first.dateStr || '9999-12-31';
      const right = second.dateStr || '9999-12-31';
      return left.localeCompare(right) || first.time24.localeCompare(second.time24);
    });
}

/**
 * Determine the automated gathering slot based on current day and time
 */
export function getAutomatedGatheringSlot(now: Date = new Date()): {
  slot: RegularGatheringSlot;
  isToday: boolean;
  dateStr: string;
} {
  const { year, month, day, currentDay, currentMinutes } = getPhilippineDateTime(now);
  const todayDate = new Date(Date.UTC(year, month - 1, day));

  // 1. Check if today has gathering slots
  const todaySlots = LOKAL_REGULAR_SCHEDULES
    .filter((s) => s.dayOfWeek === currentDay)
    .sort(compareRegularGatheringSlots);

  if (todaySlots.length > 0) {
    // Find the slot that is active or upcoming today
    // A slot is considered active until ~3 hours after its start time
    for (const slot of todaySlots) {
      const [h, m] = slot.time24.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      const endWindow = slotMinutes + 180; // 3 hours window

      if (currentMinutes <= endWindow) {
        return {
          slot,
          isToday: true,
          dateStr: formatUTCDate(todayDate),
        };
      }
    }

    return {
      slot: todaySlots[todaySlots.length - 1],
      isToday: true,
      dateStr: formatUTCDate(todayDate),
    };
  }

  // 2. If no slot remaining today (or today is a non-gathering day like Mon/Tue/Fri):
  // Find the next upcoming slot in the week
  for (let offset = (todaySlots.length > 0 ? 1 : 0); offset <= 7; offset++) {
    const targetDate = new Date(Date.UTC(year, month - 1, day + offset));
    const targetDay = targetDate.getUTCDay();
    const candidateSlots = LOKAL_REGULAR_SCHEDULES
      .filter((s) => s.dayOfWeek === targetDay)
      .sort(compareRegularGatheringSlots);

    if (candidateSlots.length > 0) {
      // Pick the first slot of that upcoming day
      return {
        slot: candidateSlots[0],
        isToday: offset === 0,
        dateStr: formatUTCDate(targetDate),
      };
    }
  }

  // Fallback to first regular slot
  return {
    slot: LOKAL_REGULAR_SCHEDULES[0],
    isToday: false,
    dateStr: formatUTCDate(todayDate),
  };
}

/**
 * Helper to ensure a matching AttendanceEvent and EventSchedule exist
 * in the database for the selected regular slot and date.
 */
export async function resolveOrCreateSlotEventSchedule(
  slot: RegularGatheringSlot,
  dateStr: string,
  events: AttendanceEvent[],
  schedules: EventSchedule[],
  saveEvent: (event: AttendanceEvent) => Promise<any>,
  saveSchedule: (schedule: EventSchedule) => Promise<any>
): Promise<{ event: AttendanceEvent; schedule: EventSchedule }> {
  // 1. Find matching event by type or name
  let event = events.find((candidate) =>
    candidate.eventName.trim().toLowerCase() === slot.eventName.toLowerCase()
  ) || events.find(
    (e) =>
      e.eventType === slot.eventType ||
      (e.eventName && e.eventName.toLowerCase().includes(slot.eventType.toLowerCase()))
  );

  if (!event) {
    // Create official event
    const nowIso = new Date().toISOString();
    const newEvent: AttendanceEvent = {
      eventId: `EVT-${slot.eventType.replace(/\s+/g, '-').toUpperCase()}`,
      eventName: slot.eventName,
      eventType: slot.eventType,
      startDate: dateStr,
      endDate: dateStr,
      location: 'Local of Ascoville',
      description: `Official congregational ${slot.eventType} gathering of the Local of Ascoville.`,
      status: 'Ongoing',
      isPublished: true,
      createdBy: 'Secretariat',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    void saveEvent(newEvent).catch((error: unknown) => {
      console.error('Could not persist the automated gathering event:', error);
    });
    event = newEvent;
  }

  const eventId = event.eventId || (event as any).eventID;

  // 2. Find matching schedule for this event, date, and time
  const normalizedSlotTime = slot.time.toLowerCase().replace(/\s+/g, '');
  let schedule = schedules.find((s) => {
    const sEvtId = String(s.eventId || (s as any).eventID || '').trim().toLowerCase();
    const sameEvent = sEvtId === String(eventId).trim().toLowerCase();
    const sameDate = String(s.date || '').slice(0, 10) === dateStr;
    const startTime = String(s.startTime || '').toLowerCase().replace(/\s+/g, '');
    const label = String(s.scheduleLabel || '').toLowerCase().replace(/\s+/g, '');
    const timeMatch = startTime === normalizedSlotTime || label.includes(normalizedSlotTime);
    return sameEvent && sameDate && timeMatch;
  });

  if (!schedule) {
    const nowIso = new Date().toISOString();
    const newSchedule: EventSchedule = {
      scheduleId: `SCH-${slot.slotId}-${dateStr.replace(/-/g, '')}`,
      eventId: eventId,
      date: dateStr,
      startTime: slot.time,
      scheduleLabel: `${slot.dayName} ${slot.time} (${slot.eventType})`,
      location: 'Local of Ascoville',
      status: 'Active',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    void saveSchedule(newSchedule).catch((error: unknown) => {
      console.error('Could not persist the automated gathering schedule:', error);
    });
    schedule = newSchedule;
  }

  return { event, schedule };
}
