import React, { useEffect } from 'react';
import { X, Calendar, MapPin, Sparkles, ArrowRight, User } from 'lucide-react';
import { Announcement } from '../../types/announcement';
import { AttendanceEvent } from '../../types/event';

interface AnnouncementDetailsModalProps {
  announcement: Announcement | null;
  linkedEvent?: AttendanceEvent;
  onClose: () => void;
  onSelectLinkedEvent?: (event: AttendanceEvent) => void;
}

export const AnnouncementDetailsModal: React.FC<AnnouncementDetailsModalProps> = ({
  announcement,
  linkedEvent,
  onClose,
  onSelectLinkedEvent,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!announcement) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white backdrop-blur-md transition cursor-pointer"
          aria-label="Close Announcement"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Image */}
        {announcement.image && (
          <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-stone-100 rounded-t-3xl">
            <img
              src={announcement.image}
              alt={announcement.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {announcement.featured && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-600 text-white shadow-sm flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Circular</span>
              </div>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-stone-500">
              <span>Published: {announcement.publishDate}</span>
              {announcement.location && (
                <span className="flex items-center space-x-1 text-stone-700">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" />
                  <span>{announcement.location}</span>
                </span>
              )}
              {announcement.eventDate && (
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  <span>{announcement.eventDate}</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
              {announcement.title}
            </h2>
          </div>

          <div className="prose prose-stone max-w-none text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line border-t border-stone-100 pt-4">
            {announcement.description}
          </div>

          {/* Linked Event Callout if applicable */}
          {linkedEvent && onSelectLinkedEvent && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Linked Gathering</p>
                <h4 className="text-base font-bold text-stone-900">{linkedEvent.eventName}</h4>
                <p className="text-xs text-stone-600">{linkedEvent.startDate} • {linkedEvent.location}</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onSelectLinkedEvent(linkedEvent);
                }}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition cursor-pointer shrink-0"
              >
                <span>View Event & Schedules</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span>Issued by {announcement.createdBy || 'MCGI Youth Office'}</span>
            </div>
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
