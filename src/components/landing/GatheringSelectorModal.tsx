import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  Users,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Shield,
} from 'lucide-react';
import {
  RegularGatheringSlot,
  LOKAL_REGULAR_SCHEDULES,
  compareRegularGatheringSlots,
  getAutomatedGatheringSlot,
} from '../../data/lokalSchedule';

interface GatheringSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: RegularGatheringSlot;
  onSelectSlot: (slot: RegularGatheringSlot, isManual: boolean) => void;
  isManualOverride: boolean;
}

export const GatheringSelectorModal: React.FC<GatheringSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedSlot,
  onSelectSlot,
  isManualOverride,
}) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Prayer Meeting' | 'Worship Service' | 'Thanksgiving'>('All');

  if (!isOpen) return null;

  const filteredSlots = LOKAL_REGULAR_SCHEDULES.filter((s) => {
    if (activeTab === 'All') return true;
    return s.eventType === activeTab;
  }).sort(compareRegularGatheringSlots);

  const handleResetToAuto = () => {
    const auto = getAutomatedGatheringSlot();
    onSelectSlot(auto.slot, false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200 bg-stone-50/80">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-bold text-stone-900">
                <Calendar className="w-5 h-5 text-amber-800" />
                MCGI Ascoville Gathering Schedule
              </h3>
              <p className="text-xs text-stone-500">
                Pick your preferred gathering batch to mark attendance or view duty assignments.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Auto Reset Option */}
          <div className="flex items-center justify-between pt-2 text-xs">
            <div className="flex items-center gap-1.5 text-stone-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                Current schedule mode:{' '}
                <strong className={isManualOverride ? 'text-amber-800' : 'text-emerald-700'}>
                  {isManualOverride ? 'Custom Selected' : 'Automated (Live Schedule)'}
                </strong>
              </span>
            </div>
            {isManualOverride && (
              <button
                type="button"
                onClick={handleResetToAuto}
                className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
              >
                Reset to Automated Slot
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-stone-200 overflow-x-auto pb-1">
            {(['All', 'Prayer Meeting', 'Worship Service', 'Thanksgiving'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Slots List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-stone-100 space-y-3">
          {filteredSlots.map((slot) => {
            const isSelected = selectedSlot.slotId === slot.slotId;

            return (
              <div
                key={slot.slotId}
                onClick={() => {
                  onSelectSlot(slot, true);
                  onClose();
                }}
                className={`pt-3 first:pt-0 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
                    : 'bg-white hover:bg-stone-50 border-stone-200 hover:border-amber-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Timing & Gathering Type */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-stone-900 text-white font-bold text-xs uppercase tracking-wider">
                        {slot.dayFullName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-extrabold text-stone-900">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        {slot.time}
                      </span>
                      {slot.hasZoom && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Video className="w-3 h-3" />
                          w/ Zoom
                        </span>
                      )}
                      <span className="text-xs font-semibold text-stone-500">
                        • {slot.eventType}
                      </span>
                    </div>

                    {/* Duty Roster Details */}
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-stone-50 rounded-lg p-2 border border-stone-100">
                        <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          MPRO Incharge
                        </span>
                        <span className="font-semibold text-stone-800">
                          {slot.mproIncharge}
                        </span>
                      </div>
                      <div className="bg-stone-50 rounded-lg p-2 border border-stone-100">
                        <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          Officers Assigned
                        </span>
                        <span className="font-semibold text-stone-800">
                          {slot.officersAssigned}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Select Action */}
                  <div className="flex items-center sm:self-center shrink-0">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-800 text-white text-xs font-bold shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-amber-800 text-stone-700 hover:text-white text-xs font-bold transition shadow-2xs"
                      >
                        <span>Select</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Local of Ascoville • Congregational Worship & Prayer Meeting Schedule</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
