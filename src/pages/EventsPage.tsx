import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit,
  Copy,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { AttendanceEvent, EventSchedule, EventType } from '../types/event';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { StatusBadge } from '../components/common/Badge';
import { NavItemKey } from '../components/layout/Sidebar';

interface EventsPageProps {
  onNavigateTab: (tab: NavItemKey) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onNavigateTab }) => {
  const {
    events,
    schedules,
    saveEvent,
    deleteEvent,
    saveSchedule,
    deleteSchedule,
  } = useAppData();

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AttendanceEvent | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [targetEventForSchedule, setTargetEventForSchedule] = useState<AttendanceEvent | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<EventSchedule | null>(null);

  // Deletion confirmations
  const [deleteEventTarget, setDeleteEventTarget] = useState<string | null>(null);
  const [deleteScheduleTarget, setDeleteScheduleTarget] = useState<string | null>(null);

  // Form states for Event
  const [eventForm, setEventForm] = useState<Partial<AttendanceEvent>>({
    eventName: '',
    eventType: 'Prayer Meeting',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    location: 'Main Chapel',
    description: '',
    status: 'Upcoming',
  });

  // Form states for Schedule
  const [scheduleForm, setScheduleForm] = useState<Partial<EventSchedule>>({
    date: new Date().toISOString().split('T')[0],
    startTime: '07:00 PM',
    endTime: '09:30 PM',
    scheduleLabel: '7:00 PM Service',
    location: 'Main Chapel',
    status: 'Active',
  });

  // Open Event Modal
  const handleOpenEventModal = (ev?: AttendanceEvent) => {
    if (ev) {
      setEditingEvent(ev);
      setEventForm({ ...ev });
    } else {
      setEditingEvent(null);
      setEventForm({
        eventId: `EVT-${Date.now().toString().slice(-4)}`,
        eventName: '',
        eventType: 'Prayer Meeting',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        location: 'Main Chapel',
        description: '',
        eventImage: '',
        isFeatured: false,
        isPublished: true,
        status: 'Upcoming',
      });
    }
    setIsEventModalOpen(true);
  };

  // Open Schedule Modal
  const handleOpenScheduleModal = (ev: AttendanceEvent, sc?: EventSchedule) => {
    setTargetEventForSchedule(ev);
    if (sc) {
      setEditingSchedule(sc);
      setScheduleForm({ ...sc });
    } else {
      setEditingSchedule(null);
      setScheduleForm({
        scheduleId: `SCH-${Date.now().toString().slice(-4)}`,
        eventId: ev.eventId,
        date: ev.startDate,
        startTime: '07:00 PM',
        endTime: '09:30 PM',
        scheduleLabel: '7:00 PM Batch',
        location: ev.location,
        status: 'Active',
      });
    }
    setIsScheduleModalOpen(true);
  };

  // Duplicate Schedule
  const handleDuplicateSchedule = async (sc: EventSchedule) => {
    const duplicated: EventSchedule = {
      ...sc,
      scheduleId: `SCH-${Date.now().toString().slice(-4)}`,
      scheduleLabel: `${sc.scheduleLabel} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveSchedule(duplicated);
  };

  // Save Event submit
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.eventName || !eventForm.startDate) return;

    const toSave: AttendanceEvent = {
      eventId: editingEvent ? editingEvent.eventId : (eventForm.eventId || `EVT-${Date.now().toString().slice(-4)}`),
      eventName: eventForm.eventName.trim(),
      eventType: eventForm.eventType as EventType,
      startDate: eventForm.startDate,
      endDate: eventForm.endDate || eventForm.startDate,
      location: eventForm.location || '',
      description: eventForm.description || '',
      status: eventForm.status as any || 'Upcoming',
      createdBy: editingEvent ? editingEvent.createdBy : 'Officer',
      createdAt: editingEvent ? editingEvent.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveEvent(toSave);
    setIsEventModalOpen(false);
  };

  // Save Schedule submit
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEventForSchedule || !scheduleForm.date || !scheduleForm.scheduleLabel) return;

    const toSave: EventSchedule = {
      scheduleId: editingSchedule ? editingSchedule.scheduleId : (scheduleForm.scheduleId || `SCH-${Date.now().toString().slice(-4)}`),
      eventId: targetEventForSchedule.eventId,
      date: scheduleForm.date,
      startTime: scheduleForm.startTime || '07:00 PM',
      endTime: scheduleForm.endTime || '',
      scheduleLabel: scheduleForm.scheduleLabel.trim(),
      location: scheduleForm.location || targetEventForSchedule.location,
      status: (scheduleForm.status as any) || 'Active',
      createdAt: editingSchedule ? editingSchedule.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveSchedule(toSave);
    setIsScheduleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Events & Multi-Schedule Manager</h2>
          <p className="text-xs text-slate-500">
            Create Prayer Meetings, Thanksgivings, and Worship Services with flexible dates and multiple schedules
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenEventModal()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
            <CalendarDays className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No events scheduled</h3>
            <p className="text-xs text-slate-500 mt-1">Click "Create New Event" to set up your first event.</p>
          </div>
        ) : (
          events.map((ev) => {
            const eventSchedules = schedules.filter((s) => s.eventId === ev.eventId);

            return (
              <div
                key={ev.eventId}
                className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden"
              >
                {/* Event Card Header */}
                <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{ev.eventName}</h3>
                      <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-600">
                        {ev.eventId}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {ev.eventType}
                      </span>
                      <StatusBadge status={ev.status} />
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} to ${ev.endDate}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {ev.location}
                      </span>
                      {ev.description && <span className="italic text-slate-600">"{ev.description}"</span>}
                    </div>
                  </div>

                  {/* Actions for Event */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenScheduleModal(ev)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Add Schedule</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEventModal(ev)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                      title="Edit Event"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteEventTarget(ev.eventId)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete Event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Schedules Under This Event */}
                <div className="p-4 sm:p-5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Assigned Schedules ({eventSchedules.length})
                  </h4>

                  {eventSchedules.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No schedules added yet. Click "Add Schedule" to configure service times.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {eventSchedules.map((sc) => (
                        <div
                          key={sc.scheduleId}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">{sc.scheduleLabel}</span>
                              <span className="text-[10px] font-mono text-slate-400">{sc.scheduleId}</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-600 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span>{sc.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span>{sc.startTime} {sc.endTime ? `- ${sc.endTime}` : ''}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                <span className="truncate">{sc.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* Schedule Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => onNavigateTab('attendance')}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Take Attendance</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDuplicateSchedule(sc)}
                                className="p-1 text-slate-400 hover:text-slate-700"
                                title="Duplicate Schedule"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenScheduleModal(ev, sc)}
                                className="p-1 text-slate-400 hover:text-slate-700"
                                title="Edit Schedule"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteScheduleTarget(sc.scheduleId)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="Delete Schedule"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEvent ? 'Edit Attendance Event' : 'Create New Event'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Event Name *</label>
            <input
              type="text"
              required
              value={eventForm.eventName}
              onChange={(e) => setEventForm({ ...eventForm, eventName: e.target.value })}
              placeholder="e.g. Prayer Meeting, Thanksgiving, Worship Service"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event Type *</label>
              <select
                value={eventForm.eventType}
                onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
              >
                <option value="Prayer Meeting">Prayer Meeting</option>
                <option value="Thanksgiving">Thanksgiving</option>
                <option value="Worship Service">Worship Service</option>
                <option value="Youth Activity">Youth Activity</option>
                <option value="Bible Study">Bible Study</option>
                <option value="Meeting">Meeting</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={eventForm.status}
                onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={eventForm.startDate}
                onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={eventForm.endDate}
                onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Venue</label>
            <input
              type="text"
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              placeholder="Main Chapel / Streaming Feed"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Event Banner / Photo Image URL
            </label>
            <input
              type="url"
              value={eventForm.eventImage || ''}
              onChange={(e) => setEventForm({ ...eventForm, eventImage: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Appears on public landing page and announcement cards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={eventForm.isFeatured || false}
                onChange={(e) => setEventForm({ ...eventForm, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Mark as Featured Event</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={eventForm.isPublished !== false}
                onChange={(e) => setEventForm({ ...eventForm, isPublished: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Publish on Member Landing Page</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              {editingEvent ? 'Update Event' : 'Save Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={editingSchedule ? 'Edit Event Schedule' : 'Add Schedule to Event'}
        subtitle={targetEventForSchedule?.eventName}
        maxWidth="md"
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Schedule Label * (e.g. "7:00 PM Thursday", "3:30 AM Live")
            </label>
            <input
              type="text"
              required
              value={scheduleForm.scheduleLabel}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduleLabel: e.target.value })}
              placeholder="7:00 PM Thursday"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={scheduleForm.date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="text"
                value={scheduleForm.startTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                placeholder="07:00 PM"
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Feed</label>
            <input
              type="text"
              value={scheduleForm.location}
              onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
              placeholder="Main Chapel"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              {editingSchedule ? 'Update Schedule' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Event */}
      <ConfirmDialog
        isOpen={Boolean(deleteEventTarget)}
        onClose={() => setDeleteEventTarget(null)}
        onConfirm={() => {
          if (deleteEventTarget) deleteEvent(deleteEventTarget);
        }}
        title="Delete Attendance Event?"
        message="Deleting this event will also remove its associated schedules. Historical attendance records will remain preserved."
        confirmLabel="Delete Event"
        variant="danger"
      />

      {/* Confirm Delete Schedule */}
      <ConfirmDialog
        isOpen={Boolean(deleteScheduleTarget)}
        onClose={() => setDeleteScheduleTarget(null)}
        onConfirm={() => {
          if (deleteScheduleTarget) deleteSchedule(deleteScheduleTarget);
        }}
        title="Delete Schedule?"
        message="Are you sure you want to delete this schedule?"
        confirmLabel="Delete Schedule"
        variant="danger"
      />
    </div>
  );
};
