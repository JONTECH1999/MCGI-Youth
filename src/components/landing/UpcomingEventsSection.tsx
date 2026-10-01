import React from 'react';
import { Calendar, Clock, MapPin, CheckCircle, ArrowRight, Sparkles, UserCheck } from 'lucide-react';
import { AttendanceEvent, EventSchedule } from '../../types/event';
import { Member } from '../../types/member';
import { AttendanceRecord } from '../../types/attendance';

interface UpcomingEventsSectionProps {
  events: AttendanceEvent[];
  schedules: EventSchedule[];
  activeMember: Member | null;
  attendanceRecords: AttendanceRecord[];
  onSelectEvent: (event: AttendanceEvent) => void;
  onInitiateCheckIn: (event: AttendanceEvent, schedule: EventSchedule) => void;
  onOpenSearch: () => void;
}

export const UpcomingEventsSection: React.FC<UpcomingEventsSectionProps> = ({
  events,
  schedules,
  activeMember,
  attendanceRecords,
  onSelectEvent,
  onInitiateCheckIn,
  onOpenSearch,
}) => {
  // Filter active/upcoming events
  const publishedEvents = events.filter((e) => e.isPublished !== false);

  const defaultEventPlaceholder =
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80';

  // Helper to check if active member has attended any schedule of this event
  const getMemberEventAttendance = (eventId: string) => {
    if (!activeMember) return null;
    return attendanceRecords.find((a) => a.memberId === activeMember.memberId && a.eventId === eventId);
  };

  return (
    <section id="upcoming-events" className="py-20 bg-stone-100/70 border-y border-[#E6DFD5] bg-sandstone-grain scroll-entry-reveal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/60 text-xs font-bold tracking-wider uppercase shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
              <span>Schedules & Congregational Assemblies</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Upcoming Gatherings & Sacred Services
            </h2>
            <p className="text-stone-600 text-sm sm:text-base max-w-2xl leading-relaxed">
              Prayer meetings, Thanksgiving assemblies, and youth community activities. Choose your convenient schedule batch.
            </p>
          </div>

          {activeMember ? (
            <div className="flex items-center space-x-2.5 text-xs font-bold text-emerald-900 bg-emerald-50/90 px-4 py-2.5 rounded-2xl border border-emerald-300/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-beacon-green" />
              <span>Checking in as: <span className="font-extrabold text-emerald-800">{activeMember.fullName}</span></span>
            </div>
          ) : (
            <button
              onClick={onOpenSearch}
              className="btn-shimmer inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-extrabold transition-all duration-200 shadow-md hover:shadow-amber-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer self-start md:self-auto"
            >
              <span>Identify Yourself to Check In</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </button>
          )}
        </div>

        {/* Events Cards List */}
        <div className="space-y-8">
          {publishedEvents.map((evt, evtIdx) => {
            const eventSchedules = schedules.filter((s) => s.eventId === evt.eventId && s.status === 'Active');
            const memberAttendance = getMemberEventAttendance(evt.eventId);

            return (
              <div
                key={evt.eventId}
                style={{ animationDelay: `${evtIdx * 100}ms` }}
                className="group relative bg-white rounded-3xl border border-[#E6DFD5] hover:border-amber-500/70 card-alive overflow-hidden shadow-xs"
              >
                {/* Diagonal Hover Sheen */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Event Visual Column */}
                  <div className="lg:col-span-4 relative min-h-[240px] lg:min-h-full bg-stone-900 overflow-hidden">
                    <img
                      src={evt.eventImage || defaultEventPlaceholder}
                      alt={evt.eventName}
                      className="w-full h-full object-cover object-center transform group-hover:scale-108 transition-transform duration-700 ease-out"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultEventPlaceholder;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/75 via-black/30 to-transparent" />

                    {/* Event Type & Status Badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-800/90 text-amber-100 border border-amber-500/40 shadow-xs backdrop-blur-xs">
                        {evt.eventType}
                      </span>
                      {evt.status === 'Ongoing' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-white animate-beacon-green" />
                          <span>Happening Now</span>
                        </span>
                      )}
                    </div>

                    {/* Date Badge overlay on Mobile/Tablet */}
                    <div className="absolute bottom-4 left-4 text-white text-xs font-bold flex items-center space-x-2 drop-shadow-md bg-stone-950/70 px-3 py-1.5 rounded-xl backdrop-blur-xs border border-white/20">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span>{evt.startDate}</span>
                      {evt.endDate && evt.endDate !== evt.startDate && <span>– {evt.endDate}</span>}
                    </div>
                  </div>

                  {/* Event Details & Schedules Column */}
                  <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-2xl font-black text-stone-900 group-hover:text-amber-800 transition-colors tracking-tight">
                          {evt.eventName}
                        </h3>

                        {/* Attendance State Indicator */}
                        {memberAttendance && (
                          <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ATTENDED ({memberAttendance.schedule})</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-500">
                        <span className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="text-stone-700 font-semibold">{evt.location}</span>
                        </span>
                        <span className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{eventSchedules.length} schedule batch(es) available</span>
                        </span>
                      </div>

                      <p className="text-stone-600 text-sm leading-relaxed max-w-3xl">
                        {evt.description || 'Congregational assembly with prayers, spiritual lessons, and hymns.'}
                      </p>
                    </div>

                    {/* Schedule Badges / Cards */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center space-x-1.5">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Select Your Schedule Batch:</span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {eventSchedules.map((sch) => {
                          const isRecordedForThisSchedule =
                            activeMember &&
                            attendanceRecords.some(
                              (a) => a.memberId === activeMember.memberId && a.scheduleId === sch.scheduleId
                            );

                          return (
                            <div
                              key={sch.scheduleId}
                              className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-2.5 hover:-translate-y-1 hover:shadow-md ${
                                isRecordedForThisSchedule
                                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
                                  : 'bg-stone-50/90 hover:bg-white border-stone-200/90 hover:border-amber-400/80 shadow-2xs'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-stone-900">{sch.scheduleLabel}</span>
                                  {isRecordedForThisSchedule ? (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-beacon-green" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-stone-400" />
                                  )}
                                </div>
                                <p className="text-[11px] font-medium text-amber-800 mt-0.5">{sch.date}</p>
                                <p className="text-[10px] text-stone-400 truncate">{sch.location}</p>
                              </div>

                              <div>
                                {isRecordedForThisSchedule ? (
                                  <div className="w-full py-1.5 px-2 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold text-center border border-emerald-300 flex items-center justify-center space-x-1">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Recorded</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => onInitiateCheckIn(evt, sch)}
                                    className="btn-shimmer w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white transition-all duration-200 cursor-pointer hover:shadow-md hover:shadow-amber-900/30 active:scale-95 shadow-2xs flex items-center justify-center space-x-1"
                                  >
                                    <span>Attend Schedule</span>
                                    <ArrowRight className="w-3 h-3 text-amber-200" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() => onSelectEvent(evt)}
                        className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-amber-800 hover:text-amber-950 cursor-pointer group/link"
                      >
                        <span>View Full Gathering Information</span>
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover/link:translate-x-1 transition-transform" />
                      </button>

                      <div className="text-[11px] font-medium text-stone-400 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Attendance verified & saved directly to official database</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
