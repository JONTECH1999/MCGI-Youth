import React, { useState, useMemo } from 'react';
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Vote,
  Heart,
  Award,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { Member } from '../../types/member';
import { AttendanceRecord } from '../../types/attendance';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import { AttendanceService } from '../../services/attendanceService';

interface MemberProfileModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  attendanceRecords: AttendanceRecord[];
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  isOpen,
  onClose,
  attendanceRecords,
}) => {
  const [historyFilterType, setHistoryFilterType] = useState<string>('All');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('All');

  // Compute streaks
  const { currentStreak, longestStreak } = useMemo(() => {
    if (!member) return { currentStreak: 0, longestStreak: 0 };
    return AttendanceService.calculateStreaks(member.memberId, attendanceRecords);
  }, [member, attendanceRecords]);

  // Member's specific attendance records
  const memberAttendance = useMemo(() => {
    if (!member) return [];
    return attendanceRecords
      .filter((r) => r.memberId === member.memberId)
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }, [member, attendanceRecords]);

  // Attendance summary metrics
  const attendanceSummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    memberAttendance.forEach((r) => {
      if (r.attendanceStatus === 'Present') present++;
      else if (r.attendanceStatus === 'Absent') absent++;
      else if (r.attendanceStatus === 'Late') late++;
      else if (r.attendanceStatus === 'Excused') excused++;
    });

    const qualifying = present + absent + late;
    const rate = qualifying > 0 ? Math.round(((present + late) / qualifying) * 1000) / 10 : 0;

    return {
      total: memberAttendance.length,
      attended: present + late,
      present,
      absent,
      late,
      excused,
      rate,
    };
  }, [memberAttendance]);

  // Filtered attendance history table
  const filteredHistory = useMemo(() => {
    return memberAttendance.filter((r) => {
      if (historyFilterStatus !== 'All' && r.attendanceStatus !== historyFilterStatus) return false;
      return true;
    });
  }, [memberAttendance, historyFilterStatus]);

  if (!member) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Member Profile & Official Record"
      subtitle={`Member ID: ${member.memberId}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Profile Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-extrabold text-lg border-2 border-slate-700 shadow-xs">
              {member.firstName[0]}
              {member.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{member.fullName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <StatusBadge status={member.membershipStatus} />
                <StatusBadge status={member.memberCategory} />
                <StatusBadge status={member.activityStatus} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
              <span className="text-2xl font-black text-emerald-400">
                {attendanceSummary.rate}%
              </span>
            </div>
          </div>
        </div>

        {/* Section 1 & 2: Personal Information & Membership Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <User className="h-4 w-4 text-blue-600" />
              <span>Personal Information</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Birthday:</span>
                <span className="font-semibold text-slate-800">{member.birthday || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Age / Gender:</span>
                <span className="font-semibold text-slate-800">
                  {member.age} yrs • {member.gender}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Contact Number:</span>
                <span className="font-semibold text-slate-800">{member.contactNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email Address:</span>
                <span className="font-semibold text-slate-800 truncate block">{member.email || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Address:</span>
                <span className="font-semibold text-slate-800">{member.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Membership & Committees */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <Award className="h-4 w-4 text-blue-600" />
              <span>Membership & Committees</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Date Registered:</span>
                <span className="font-semibold text-slate-800">{member.dateRegistered}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Last Attendance:</span>
                <span className="font-semibold text-slate-800">{member.lastAttendanceDate || 'No record'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block mb-1">Committees Assigned:</span>
                {member.committees && member.committees.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {member.committees.map((comm) => (
                      <span
                        key={comm}
                        className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium"
                      >
                        {comm}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">None assigned</span>
                )}
              </div>
              {member.activityReason && (
                <div className="col-span-2 bg-amber-50 border border-amber-200 rounded p-2 text-amber-800">
                  <span className="font-bold block">Activity Assessment:</span>
                  <span>{member.activityReason}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Demographics Breakdown */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <span>Demographic Data</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Education:</span>
              <span className="font-bold text-slate-800">{member.studentStatus}</span>
              {member.outOfSchoolYouth && (
                <span className="text-rose-600 font-bold block text-[10px] mt-0.5">Out of School Youth</span>
              )}
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Employment:</span>
              <span className="font-bold text-slate-800">{member.employmentStatus}</span>
              {member.workingStudent && (
                <span className="text-blue-600 font-bold block text-[10px] mt-0.5">Working Student</span>
              )}
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Voting Status:</span>
              <span className={`font-bold ${member.registeredVoter ? 'text-emerald-700' : 'text-slate-600'}`}>
                {member.registeredVoter ? 'Registered Voter' : 'Not Registered'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Parent Status:</span>
              <span className="font-bold text-slate-800">{member.parentBaptismStatus}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Attendance Summary & Streaks */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Attendance Summary</span>
            </h4>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-amber-700 font-bold">
                <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Current Streak: {currentStreak}</span>
              </div>
              <div className="flex items-center gap-1 text-blue-700 font-bold">
                <Award className="h-4 w-4 text-blue-500" />
                <span>Longest Streak: {longestStreak}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <span className="text-slate-500 block text-[10px]">Total Events</span>
              <span className="text-base font-bold text-slate-900">{attendanceSummary.total}</span>
            </div>
            <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
              <span className="text-emerald-700 block text-[10px] font-semibold">Attended</span>
              <span className="text-base font-bold text-emerald-900">{attendanceSummary.attended}</span>
            </div>
            <div className="bg-rose-50 rounded-lg p-2 border border-rose-100">
              <span className="text-rose-700 block text-[10px] font-semibold">Missed</span>
              <span className="text-base font-bold text-rose-900">{attendanceSummary.absent}</span>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
              <span className="text-amber-700 block text-[10px] font-semibold">Late</span>
              <span className="text-base font-bold text-amber-900">{attendanceSummary.late}</span>
            </div>
            <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-100">
              <span className="text-cyan-700 block text-[10px] font-semibold">Excused</span>
              <span className="text-base font-bold text-cyan-900">{attendanceSummary.excused}</span>
            </div>
          </div>
        </div>

        {/* Section 5: Attendance History Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Attendance History ({filteredHistory.length})
            </h4>
            <div className="flex items-center gap-2">
              <select
                value={historyFilterStatus}
                onChange={(e) => setHistoryFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white py-1 px-2 text-xs font-medium text-slate-700 shadow-2xs"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Excused">Excused</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Event</th>
                  <th className="py-2.5 px-3">Schedule</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No attendance records found for this member.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((rec) => (
                    <tr key={rec.attendanceId} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-900">{rec.eventDate}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{rec.eventName}</td>
                      <td className="py-2 px-3 text-slate-600">{rec.schedule}</td>
                      <td className="py-2 px-3 text-center">
                        <StatusBadge status={rec.attendanceStatus} />
                      </td>
                      <td className="py-2 px-3 text-slate-500">{rec.recordedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};
