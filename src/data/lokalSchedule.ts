import { AttendanceEvent, EventSchedule } from '../types/event';

export interface RegularGatheringSlot {
  slotId: string;
  eventType: 'Prayer Meeting' | 'Worship Service' | 'Thanksgiving';
  eventName: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  dayName: 'Mon' | 'Wed' | 'Thurs' | 'Sat' | 'Sun';
  dayFullName: 'Monday' | 'Wednesday' | 'Thursday' | 'Saturday' | 'Sunday';
  time: string;
  time24: string; // HH:mm
  mproIncharge: string;
  officersAssigned: string;
  hasZoom: boolean;
  notes?: string;
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
    hasZoom: true,
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

/**
 * Format local Date to YYYY-MM-DD
 */
export function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Determine the automated gathering slot based on current day and time
 */
export function getAutomatedGatheringSlot(now: Date = new Date()): {
  slot: RegularGatheringSlot;
  isToday: boolean;
  dateStr: string;
} {
  const currentDay = now.getDay(); // 0-6
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 1. Check if today has gathering slots
  const todaySlots = LOKAL_REGULAR_SCHEDULES.filter((s) => s.dayOfWeek === currentDay);

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
          dateStr: formatDateYYYYMMDD(now),
        };
      }
    }
  }

  // 2. If no slot remaining today (or today is a non-gathering day like Mon/Tue/Fri):
  // Find the next upcoming slot in the week
  for (let offset = (todaySlots.length > 0 ? 1 : 0); offset <= 7; offset++) {
    const targetDate = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
    const targetDay = targetDate.getDay();
    const candidateSlots = LOKAL_REGULAR_SCHEDULES.filter((s) => s.dayOfWeek === targetDay);

    if (candidateSlots.length > 0) {
      // Pick the first slot of that upcoming day
      return {
        slot: candidateSlots[0],
        isToday: offset === 0,
        dateStr: formatDateYYYYMMDD(targetDate),
      };
    }
  }

  // Fallback to first regular slot
  return {
    slot: LOKAL_REGULAR_SCHEDULES[0],
    isToday: false,
    dateStr: formatDateYYYYMMDD(now),
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
  let event = events.find(
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
      location: 'Local of Ascoville Main Chapel',
      description: `Official congregational ${slot.eventType} gathering of the Local of Ascoville.`,
      status: 'Ongoing',
      isPublished: true,
      createdBy: 'Secretariat',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await saveEvent(newEvent);
    event = newEvent;
  }

  const eventId = event.eventId || (event as any).eventID;

  // 2. Find matching schedule for this event, date, and time
  const targetLabel = `${slot.dayName} ${slot.time}`;
  let schedule = schedules.find((s) => {
    const sEvtId = s.eventId || (s as any).eventID;
    const sameEvent = sEvtId === eventId;
    const sameDate = s.date === dateStr;
    const labelMatch = s.scheduleLabel?.toLowerCase().includes(slot.time.toLowerCase());
    return sameEvent && (sameDate || labelMatch);
  });

  if (!schedule) {
    const nowIso = new Date().toISOString();
    const newSchedule: EventSchedule = {
      scheduleId: `SCH-${slot.slotId}-${dateStr.replace(/-/g, '')}`,
      eventId: eventId,
      date: dateStr,
      startTime: slot.time,
      scheduleLabel: `${slot.dayName} ${slot.time} (${slot.eventType})`,
      location: 'Ascoville Chapel / Zoom Broadcast',
      status: 'Active',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await saveSchedule(newSchedule);
    schedule = newSchedule;
  }

  return { event, schedule };
}
