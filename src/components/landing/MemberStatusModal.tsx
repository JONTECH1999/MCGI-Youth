import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  LogOut,
  History,
} from 'lucide-react';
import { Member } from '../../types/member';
import { AttendanceRecord } from '../../types/attendance';
import { AttendanceEvent, EventSchedule } from '../../types/event';

interface MemberStatusModalProps {
  member: Member | null;
  attendanceRecords: AttendanceRecord[];
  upcomingEvents: AttendanceEvent[];
  schedules: EventSchedule[];
  onClose: () => void;
  onLogout: () => void;
  onInitiateCheckIn: (event: AttendanceEvent, schedule: EventSchedule) => void;
}

export const MemberStatusModal: React.FC<MemberStatusModalProps> = ({
  member,
  attendanceRecords,
  upcomingEvents,
  schedules,
  onClose,
  onLogout,
  onInitiateCheckIn,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'history'>('overview');

  if (!member) return null;

  // Member's private attendance records only
  const memberAttendance = attendanceRecords
    .filter((a) => a.memberId === member.memberId)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  // Friendly, respectful status explanation
  const getStatusExplanation = () => {
    switch (member.activityStatus) {
      case 'Regular':
        return {
          title: 'Consistent & Regular Attendance',
          text: 'Thank you for your faithful presence and dedication to our spiritual gatherings! You are currently meeting and exceeding all attendance milestones.',
          color: 'emerald',
          border: 'border-emerald-200',
          bg: 'bg-emerald-50/80',
          textCol: 'text-emerald-900',
        };
      case 'Active':
        return {
          title: 'Active Community Member',
          text: 'You maintain active attendance in our locale gatherings. Check out the upcoming events below to keep your attendance rate strong!',
          color: 'blue',
          border: 'border-blue-200',
          bg: 'bg-blue-50/80',
          textCol: 'text-blue-900',
        };
      case 'At Risk':
        return {
          title: 'Notice: Status is Currently At Risk',
          text: member.activityReason ||
            'You have missed recent qualifying congregational assemblies. We encourage you to attend the upcoming prayer meeting or worship service below to restore your regular status. Our youth officers are always here to assist if you have schedule conflicts.',
          color: 'amber',
          border: 'border-amber-300',
          bg: 'bg-amber-50/90',
          textCol: 'text-amber-900',
        };
      case 'Inactive':
        return {
          title: 'Notice: Inactive Attendance Status',
          text:
            'Your attendance has been inactive during the recent monitoring period. We warmly invite you to reconnect with your youth cluster and attend any upcoming schedule listed below. We miss you in the congregation!',
          color: 'rose',
          border: 'border-rose-200',
          bg: 'bg-rose-50/80',
          textCol: 'text-rose-900',
        };
      default:
        return {
          title: 'Welcome to MCGI Youth',
          text: 'Check your upcoming gatherings and attend scheduled assemblies.',
          color: 'stone',
          border: 'border-stone-200',
          bg: 'bg-stone-50',
          textCol: 'text-stone-900',
        };
    }
  };

  const explanation = getStatusExplanation();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="p-6 sm:p-7 bg-[#FAF7F2] border-b border-[#E6DFD5] flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-800 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {member.firstName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Member Portal</span>
                <span className="text-stone-300">•</span>
                <span className="text-xs text-stone-500 font-mono">ID: {member.memberId}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
                Welcome, {member.firstName}!
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                {member.fullName} • {member.memberCategory} Youth
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={onLogout}
              title="Switch / Log out of this profile"
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 border-b border-stone-200 bg-white flex space-x-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 border-b-2 transition cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Status Overview
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`py-3.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'events'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>Upcoming & Attend</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
              {upcomingEvents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Attendance ({memberAttendance.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4 Status KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Membership
                  </span>
                  <div className="mt-1 flex items-center space-x-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-base font-extrabold text-stone-900 uppercase">
                      {member.membershipStatus}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 block">Official Status</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Attendance
                  </span>
                  <div className="mt-1">
                    <span className="text-xl font-extrabold text-amber-800">
                      {member.attendancePercentage}%
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    {member.attendanceCount} sessions attended
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Activity Status
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-extrabold ${
                        member.activityStatus === 'Regular' || member.activityStatus === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : member.activityStatus === 'At Risk'
                          ? 'bg-amber-100 text-amber-900 font-bold'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {member.activityStatus}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 block">Current Standing</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Last Attendance
                  </span>
                  <div className="mt-1 text-sm font-bold text-stone-900">
                    {member.lastAttendanceDate || 'No record yet'}
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 block">Latest assembly</span>
                </div>
              </div>

              {/* Status Explanation Card */}
              <div className={`p-5 rounded-2xl border ${explanation.border} ${explanation.bg} space-y-2`}>
                <div className="flex items-center space-x-2">
                  {member.activityStatus === 'At Risk' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
                  )}
                  <h4 className={`text-sm font-bold ${explanation.textCol}`}>{explanation.title}</h4>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed pl-7">
                  {explanation.text}
                </p>
              </div>

              {/* Quick Action: Upcoming Gatherings shortcut */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Next Gatherings You Can Attend
                  </h4>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="text-xs font-bold text-amber-800 hover:text-amber-900"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2.5">
                  {upcomingEvents.slice(0, 3).map((evt) => {
                    const evtSchedules = schedules.filter((s) => s.eventId === evt.eventId && s.status === 'Active');
                    const hasAttended = memberAttendance.some((a) => a.eventId === evt.eventId);

                    return (
                      <div
                        key={evt.eventId}
                        className="p-3.5 rounded-2xl border border-stone-200 hover:border-amber-400 bg-stone-50/60 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase text-amber-800">{evt.eventType}</span>
                          <h5 className="text-sm font-bold text-stone-900 truncate">{evt.eventName}</h5>
                          <p className="text-xs text-stone-500">{evt.startDate} • {evt.location}</p>
                        </div>

                        <div>
                          {hasAttended ? (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Attending</span>
                            </span>
                          ) : evtSchedules.length > 0 ? (
                            <button
                              onClick={() => onInitiateCheckIn(evt, evtSchedules[0])}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                            >
                              Attend
                            </button>
                          ) : (
                            <span className="text-xs text-stone-400">No schedules</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPCOMING EVENTS & SCHEDULES */}
          {activeTab === 'events' && (
            <div className="space-y-5">
              <p className="text-xs text-stone-500">
                Choose a schedule batch below to confirm your attendance. Once recorded, your official attendance count will update immediately.
              </p>

              <div className="space-y-6">
                {upcomingEvents.map((evt) => {
                  const eventSchedules = schedules.filter((s) => s.eventId === evt.eventId && s.status === 'Active');

                  return (
                    <div key={evt.eventId} className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {evt.eventType}
                          </span>
                          <h4 className="text-base font-bold text-stone-900 mt-1">{evt.eventName}</h4>
                          <p className="text-xs text-stone-500">{evt.startDate} • {evt.location}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                        {eventSchedules.map((sch) => {
                          const isRecorded = memberAttendance.some((a) => a.scheduleId === sch.scheduleId);

                          return (
                            <div
                              key={sch.scheduleId}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                                isRecorded ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-stone-200'
                              }`}
                            >
                              <div>
                                <p className="text-xs font-bold text-stone-900">{sch.scheduleLabel}</p>
                                <p className="text-[11px] text-stone-400">{sch.date}</p>
                              </div>

                              <div>
                                {isRecorded ? (
                                  <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Recorded</span>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => onInitiateCheckIn(evt, sch)}
                                    className="py-1 px-3 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition cursor-pointer"
                                  >
                                    I'm Attending
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE HISTORY (PRIVATE TO JUAN) */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                <span>Personal Attendance Log (Strictly Private)</span>
                <span className="font-bold text-stone-900">{memberAttendance.length} records</span>
              </div>

              {memberAttendance.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">No recorded attendance entries yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {memberAttendance.map((rec) => (
                    <div key={rec.attendanceId} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-stone-50/50">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-stone-900">{rec.eventName}</span>
                          <span className="text-xs text-stone-400">•</span>
                          <span className="text-xs text-stone-600">{rec.schedule}</span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">Date: {rec.eventDate}</p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            rec.attendanceStatus === 'Present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.attendanceStatus === 'Excused'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>{rec.attendanceStatus}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <button
            onClick={onLogout}
            className="text-stone-500 hover:text-stone-800 underline font-medium cursor-pointer"
          >
            Not {member.firstName}? Switch member
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
