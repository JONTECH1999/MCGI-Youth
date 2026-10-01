import React, { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { AttendanceRecord, AttendanceStatus } from '../../types/attendance';
import { Member } from '../../types/member';
import { StatusBadge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { OFFICIAL_COMMITTEES } from '../../data/sampleCommittees';

export const FastAttendanceView: React.FC = () => {
  const {
    events,
    schedules,
    members,
    attendance,
    recordAttendanceBatch,
  } = useAppData();
  const { user } = useAuth();

  // Selection states
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  // Local working state for attendance: MemberId -> AttendanceStatus
  const [workingStatus, setWorkingStatus] = useState<Record<string, AttendanceStatus>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Junior' | 'Senior'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [committeeFilter, setCommitteeFilter] = useState<string>('All');

  // Confirmation dialogs
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState<boolean>(false);

  // Auto-select first active event & schedule on mount
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      // Find ongoing or first event
      const ongoing = events.find((e) => e.status === 'Ongoing') || events[0];
      setSelectedEventId(ongoing.eventId);
    }
  }, [events, selectedEventId]);

  // When event changes, auto-select schedule
  useEffect(() => {
    if (selectedEventId) {
      const eventSchedules = schedules.filter((s) => s.eventId === selectedEventId && s.status === 'Active');
      if (eventSchedules.length > 0) {
        setSelectedScheduleId(eventSchedules[0].scheduleId);
      } else {
        setSelectedScheduleId('');
      }
    }
  }, [selectedEventId, schedules]);

  // Load existing attendance for selected schedule into working status
  useEffect(() => {
    if (selectedScheduleId) {
      const scheduleRecords = attendance.filter((a) => a.scheduleId === selectedScheduleId);
      const initial: Record<string, AttendanceStatus> = {};
      scheduleRecords.forEach((r) => {
        initial[r.memberId] = r.attendanceStatus;
      });
      setWorkingStatus(initial);
      setHasUnsavedChanges(false);
      setSaveSuccessMessage(null);
    }
  }, [selectedScheduleId, attendance]);

  const currentEvent = events.find((e) => e.eventId === selectedEventId);
  const currentSchedule = schedules.find((s) => s.scheduleId === selectedScheduleId);
  const availableSchedules = schedules.filter((s) => s.eventId === selectedEventId && s.status === 'Active');

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = m.fullName.toLowerCase().includes(q) ||
          m.firstName.toLowerCase().includes(q) ||
          m.lastName.toLowerCase().includes(q);
        const matchesId = m.memberId.toLowerCase().includes(q);
        const matchesContact = m.contactNumber.toLowerCase().includes(q);
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
      if (committeeFilter !== 'All' && !m.committees.includes(committeeFilter)) {
        return false;
      }

      return true;
    });
  }, [members, searchQuery, categoryFilter, statusFilter, committeeFilter]);

  // Summary counts for current working schedule
  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let excused = 0;
    let late = 0;
    let unmarked = 0;

    filteredMembers.forEach((m) => {
      const s = workingStatus[m.memberId];
      if (s === 'Present') present++;
      else if (s === 'Absent') absent++;
      else if (s === 'Excused') excused++;
      else if (s === 'Late') late++;
      else unmarked++;
    });

    return { present, absent, excused, late, unmarked, total: filteredMembers.length };
  }, [filteredMembers, workingStatus]);

  // Set individual member attendance
  const handleMark = (memberId: string, status: AttendanceStatus) => {
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
      next[m.memberId] = 'Present';
    });
    setWorkingStatus(next);
    setHasUnsavedChanges(true);
  };

  const handleMarkAllAbsent = () => {
    const next = { ...workingStatus };
    filteredMembers.forEach((m) => {
      if (!next[m.memberId]) {
        next[m.memberId] = 'Absent';
      }
    });
    setWorkingStatus(next);
    setHasUnsavedChanges(true);
  };

  const handleClearAttendance = () => {
    const next = { ...workingStatus };
    filteredMembers.forEach((m) => {
      delete next[m.memberId];
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

    // Iterate through all members with marked status in this schedule
    Object.keys(workingStatus).forEach((memberId) => {
      const status = workingStatus[memberId];
      const member = members.find((m) => m.memberId === memberId);
      if (status && member) {
        recordsToSave.push({
          attendanceId: `ATT-${member.memberId}-${currentSchedule.scheduleId}`,
          eventId: currentEvent.eventId,
          scheduleId: currentSchedule.scheduleId,
          memberId: member.memberId,
          memberName: member.fullName,
          eventName: currentEvent.eventName,
          eventDate: currentSchedule.date,
          schedule: currentSchedule.scheduleLabel,
          attendanceStatus: status,
          recordedBy: user?.fullName || 'Attendance Officer',
          recordedAt: now,
          updatedAt: now,
        });
      }
    });

    const result = await recordAttendanceBatch(recordsToSave);
    setIsSaving(false);
    setHasUnsavedChanges(false);
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
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm font-semibold text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              {events.map((ev) => (
                <option key={ev.eventId} value={ev.eventId}>
                  {ev.eventName} ({ev.eventType})
                </option>
              ))}
            </select>
            {currentEvent && (
              <p className="mt-1 text-[11px] text-slate-500">
                {currentEvent.startDate} to {currentEvent.endDate} • {currentEvent.location}
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
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm font-semibold text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                {availableSchedules.map((sc) => (
                  <option key={sc.scheduleId} value={sc.scheduleId}>
                    {sc.scheduleLabel} ({sc.date})
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
                No active schedules found for this event.
              </div>
            )}
            {currentSchedule && (
              <p className="mt-1 text-[11px] text-slate-500">
                Date: {currentSchedule.date} • Time: {currentSchedule.startTime} • Location: {currentSchedule.location}
              </p>
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
              const currentStatus = workingStatus[member.memberId];

              return (
                <div
                  key={member.memberId}
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
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {member.fullName}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {member.memberId}
                        </span>
                        <StatusBadge status={member.memberCategory} />
                        <StatusBadge status={member.membershipStatus} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                        <span>{member.contactNumber}</span>
                        {member.committees.length > 0 && (
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
                      onClick={() => handleMark(member.memberId, 'Present')}
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
                      onClick={() => handleMark(member.memberId, 'Absent')}
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
                      onClick={() => handleMark(member.memberId, 'Late')}
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
                      onClick={() => handleMark(member.memberId, 'Excused')}
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
