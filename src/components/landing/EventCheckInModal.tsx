import React, { useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  User,
  X,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { AttendanceEvent, EventSchedule } from '../../types/event';
import { Member } from '../../types/member';
import { AttendanceRecord } from '../../types/attendance';

interface EventCheckInModalProps {
  event: AttendanceEvent | null;
  schedule: EventSchedule | null;
  member: Member | null;
  existingRecord?: AttendanceRecord | null;
  onClose: () => void;
  onConfirmAttendance: (params: {
    memberId: string;
    eventId: string;
    scheduleId: string;
    scheduleLabel: string;
    eventName: string;
    eventDate: string;
  }) => Promise<{ success: boolean; message: string; duplicate?: boolean }>;
  onViewMyAttendance: () => void;
}

export const EventCheckInModal: React.FC<EventCheckInModalProps> = ({
  event,
  schedule,
  member,
  existingRecord,
  onClose,
  onConfirmAttendance,
  onViewMyAttendance,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ message: string } | null>(null);
  const [duplicateState, setDuplicateState] = useState<AttendanceRecord | null>(existingRecord || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!event || !schedule || !member) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await onConfirmAttendance({
        memberId: member.memberId,
        eventId: event.eventId,
        scheduleId: schedule.scheduleId,
        scheduleLabel: schedule.scheduleLabel,
        eventName: event.eventName,
        eventDate: schedule.date,
      });

      if (res.duplicate) {
        setDuplicateState(existingRecord || ({} as AttendanceRecord));
      } else if (res.success) {
        setSuccessResult({ message: res.message });
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error recording attendance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STATE 1: ALREADY RECORDED (DUPLICATE PROTECTION) */}
        {duplicateState ? (
          <div className="text-center space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Attendance Check
              </span>
              <h3 className="text-2xl font-extrabold text-stone-900 tracking-tight">
                Already Recorded
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
                Your attendance for this schedule has already been recorded in official records.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Event:</span>
                <span className="font-bold text-stone-900">{event.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Schedule:</span>
                <span className="font-bold text-stone-900">{schedule.scheduleLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Member:</span>
                <span className="font-bold text-stone-900">{member.fullName} ({member.memberId})</span>
              </div>
              <div className="flex justify-between border-t border-amber-200/60 pt-2">
                <span className="text-stone-500 font-medium">Recorded Status:</span>
                <span className="font-bold text-emerald-700">✓ Present</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  onClose();
                  onViewMyAttendance();
                }}
                className="w-full py-3 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                View My Attendance History
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : successResult ? (
          /* STATE 2: ATTENDANCE RECORDED SUCCESSFULLY */
          <div className="text-center space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Official Check-In
              </span>
              <h3 className="text-2xl font-extrabold text-stone-900 tracking-tight">
                ✓ Attendance Recorded
              </h3>
              <p className="text-sm font-semibold text-amber-900">
                Thank you, {member.firstName}!
              </p>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                Your attendance for this gathering has been recorded and submitted to Google Sheets.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Event:</span>
                <span className="font-bold text-stone-900">{event.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Schedule:</span>
                <span className="font-bold text-stone-900">{schedule.scheduleLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Date:</span>
                <span className="font-bold text-stone-900">{schedule.date}</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2">
                <span className="text-stone-500 font-medium">Attendee:</span>
                <span className="font-bold text-stone-900">{member.fullName} ({member.memberId})</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  onClose();
                  onViewMyAttendance();
                }}
                className="w-full py-3 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                View Updated Status
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* STATE 3: CONFIRMATION SCREEN */
          <div className="space-y-6">
            <div className="text-center space-y-2 pb-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
                <Calendar className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Are You Attending?
              </span>
              <h3 className="text-2xl font-extrabold text-stone-900 tracking-tight">
                Confirm Your Attendance
              </h3>
            </div>

            {/* Attendance Details Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E6DFD5] space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="text-stone-500 font-medium">Event:</span>
                <span className="font-bold text-stone-900 text-right">{event.eventName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="text-stone-500 font-medium">Schedule:</span>
                <span className="font-bold text-stone-900 text-right flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700 inline" />
                  <span>{schedule.scheduleLabel}</span>
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="text-stone-500 font-medium">Date:</span>
                <span className="font-bold text-stone-900 text-right">{schedule.date}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Member:</span>
                <span className="font-bold text-stone-900 text-right">
                  {member.fullName} <span className="text-stone-400 font-normal">({member.memberId})</span>
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Recording...</span>
                ) : (
                  <>
                    <span>Confirm Attendance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
