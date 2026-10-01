import React, { useEffect } from 'react';
import { X, Calendar, MapPin, Clock, CheckCircle, ArrowRight, Shield } from 'lucide-react';
import { AttendanceEvent, EventSchedule } from '../../types/event';
import { Member } from '../../types/member';
import { AttendanceRecord } from '../../types/attendance';

interface EventDetailsModalProps {
  event: AttendanceEvent | null;
  schedules: EventSchedule[];
  activeMember: Member | null;
  attendanceRecords: AttendanceRecord[];
  onClose: () => void;
  onInitiateCheckIn: (event: AttendanceEvent, schedule: EventSchedule) => void;
  onOpenSearch: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  schedules,
  activeMember,
  attendanceRecords,
  onClose,
  onInitiateCheckIn,
  onOpenSearch,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const eventSchedules = schedules.filter((s) => s.eventId === event.eventId && s.status === 'Active');
  const defaultPlaceholder =
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white backdrop-blur-md transition cursor-pointer"
          aria-label="Close Event Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image */}
        <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-stone-100 rounded-t-3xl">
          <img
            src={event.eventImage || defaultPlaceholder}
            alt={event.eventName}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultPlaceholder;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute bottom-4 left-6 right-6 text-white space-y-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-700 text-amber-50">
              {event.eventType}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
              {event.eventName}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Metadata bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-600 pb-4 border-b border-stone-100">
            <span className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-amber-700" />
              <span>
                {event.startDate}
                {event.endDate && event.endDate !== event.startDate ? ` to ${event.endDate}` : ''}
              </span>
            </span>
            <span className="flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-amber-700" />
              <span>{event.location}</span>
            </span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">About this Gathering</h4>
            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
              {event.description || 'Congregational gathering for spiritual encouragement and praise.'}
            </p>
          </div>

          {/* Schedules list */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Available Schedules</h4>
              <span className="text-xs text-stone-400">{eventSchedules.length} batch(es)</span>
            </div>

            <div className="space-y-3">
              {eventSchedules.map((sch) => {
                const isAttended =
                  activeMember &&
                  attendanceRecords.some(
                    (a) => a.memberId === activeMember.memberId && a.scheduleId === sch.scheduleId
                  );

                return (
                  <div
                    key={sch.scheduleId}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isAttended
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-stone-50 hover:bg-stone-100/70 border-stone-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span className="text-sm font-bold text-stone-900">{sch.scheduleLabel}</span>
                        {isAttended && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                            Confirmed Attending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-stone-500 pl-6">
                        <span>Date: {sch.date}</span>
                        <span>•</span>
                        <span>Location: {sch.location}</span>
                      </div>
                    </div>

                    <div>
                      {isAttended ? (
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-xl">
                          <CheckCircle className="w-4 h-4" />
                          <span>Attendance Recorded</span>
                        </div>
                      ) : activeMember ? (
                        <button
                          onClick={() => {
                            onClose();
                            onInitiateCheckIn(event, sch);
                          }}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                        >
                          I'm Attending
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenSearch();
                          }}
                          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-stone-200 hover:bg-amber-100 text-stone-700 hover:text-amber-900 text-xs font-bold transition cursor-pointer"
                        >
                          Identify & Attend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
            <span>MCGI Youth Attendance System</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
