import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Calendar,
  CheckCircle,
  FileText,
  Search,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Announcement, AnnouncementStatus } from '../types/announcement';
import { useAuth } from '../context/AuthContext';
import { ImageInputControl } from '../components/common/ImageInputControl';

export const AnnouncementsPage: React.FC = () => {
  const { announcements, events, saveAnnouncement, deleteAnnouncement } = useAppData();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AnnouncementStatus>('All');
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateNew = () => {
    const newId = `ANN-${new Date().getFullYear()}-${String(announcements.length + 1).padStart(3, '0')}`;
    setEditingAnnouncement({
      announcementId: newId,
      title: '',
      description: '',
      image: '',
      publishDate: new Date().toISOString().split('T')[0],
      startDisplayDate: new Date().toISOString().split('T')[0],
      endDisplayDate: '',
      location: 'Ascoville Youth Center / Main Sanctuary',
      eventDate: '',
      linkedEventId: '',
      status: 'Published',
      featured: false,
      createdBy: user?.fullName || 'Ascoville Youth Officer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleEdit = (ann: Announcement) => {
    setEditingAnnouncement({ ...ann });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      const res = await deleteAnnouncement(id);
      if (res.success) {
        setNotification({ message: 'Announcement deleted.', type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      }
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;

    if (!editingAnnouncement.title.trim()) {
      alert('Please provide an announcement title.');
      return;
    }

    const res = await saveAnnouncement(editingAnnouncement);
    if (res.success) {
      setNotification({ message: 'Announcement saved successfully.', type: 'success' });
      setIsModalOpen(false);
      setEditingAnnouncement(null);
      setTimeout(() => setNotification(null), 3000);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-amber-600" />
            <span>Digital Announcements Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, publish, and manage digital circulars displayed on the public youth landing page.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars by title or keyword..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {(['All', 'Published', 'Draft', 'Archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnnouncements.map((ann) => (
          <div
            key={ann.announcementId}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition"
          >
            <div>
              {/* Image Preview */}
              <div className="relative h-40 bg-slate-100 overflow-hidden">
                {ann.image ? (
                  <img src={ann.image} alt={ann.title} className="w-full h-full object-cover object-center" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <FileText className="w-8 h-8 mb-1 opacity-50" />
                    <span className="text-[11px]">No image configured</span>
                  </div>
                )}

                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      ann.status === 'Published'
                        ? 'bg-emerald-600 text-white'
                        : ann.status === 'Draft'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-600 text-white'
                    }`}
                  >
                    {ann.status}
                  </span>
                  {ann.featured && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white flex items-center space-x-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Featured</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{ann.announcementId}</span>
                  <span>{ann.publishDate}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{ann.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ann.description}</p>

                {ann.eventDate && (
                  <div className="text-[11px] text-amber-800 font-semibold flex items-center space-x-1 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{ann.eventDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                By {ann.createdBy || 'Admin'}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleEdit(ann)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-200 transition cursor-pointer"
                  title="Edit Announcement"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(ann.announcementId)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Announcement Modal */}
      {isModalOpen && editingAnnouncement && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {announcements.some((a) => a.announcementId === editingAnnouncement.announcementId)
                  ? 'Edit Announcement'
                  : 'Create New Announcement'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Announcement ID</label>
                  <input
                    type="text"
                    disabled
                    value={editingAnnouncement.announcementId}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 font-mono text-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Status</label>
                  <select
                    value={editingAnnouncement.status}
                    onChange={(e) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        status: e.target.value as AnnouncementStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 outline-none"
                  >
                    <option value="Published">Published (Visible to Members)</option>
                    <option value="Draft">Draft (Admin Only)</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Title</label>
                <input
                  type="text"
                  required
                  value={editingAnnouncement.title}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                  placeholder="e.g. Ascoville Youth Thanksgiving & Praise Gathering"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-blue-600 outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Description</label>
                <textarea
                  rows={4}
                  required
                  value={editingAnnouncement.description}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, description: e.target.value })}
                  placeholder="Enter the complete text of the circular, guidelines, and message..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-700 uppercase">Banner / Cover Image</label>
                <ImageInputControl
                  label="Announcement Banner Image"
                  sublabel="Upload a photo from your computer or enter an image URL"
                  value={editingAnnouncement.image || ''}
                  onChange={(val) => setEditingAnnouncement({ ...editingAnnouncement, image: val })}
                  aspectRatioClass="aspect-[16/9]"
                  maxWidth={1200}
                  maxHeight={800}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Publish Date</label>
                  <input
                    type="date"
                    value={editingAnnouncement.publishDate}
                    onChange={(e) =>
                      setEditingAnnouncement({ ...editingAnnouncement, publishDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Event Date / Label</label>
                  <input
                    type="text"
                    value={editingAnnouncement.eventDate || ''}
                    onChange={(e) =>
                      setEditingAnnouncement({ ...editingAnnouncement, eventDate: e.target.value })
                    }
                    placeholder="e.g. October 10, 2026"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Location</label>
                  <input
                    type="text"
                    value={editingAnnouncement.location || ''}
                    onChange={(e) =>
                      setEditingAnnouncement({ ...editingAnnouncement, location: e.target.value })
                    }
                    placeholder="e.g. Main Sanctuary"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase">Linked Gathering (Optional)</label>
                  <select
                    value={editingAnnouncement.linkedEventId || ''}
                    onChange={(e) =>
                      setEditingAnnouncement({ ...editingAnnouncement, linkedEventId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 outline-none"
                  >
                    <option value="">None (Standalone Circular)</option>
                    {events.map((ev) => (
                      <option key={ev.eventId} value={ev.eventId}>
                        {ev.eventName} ({ev.startDate})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="featured-check"
                    checked={editingAnnouncement.featured}
                    onChange={(e) =>
                      setEditingAnnouncement({ ...editingAnnouncement, featured: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="featured-check" className="font-semibold text-slate-800 cursor-pointer">
                    Feature on Hero / Top of Board
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer"
                >
                  Save Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
