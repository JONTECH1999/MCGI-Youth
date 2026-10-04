import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  Save,
  Trash2,
  CheckCheck,
  Search,
  Filter,
  Users,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Check,
  Plus,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { AttendanceRecord, AttendanceStatus } from '../../types/attendance';
import { AttendanceEvent, EventSchedule, EventType } from '../../types/event';
import { Member } from '../../types/member';
import { StatusBadge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';
import { OFFICIAL_COMMITTEES } from '../../data/sampleCommittees';
import { sortMembersById } from '../../services/storageService';
import {
  buildGatheringSlotFromSchedule,
  formatDateYYYYMMDD,
  getAutomatedGatheringSlot,
  getScheduleDisplayTime,
  getRegularGatheringDateForCurrentWeek,
  LOKAL_REGULAR_SCHEDULES,
  resolveOrCreateSlotEventSchedule,
} from '../../data/lokalSchedule';
import { LOCAL_OF_ASCOVILLE } from '../../utils/locationUtils';

const EXCLUDED_FAST_ATTENDANCE_EVENTS = new Set([
  'youth general assembly & sports fellowship',
  'district youth bible study & indoctrination review',
]);

export const FastAttendanceView: React.FC = () => {
  const {
    events,
    schedules,
    members,
    attendance,
    recordAttendanceBatch,
    saveEvent,
    saveSchedule,
    isLoading,
    isSyncing,
  } = useAppData();
  // Helper to reliably get unique member ID
  const getMemberId = (m: Member): string => {
    return (m.memberId || (m as any).memberID || '').trim();
  };

  // Selection states
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [clockNow, setClockNow] = useState(() => new Date());
  const manualSelectionSlotKeyRef = useRef('');
  const hasUnsavedChangesRef = useRef(false);
  const appliedSlotKeyRef = useRef('');
  const inFlightSlotKeysRef = useRef(new Set<string>());

  // Local working state for attendance: MemberId -> AttendanceStatus
  const [workingStatus, setWorkingStatus] = useState<Record<string, AttendanceStatus>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isSpecialScheduleOpen, setIsSpecialScheduleOpen] = useState(false);
  const [isSavingSpecialSchedule, setIsSavingSpecialSchedule] = useState(false);
  const [specialEventName, setSpecialEventName] = useState('');
  const [specialEventType, setSpecialEventType] = useState<EventType>('Youth Activity');
  const [specialEventDate, setSpecialEventDate] = useState(() => formatDateYYYYMMDD(new Date()));
  const [specialStartTime, setSpecialStartTime] = useState('04:00 PM');
  const [specialEndTime, setSpecialEndTime] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Junior' | 'Senior'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [committeeFilter, setCommitteeFilter] = useState<string>('All');

  // Confirmation dialogs
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState<boolean>(false);

  const selectableEvents = useMemo(
    () => events.filter((event) => !EXCLUDED_FAST_ATTENDANCE_EVENTS.has(event.eventName.trim().toLowerCase())),
    [events]
  );

  const automatedGathering = useMemo(() => getAutomatedGatheringSlot(clockNow), [clockNow]);
  const automatedSlotKey = `${automatedGathering.slot.slotId}:${automatedGathering.dateStr}`;
  const latestAutomatedSlotKeyRef = useRef(automatedSlotKey);
  latestAutomatedSlotKeyRef.current = automatedSlotKey;
  hasUnsavedChangesRef.current = hasUnsavedChanges;

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Follow the same day-and-time gathering selection used by member check-in.
  useEffect(() => {
    if (isLoading || isSyncing) return;
    const existingSelection = schedules.find(
      (schedule) => (schedule.scheduleId || (schedule as any).scheduleID) === selectedScheduleId
    );
    const selectedDate = String(existingSelection?.date || '').slice(0, 10);
    if (selectedDate && selectedDate < automatedGathering.dateStr && !hasUnsavedChanges) {
      manualSelectionSlotKeyRef.current = '';
    }

    if (inFlightSlotKeysRef.current.has(automatedSlotKey)) return;
    if (
      appliedSlotKeyRef.current === automatedSlotKey &&
      selectedDate === automatedGathering.dateStr
    ) return;

    inFlightSlotKeysRef.current.add(automatedSlotKey);
    void (async () => {
      let currentEvents = selectableEvents;
      let currentSchedules = schedules;
      const resolvedSlots = [];
      const slotsForGathering = LOKAL_REGULAR_SCHEDULES;

      for (const slot of slotsForGathering) {
        const date = getRegularGatheringDateForCurrentWeek(slot, clockNow);
        const resolved = await resolveOrCreateSlotEventSchedule(
          slot,
          date,
          currentEvents,
          currentSchedules,
          saveEvent,
          saveSchedule
        );
        resolvedSlots.push({ slot, ...resolved });
        currentEvents = currentEvents.some((event) => event.eventId === resolved.event.eventId)
          ? currentEvents
          : [...currentEvents, resolved.event];
        currentSchedules = currentSchedules.some((schedule) => schedule.scheduleId === resolved.schedule.scheduleId)
          ? currentSchedules
          : [...currentSchedules, resolved.schedule];
      }

      const currentSlot = resolvedSlots.find(({ slot }) => slot.slotId === automatedGathering.slot.slotId);
      if (currentSlot &&
        manualSelectionSlotKeyRef.current !== automatedSlotKey &&
        !hasUnsavedChangesRef.current &&
        latestAutomatedSlotKeyRef.current === automatedSlotKey
      ) {
        const { event, schedule } = currentSlot;
        setSelectedEventId(event.eventId || (event as any).eventID || '');
        setSelectedScheduleId(schedule.scheduleId || (schedule as any).scheduleID || '');
        appliedSlotKeyRef.current = automatedSlotKey;
      }
    })().catch((error: unknown) => {
      console.error('Could not resolve the current gathering schedule:', error);
    }).finally(() => {
      inFlightSlotKeysRef.current.delete(automatedSlotKey);
    });
  }, [
    isLoading,
    isSyncing,
    hasUnsavedChanges,
    automatedGathering,
    automatedSlotKey,
    clockNow,
    selectedScheduleId,
    selectableEvents,
    schedules,
    saveEvent,
    saveSchedule,
  ]);

  // Robustly find all available schedules for selected event (case-insensitive & handles eventId/eventID)
  const availableSchedules = useMemo(() => {
    if (!selectedEventId) return [];
    const targetEvtId = String(selectedEventId).trim().toLowerCase();

    const forEvent = schedules.filter((s) => {
      const sEvtId = String(s.eventId || (s as any).eventID || '').trim().toLowerCase();
      return sEvtId === targetEvtId;
    });

    const activeOnly = forEvent.filter((s) => {
      const status = String(s.status || 'Active').trim().toLowerCase();
      return status === 'active' || status === 'ongoing';
    });

    return [...(activeOnly.length > 0 ? activeOnly : forEvent)].sort((first, second) =>
      String(second.date || '').localeCompare(String(first.date || '')) ||
      String(first.startTime || '').localeCompare(String(second.startTime || ''))
    );
  }, [schedules, selectedEventId]);

  // When event changes or available schedules change, auto-select schedule
  useEffect(() => {
    if (selectedEventId) {
      if (availableSchedules.length > 0) {
        const currentValid = availableSchedules.some(
          (s) => (s.scheduleId || (s as any).scheduleID) === selectedScheduleId
        );
        if (!currentValid) {
          setSelectedScheduleId(availableSchedules[0].scheduleId || (availableSchedules[0] as any).scheduleID);
        }
      } else {
        setSelectedScheduleId('');
        setWorkingStatus({});
        setHasUnsavedChanges(false);
      }
    }
  }, [selectedEventId, availableSchedules, selectedScheduleId]);

  // Load existing attendance for selected schedule into working status
  useEffect(() => {
    if (hasUnsavedChanges) return;

    if (!selectedScheduleId) {
      setWorkingStatus({});
      setHasUnsavedChanges(false);
      setSaveSuccessMessage(null);
      return;
    }

    const scheduleRecords = attendance.filter((record) => {
      const recordScheduleId = record.scheduleId || (record as any).scheduleID;
      return recordScheduleId === selectedScheduleId;
    });
    const initial: Record<string, AttendanceStatus> = {};
    scheduleRecords.forEach((record) => {
      const memberId = (record.memberId || (record as any).memberID || '').trim();
      if (memberId && record.attendanceStatus) {
        initial[memberId] = record.attendanceStatus;
      }
    });
    setWorkingStatus(initial);
    setSaveSuccessMessage(null);
  }, [selectedScheduleId, attendance, hasUnsavedChanges]);

  const currentEvent = selectableEvents.find((e) => (e.eventId || (e as any).eventID) === selectedEventId);
  const currentSchedule = schedules.find((s) => (s.scheduleId || (s as any).scheduleID) === selectedScheduleId);
  const currentRegularSlot = currentEvent && currentSchedule
    ? LOKAL_REGULAR_SCHEDULES.find((slot) => {
        const scheduleDate = String(currentSchedule.date || '').slice(0, 10);
        const scheduleDay = new Date(`${scheduleDate}T12:00:00Z`).getUTCDay();
        const scheduleLabel = String(currentSchedule.scheduleLabel || '').toLowerCase().replace(/\s+/g, '');
        const scheduleTime = String(currentSchedule.startTime || '').toLowerCase().replace(/\s+/g, '');
        const slotTime = slot.time.toLowerCase().replace(/\s+/g, '');
        return slot.eventType === currentEvent.eventType && slot.dayOfWeek === scheduleDay &&
          (scheduleTime === slotTime || scheduleLabel.includes(slotTime));
      }) || buildGatheringSlotFromSchedule(currentEvent, currentSchedule)
    : undefined;

  const handleCreateSpecialSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    const eventName = specialEventName.trim();
    if (!eventName || !specialEventDate || !specialStartTime.trim()) return;

    setIsSavingSpecialSchedule(true);
    const now = new Date().toISOString();
    const eventId = `EVT-SPECIAL-${Date.now()}`;
    const scheduleId = `SCH-SPECIAL-${Date.now()}`;
    const newEvent: AttendanceEvent = {
      eventId,
      eventName,
      eventType: specialEventType,
      startDate: specialEventDate,
      endDate: specialEventDate,
      location: LOCAL_OF_ASCOVILLE,
      description: 'Special one-time gathering.',
      status: 'Upcoming',
      isPublished: true,
      createdBy: 'Officer',
      createdAt: now,
      updatedAt: now,
    };
    const newSchedule: EventSchedule = {
      scheduleId,
      eventId,
      date: specialEventDate,
      startTime: specialStartTime.trim(),
      endTime: specialEndTime.trim() || undefined,
      scheduleLabel: `${specialStartTime.trim()} ${eventName}`,
      location: LOCAL_OF_ASCOVILLE,
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    };

    await saveEvent(newEvent);
    await saveSchedule(newSchedule);
    manualSelectionSlotKeyRef.current = automatedSlotKey;
    appliedSlotKeyRef.current = automatedSlotKey;
    setWorkingStatus({});
    setHasUnsavedChanges(false);
    setSelectedEventId(eventId);
    setSelectedScheduleId(scheduleId);
    setSpecialEventName('');
    setSpecialEventType('Youth Activity');
    setSpecialStartTime('04:00 PM');
    setSpecialEndTime('');
    setIsSavingSpecialSchedule(false);
    setIsSpecialScheduleOpen(false);
  };

  // Filter members
  const filteredMembers = useMemo(() => {
    return sortMembersById(
      members.filter((m) => {
        const id = getMemberId(m);
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = (m.fullName || '').toLowerCase().includes(q) ||
            (m.firstName || '').toLowerCase().includes(q) ||
            (m.lastName || '').toLowerCase().includes(q);
          const matchesId = id.toLowerCase().includes(q);
          const matchesContact = (m.contactNumber || '').toLowerCase().includes(q);
          if (!matchesName && !matchesId && !matchesContact) return false;
        }

        // Category
        if (categoryFilter !== 'All' && m.memberCategory !== categoryFilter) {
          return false;
        }

        // Status
        if (statusFilter !== 'All' && m.membershipStatus !== statusFilter) {
          return false;
        }

        // Committee
        if (committeeFilter !== 'All' && (!m.committees || !m.committees.includes(committeeFilter))) {
          return false;
        }

        return true;
      })
    );
  }, [members, searchQuery, categoryFilter, statusFilter, committeeFilter]);

  // Summary counts for current working schedule
  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let excused = 0;
    let late = 0;
    let unmarked = 0;

    filteredMembers.forEach((m) => {
      const id = getMemberId(m);
      const s = id ? workingStatus[id] : undefined;
      if (s === 'Present') present++;
      else if (s === 'Absent') absent++;
      else if (s === 'Excused') excused++;
      else if (s === 'Late') late++;
      else unmarked++;
    });

    return { present, absent, excused, late, unmarked, total: filteredMembers.length };
  }, [filteredMembers, workingStatus]);

  // Set individual member attendance
  const handleMark = (rawMemberId: string, status: AttendanceStatus) => {
    const memberId = (rawMemberId || '').trim();
    if (!memberId) {
      console.warn('Cannot mark attendance: Member ID is missing.');
      return;
    }

    setWorkingStatus((prev) => {
      if (prev[memberId] === status) {
        // Toggle off if clicked again
        const next = { ...prev };
        delete next[memberId];
        return next;
      }
      return { ...prev, [memberId]: status };
    });
    setHasUnsavedChanges(true);
    setSaveSuccessMessage(null);
  };

  // Bulk actions
  const handleMarkAllPresent = () => {
    const next = { ...workingStatus };
    filteredMembers.forEach((m) => {
      const id = getMemberId(m);
      if (id) {
        next[id] = 'Present';
      }
    });
    setWorkingStatus(next);
    setHasUnsavedChanges(true);
  };

  const handleMarkAllAbsent = () => {
    const next = { ...workingStatus };
    filteredMembers.forEach((m) => {
      const id = getMemberId(m);
      if (id && !next[id]) {
        next[id] = 'Absent';
      }
    });
    setWorkingStatus(next);
    setHasUnsavedChanges(true);
  };

  const handleClearAttendance = () => {
    const next = { ...workingStatus };
    filteredMembers.forEach((m) => {
      const id = getMemberId(m);
      if (id) {
        delete next[id];
      }
    });
    setWorkingStatus(next);
    setHasUnsavedChanges(true);
  };

  // Save to database & Google Sheets
  const executeSave = async () => {
    if (!currentEvent || !currentSchedule) return;

    setIsSaving(true);
    setSaveSuccessMessage(null);

    const recordsToSave: AttendanceRecord[] = [];
    const now = new Date().toISOString();
    const curSchedId = currentSchedule.scheduleId || (currentSchedule as any).scheduleID;
    const curEvtId = currentEvent.eventId || (currentEvent as any).eventID;

    // Iterate through all members with marked status in this schedule
    Object.keys(workingStatus).forEach((memberId) => {
      if (!memberId || memberId === 'undefined' || memberId === 'null') return;
      const status = workingStatus[memberId];
      const member = members.find((m) => getMemberId(m) === memberId);
      if (status && member) {
        recordsToSave.push({
          attendanceId: `ATT-${memberId}-${curSchedId}`,
          eventId: curEvtId,
          scheduleId: curSchedId,
          memberId: memberId,
          memberName: member.fullName,
          eventName: currentEvent.eventName,
          eventDate: currentSchedule.date,
          schedule: currentSchedule.scheduleLabel,
          attendanceStatus: status,
          recordedBy: 'Officer',
          recordedAt: now,
          updatedAt: now,
        });
      }
    });

    const result = await recordAttendanceBatch(recordsToSave);
    setIsSaving(false);
    setHasUnsavedChanges(!result.success);
    setSaveSuccessMessage(result.message);

    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 5000);
  };

  const handleSaveClick = () => {
    executeSave();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Event & Schedule Selection Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Select Event */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Select Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                manualSelectionSlotKeyRef.current = automatedSlotKey;
                setSelectedEventId(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm font-semibold text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              {selectableEvents.map((ev) => {
                const eId = ev.eventId || (ev as any).eventID;
                return (
                  <option key={eId} value={eId}>
                    {ev.eventName} ({ev.eventType})
                  </option>
                );
              })}
            </select>
            {currentEvent && (
              <p className="mt-1 text-[11px] text-slate-500">
                {currentSchedule?.date || currentEvent.startDate} • {currentEvent.location}
              </p>
            )}
          </div>

          {/* 2. Select Schedule */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Select Schedule & Date
            </label>
            {availableSchedules.length > 0 ? (
              <select
                value={selectedScheduleId}
                onChange={(e) => {
                  manualSelectionSlotKeyRef.current = automatedSlotKey;
                  setSelectedScheduleId(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm font-semibold text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                {availableSchedules.map((sc) => {
                  const sId = sc.scheduleId || (sc as any).scheduleID;
                  return (
                    <option key={sId} value={sId}>
                      {sc.scheduleLabel} ({sc.date})
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 space-y-2">
                <p className="font-semibold">No active schedules found for this event.</p>
                {currentEvent && (
                  <button
                    type="button"
                    onClick={async () => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const newSched = {
                        scheduleId: `SCH-${Date.now().toString().slice(-6)}`,
                        eventId: currentEvent.eventId || (currentEvent as any).eventID,
                        date: currentEvent.startDate || todayStr,
                        startTime: '04:00 PM',
                        endTime: '08:00 PM',
                        scheduleLabel: `${currentEvent.eventType} Official Schedule`,
                        location: currentEvent.location || 'Ascoville Chapel',
                        status: 'Active' as const,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      };
                      await saveSchedule(newSched);
                      setSelectedScheduleId(newSched.scheduleId);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors shadow-2xs"
                  >
                    <span>+ Quick Create Schedule</span>
                  </button>
                )}
              </div>
            )}
            {currentSchedule && (
              <div className="mt-1 text-[11px] text-slate-500">
                <p>
                  Date: {currentSchedule.date} • Time: {getScheduleDisplayTime(currentSchedule.startTime, currentSchedule.scheduleLabel)} • Location: {currentSchedule.location}
                </p>
                {currentRegularSlot && (
                  <div className="mt-1 space-y-0.5 text-slate-600">
                    <p><span className="font-semibold">MPRO:</span> {currentRegularSlot.mproIncharge}</p>
                    <p><span className="font-semibold">Officers:</span> {currentRegularSlot.officersAssigned}</p>
                    {currentRegularSlot.hasZoom && <p className="font-semibold text-blue-700">Online broadcast available</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Live Batch Save Controls */}
          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={isSaving || !selectedScheduleId}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold shadow-xs transition-all ${
                  hasUnsavedChanges
                    ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-400 ring-offset-1 animate-pulse'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{hasUnsavedChanges ? 'Save Attendance *' : 'Save Attendance'}</span>
                  </>
                )}
              </button>
            </div>
            {hasUnsavedChanges && (
              <p className="mt-1.5 text-center text-xs font-semibold text-amber-600">
                ● You have unsaved attendance changes.
              </p>
            )}
            {saveSuccessMessage && (
              <p className="mt-1.5 text-center text-xs font-medium text-emerald-600 flex items-center justify-center gap-1">
                <Check className="h-3.5 w-3.5" />
                {saveSuccessMessage}
              </p>
            )}
            <button
              type="button"
              onClick={() => setIsSpecialScheduleOpen(true)}
              disabled={hasUnsavedChanges || isSavingSpecialSchedule}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Special Schedule
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Present</span>
            <span className="text-lg font-extrabold text-emerald-900">{counts.present}</span>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-lg p-2">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Absent</span>
            <span className="text-lg font-extrabold text-rose-900">{counts.absent}</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-2">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Late</span>
            <span className="text-lg font-extrabold text-amber-900">{counts.late}</span>
          </div>
          <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-2">
            <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">Excused</span>
            <span className="text-lg font-extrabold text-cyan-900">{counts.excused}</span>
          </div>
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Unmarked</span>
            <span className="text-lg font-extrabold text-slate-800">{counts.unmarked}</span>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isSpecialScheduleOpen}
        onClose={() => setIsSpecialScheduleOpen(false)}
        title="Add Special Schedule"
        subtitle="Create a one-time event and attendance batch."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSpecialSchedule} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Event Name *</label>
            <input
              required
              autoFocus
              value={specialEventName}
              onChange={(event) => setSpecialEventName(event.target.value)}
              placeholder="e.g. Special Thanksgiving Gathering"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Event Type</label>
              <select
                value={specialEventType}
                onChange={(event) => setSpecialEventType(event.target.value as EventType)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Youth Activity">Youth Activity</option>
                <option value="Prayer Meeting">Prayer Meeting</option>
                <option value="Thanksgiving">Thanksgiving</option>
                <option value="Worship Service">Worship Service</option>
                <option value="Bible Study">Bible Study</option>
                <option value="Meeting">Meeting</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Date *</label>
              <input
                required
                type="date"
                value={specialEventDate}
                onChange={(event) => setSpecialEventDate(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Start Time *</label>
              <input
                required
                value={specialStartTime}
                onChange={(event) => setSpecialStartTime(event.target.value)}
                placeholder="04:00 PM"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">End Time</label>
              <input
                value={specialEndTime}
                onChange={(event) => setSpecialEndTime(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">Location: {LOCAL_OF_ASCOVILLE}</p>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setIsSpecialScheduleOpen(false)}
              disabled={isSavingSpecialSchedule}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingSpecialSchedule}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSavingSpecialSchedule ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Filter and Bulk Actions Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member by full name, Member ID, or contact number..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder-slate-400 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden"
            >
              <option value="All">All Categories</option>
              <option value="Junior">Junior (&lt;18)</option>
              <option value="Senior">Senior (18+)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On & Off">On & Off</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>

            {/* Committee Filter */}
            <select
              value={committeeFilter}
              onChange={(e) => setCommitteeFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-medium text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden"
            >
              <option value="All">All Committees</option>
              {OFFICIAL_COMMITTEES.map((comm) => (
                <option key={comm} value={comm}>
                  {comm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Buttons (Shortcuts) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Mark All Filtered Present</span>
            </button>
            <button
              type="button"
              onClick={handleMarkAllAbsent}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              <span>Mark Unmarked Absent</span>
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Clear Attendance</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-900">{filteredMembers.length}</span> member(s)
          </p>
        </div>
      </div>

      {/* Member Fast Attendance List */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">No members match your criteria</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMembers.map((member) => {
              const memberId = getMemberId(member);
              const currentStatus = memberId ? workingStatus[memberId] : undefined;

              return (
                <div
                  key={memberId || member.fullName}
                  className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    currentStatus === 'Present'
                      ? 'bg-emerald-50/40'
                      : currentStatus === 'Absent'
                      ? 'bg-rose-50/30'
                      : currentStatus === 'Late'
                      ? 'bg-amber-50/30'
                      : currentStatus === 'Excused'
                      ? 'bg-cyan-50/30'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Member Details */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                      {(member.firstName && member.firstName[0]) || 'M'}
                      {(member.lastName && member.lastName !== '.' && member.lastName[0]) || ''}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {member.fullName}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {memberId || 'NO-ID'}
                        </span>
                        <StatusBadge status={member.memberCategory} />
                        <StatusBadge status={member.membershipStatus} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                        <span>{member.contactNumber}</span>
                        {member.committees && member.committees.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 font-medium truncate max-w-xs">
                              {member.committees.join(', ')}
                            </span>
                          </>
                        )}
                        {member.attendancePercentage !== undefined && (
                          <>
                            <span>•</span>
                            <span
                              className={`font-semibold ${
                                member.attendancePercentage >= 75
                                  ? 'text-emerald-600'
                                  : member.attendancePercentage >= 50
                                  ? 'text-blue-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              Rate: {member.attendancePercentage}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Touch-Friendly Status Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMark(memberId, 'Present')}
                      className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        currentStatus === 'Present'
                          ? 'bg-emerald-600 text-white shadow-xs scale-102 ring-2 ring-emerald-400'
                          : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800'
                      }`}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>PRESENT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMark(memberId, 'Absent')}
                      className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        currentStatus === 'Absent'
                          ? 'bg-rose-600 text-white shadow-xs scale-102 ring-2 ring-rose-400'
                          : 'bg-slate-100 text-slate-700 hover:bg-rose-100 hover:text-rose-800'
                      }`}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>ABSENT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMark(memberId, 'Late')}
                      className={`px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        currentStatus === 'Late'
                          ? 'bg-amber-600 text-white shadow-xs scale-102 ring-2 ring-amber-400'
                          : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-800'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>LATE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMark(memberId, 'Excused')}
                      className={`px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        currentStatus === 'Excused'
                          ? 'bg-cyan-600 text-white shadow-xs scale-102 ring-2 ring-cyan-400'
                          : 'bg-slate-100 text-slate-700 hover:bg-cyan-100 hover:text-cyan-800'
                      }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>EXCUSED</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Clearing Attendance */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAttendance}
        title="Clear Marked Attendance?"
        message="Are you sure you want to clear the attendance status for all filtered members? This will reset their marked status in the active view."
        confirmLabel="Yes, Clear"
        variant="warning"
      />
    </div>
  );
};
