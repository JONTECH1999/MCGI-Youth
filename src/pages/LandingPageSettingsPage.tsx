import React, { useState } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  Save,
  CheckCircle,
  Eye,
  ShieldCheck,
  Layout,
  Bell,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  FileText,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { LandingPageConfig, ThemePalette, VerificationMethod, GatheringItem } from '../types/landingPage';
import { Announcement, AnnouncementStatus } from '../types/announcement';
import { useAuth } from '../context/AuthContext';
import { ImageInputControl, ImagePreset } from '../components/common/ImageInputControl';
import { DEFAULT_LANDING_PAGE_CONFIG, DEFAULT_GATHERINGS } from '../data/defaultLandingPage';

interface LandingPageSettingsPageProps {
  onPreviewPublic: () => void;
}

type SettingsTab = 'images' | 'announcements' | 'content' | 'theme';

export const LandingPageSettingsPage: React.FC<LandingPageSettingsPageProps> = ({ onPreviewPublic }) => {
  const {
    landingPageConfig,
    saveLandingPageConfig,
    events,
    announcements,
    saveAnnouncement,
    deleteAnnouncement,
  } = useAppData();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('images');
  const [formData, setFormData] = useState<LandingPageConfig>({ ...landingPageConfig });
  const [eventImageToAdd, setEventImageToAdd] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Announcement Modal State
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Quick Replace Image modal for a specific announcement
  const [quickImageAnnouncement, setQuickImageAnnouncement] = useState<Announcement | null>(null);

  // Presets for Hero Banner
  const heroPresets: ImagePreset[] = [
    {
      label: 'Warm Community Gathering',
      url: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1920&q=80',
    },
    {
      label: 'Sacred Sanctuary Atmosphere',
      url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1920&q=80',
    },
    {
      label: 'Youth Fellowship & Energy',
      url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1920&q=80',
    },
    {
      label: 'Serene Sunset Praises',
      url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1920&q=80',
    },
  ];

  // Presets for About Section
  const aboutPresets: ImagePreset[] = [
    {
      label: 'Youth Fellowship Circle',
      url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80',
    },
    {
      label: 'Bible Study & Contemplation',
      url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1000&q=80',
    },
    {
      label: 'Joyful Service Group',
      url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1000&q=80',
    },
    {
      label: 'Acoustic Praise & Choir',
      url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1000&q=80',
    },
  ];

  // Presets for Process / Protocol Section
  const processPresets: ImagePreset[] = [
    {
      label: 'Architectural Order & Pillar',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    },
    {
      label: 'Orderly Congregation',
      url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80',
    },
    {
      label: 'Digital Service & Tech',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    },
    {
      label: 'Spiritual Peace',
      url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const res = await saveLandingPageConfig(formData);
    setIsSaving(false);
    if (res.success) {
      setNotification({ message: 'Landing page settings and images updated and saved!', type: 'success' });
      setTimeout(() => setNotification(null), 3500);
    } else {
      setNotification({ message: res.message || 'Failed to save configuration.', type: 'error' });
    }
  };

  // Create New Announcement
  const handleOpenNewAnnouncement = () => {
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
    setIsAnnouncementModalOpen(true);
  };

  // Edit Announcement
  const handleEditAnnouncement = (ann: Announcement) => {
    setEditingAnnouncement({ ...ann });
    setIsAnnouncementModalOpen(true);
  };

  // Save Announcement
  const handleSaveAnnouncementForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;

    if (!editingAnnouncement.title.trim()) {
      alert('Please enter an announcement title.');
      return;
    }

    const res = await saveAnnouncement(editingAnnouncement);
    if (res.success) {
      setNotification({ message: 'Announcement saved and updated on landing page!', type: 'success' });
      setIsAnnouncementModalOpen(false);
      setEditingAnnouncement(null);
      setTimeout(() => setNotification(null), 3500);
    } else {
      alert(res.message);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement from the landing page?')) {
      const res = await deleteAnnouncement(id);
      if (res.success) {
        setNotification({ message: 'Announcement removed from landing page.', type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      }
    }
  };

  // Save Quick Image Replace for an announcement
  const handleSaveQuickImage = async (newImageUrl: string) => {
    if (!quickImageAnnouncement) return;
    const updated = {
      ...quickImageAnnouncement,
      image: newImageUrl,
      updatedAt: new Date().toISOString(),
    };
    await saveAnnouncement(updated);
    setQuickImageAnnouncement(null);
    setNotification({ message: `Updated image for "${updated.title}"`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  // Gathering list for editing
  const currentGatherings: GatheringItem[] =
    formData.gatherings && formData.gatherings.length > 0
      ? formData.gatherings
      : DEFAULT_GATHERINGS;

  const handleAddGathering = () => {
    const list = formData.gatherings && formData.gatherings.length > 0 ? formData.gatherings : [...DEFAULT_GATHERINGS];
    const newIdx = list.length + 1;
    const newNum = String(newIdx).padStart(2, '0');
    const newItem: GatheringItem = {
      id: `gath-${Date.now()}`,
      num: newNum,
      title: 'New Sacred Gathering',
      subtitle: 'Congregational Assembly',
      date: 'Weekly Gathering / Schedule',
      desc: 'Regular congregational gathering for prayer, spiritual guidance, and active fellowship.',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
      type: 'special_event',
    };
    setFormData({ ...formData, gatherings: [...list, newItem] });
  };

  const handleUpdateGathering = (index: number, updated: Partial<GatheringItem>) => {
    const list = [...(formData.gatherings && formData.gatherings.length > 0 ? formData.gatherings : DEFAULT_GATHERINGS)];
    list[index] = { ...list[index], ...updated };
    setFormData({ ...formData, gatherings: list });
  };

  const handleDeleteGathering = (index: number) => {
    const list = formData.gatherings && formData.gatherings.length > 0 ? formData.gatherings : [...DEFAULT_GATHERINGS];
    if (list.length <= 1) {
      alert('You must keep at least one gathering card configured.');
      return;
    }
    const toRemove = list[index];
    if (window.confirm(`Are you sure you want to remove gathering "${toRemove.title}"?`)) {
      const filtered = list.filter((_, idx) => idx !== index);
      setFormData({ ...formData, gatherings: filtered });
    }
  };

  const handleMoveGathering = (index: number, direction: 'up' | 'down') => {
    const list = [...(formData.gatherings && formData.gatherings.length > 0 ? formData.gatherings : DEFAULT_GATHERINGS)];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setFormData({ ...formData, gatherings: list });
  };

  const handleResetGatherings = () => {
    if (window.confirm('Reset all gathering cards back to the default 4 primary assemblies?')) {
      setFormData({ ...formData, gatherings: DEFAULT_GATHERINGS });
    }
  };

  const heroImages = formData.heroImages?.length
    ? formData.heroImages
    : [formData.heroImageUrl || DEFAULT_LANDING_PAGE_CONFIG.heroImageUrl];

  const updateHeroImages = (images: string[]) => {
    setFormData({ ...formData, heroImages: images, heroImageUrl: images[0] || DEFAULT_LANDING_PAGE_CONFIG.heroImageUrl });
  };

  const addEventHeroImage = () => {
    const event = events.find((item) => item.eventId === eventImageToAdd);
    if (!event?.eventImage || heroImages.length >= 5) return;
    updateHeroImages([...heroImages, event.eventImage]);
    setEventImageToAdd('');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layout className="w-6 h-6 text-amber-600" />
            <span>Landing Page Settings & Media Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Replace and customize hero imagery, section photos, and digital circulars displayed on the public member landing page.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onPreviewPublic}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>View Public Page</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition shadow-sm cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'images'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-amber-600" />
          <span>Landing Page Images</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Bell className="w-4 h-4 text-blue-600" />
          <span>Announcements on Landing Page ({announcements.filter((a) => a.status !== 'Archived').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'content'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Hero & Branding Text</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'theme'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Palette className="w-4 h-4 text-emerald-600" />
          <span>Security & Theme</span>
        </button>
      </div>

      {/* TAB 1: LANDING PAGE IMAGES */}
      {activeTab === 'images' && (
        <div className="space-y-6">
          {/* Hero Banner Images */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rotating Hero Background Images</h3>
                  <p className="text-xs text-slate-500">
                    Add up to five photos. The homepage fades between them automatically, including photos from past events.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {heroImages.map((image, index) => (
                <div key={`${index}-${image.slice(0, 32)}`}>
                  <ImageInputControl
                    label={`Hero Slide ${index + 1}`}
                    sublabel="Upload an event photo or paste a publicly accessible image link."
                    value={image}
                    defaultValue={index === 0 ? DEFAULT_LANDING_PAGE_CONFIG.heroImageUrl : undefined}
                    onChange={(value) => {
                      const nextImages = [...heroImages];
                      nextImages[index] = value;
                      updateHeroImages(nextImages);
                    }}
                    aspectRatioClass="aspect-video"
                    presets={index === 0 ? heroPresets : undefined}
                    maxWidth={1920}
                    maxHeight={1080}
                  />
                  {heroImages.length > 1 && (
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => updateHeroImages(heroImages.filter((_, imageIndex) => imageIndex !== index))}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                        title={`Remove hero slide ${index + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove slide
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={eventImageToAdd}
                onChange={(event) => setEventImageToAdd(event.target.value)}
                disabled={heroImages.length >= 5}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs"
              >
                <option value="">Add a photo from an event...</option>
                {events.filter((event) => event.eventImage).map((event) => (
                  <option key={event.eventId} value={event.eventId}>
                    {event.eventName} ({event.startDate})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addEventHeroImage}
                disabled={!eventImageToAdd || heroImages.length >= 5}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-bronze-600 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Event Photo
              </button>
            </div>
          </div>

          {/* Section 2: Narrative "The Locale Story" Image */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">About Section Photo ("The Locale Story")</h3>
                  <p className="text-xs text-slate-500">
                    The editorial photo beside the locale narrative and mission statement.
                  </p>
                </div>
              </div>
            </div>

            <ImageInputControl
              label="Locale Story Image"
              sublabel="Upload a photo of youth fellowship, Bible study, or service activities."
              value={formData.aboutImageUrl || DEFAULT_LANDING_PAGE_CONFIG.aboutImageUrl || ''}
              defaultValue={DEFAULT_LANDING_PAGE_CONFIG.aboutImageUrl}
              onChange={(val) => setFormData({ ...formData, aboutImageUrl: val })}
              aspectRatioClass="aspect-[4/3]"
              presets={aboutPresets}
              maxWidth={1200}
              maxHeight={900}
            />
          </div>

          {/* Section 3: Process Section Image */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Check-In Protocol Background Photo</h3>
                  <p className="text-xs text-slate-500">
                    The atmospheric background image in the 3-step check-in guide section.
                  </p>
                </div>
              </div>
            </div>

            <ImageInputControl
              label="Check-In Guide Banner Image"
              sublabel="Upload an architectural, sanctuary, or church sanctuary photo."
              value={formData.processImageUrl || DEFAULT_LANDING_PAGE_CONFIG.processImageUrl || ''}
              defaultValue={DEFAULT_LANDING_PAGE_CONFIG.processImageUrl}
              onChange={(val) => setFormData({ ...formData, processImageUrl: val })}
              aspectRatioClass="aspect-[16/9]"
              presets={processPresets}
              maxWidth={1400}
              maxHeight={800}
            />
          </div>

          {/* Section 4: Sacred Gatherings Cards */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Sacred Gatherings Cards (Homepage Assembly Showcase)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Customize the gathering cards shown on the homepage. Add new assemblies, name them, set their schedule/dates, and upload or replace their cover photos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetGatherings}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Reset back to default 4 primary gatherings"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset to Default 4</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddGathering}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Gathering</span>
                </button>
              </div>
            </div>

            {/* List of Gathering Cards */}
            <div className="space-y-6">
              {currentGatherings.map((g, index) => (
                <div
                  key={g.id || index}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 hover:border-amber-400/60 transition shadow-2xs"
                >
                  {/* Gathering Card Header Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-amber-700 text-white flex items-center justify-center font-mono font-bold text-xs shadow-2xs">
                        {g.num || String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{g.title || 'Untitled Gathering'}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          {g.date && (
                            <span className="flex items-center gap-1 text-amber-800 font-semibold">
                              <Calendar className="w-3 h-3" />
                              <span>{g.date}</span>
                            </span>
                          )}
                          {g.subtitle && <span>• {g.subtitle}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveGathering(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveGathering(index, 'down')}
                        disabled={index === currentGatherings.length - 1}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGathering(index)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer ml-1"
                        title="Delete Gathering Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Gathering Card Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Left 7 cols: Text Details */}
                    <div className="md:col-span-7 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-slate-700 uppercase">
                            Gathering Name / Title
                          </label>
                          <input
                            type="text"
                            value={g.title}
                            onChange={(e) => handleUpdateGathering(index, { title: e.target.value })}
                            placeholder="e.g. Prayer Meeting, Youth Christian Fellowship"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 focus:border-amber-600 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 uppercase">
                            Card Badge / Number
                          </label>
                          <input
                            type="text"
                            value={g.num || String(index + 1).padStart(2, '0')}
                            onChange={(e) => handleUpdateGathering(index, { num: e.target.value })}
                            placeholder="e.g. 01, 05"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono font-bold text-slate-900 focus:border-amber-600 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Schedule / Gathering Date</span>
                          </label>
                          <input
                            type="text"
                            value={g.date || ''}
                            onChange={(e) => handleUpdateGathering(index, { date: e.target.value })}
                            placeholder="e.g. Every Wednesday & Thursday or Oct 20"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold focus:border-amber-600 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 uppercase">
                            Subtitle / Category Tagline
                          </label>
                          <input
                            type="text"
                            value={g.subtitle || ''}
                            onChange={(e) => handleUpdateGathering(index, { subtitle: e.target.value })}
                            placeholder="e.g. Midweek Spiritual Edification"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-amber-600 outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 uppercase">
                          Short Description / Purpose
                        </label>
                        <textarea
                          rows={2}
                          value={g.desc || ''}
                          onChange={(e) => handleUpdateGathering(index, { desc: e.target.value })}
                          placeholder="Brief encouraging summary of this gathering..."
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-amber-600 outline-none text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 uppercase">
                          Linked Official Event (Optional)
                        </label>
                        <select
                          value={g.linkedEventId || ''}
                          onChange={(e) => handleUpdateGathering(index, { linkedEventId: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 outline-none"
                        >
                          <option value="">None (Auto-match by gathering name or type)</option>
                          {events.map((ev) => (
                            <option key={ev.eventId} value={ev.eventId}>
                              {ev.eventName} ({ev.startDate})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Right 5 cols: Cover Photo ImageInputControl */}
                    <div className="md:col-span-5">
                      <ImageInputControl
                        label={`Cover Photo: ${g.title || 'Gathering'}`}
                        sublabel="Upload photo from device or paste link"
                        value={g.image || ''}
                        onChange={(val) => handleUpdateGathering(index, { image: val })}
                        aspectRatioClass="aspect-[4/3]"
                        maxWidth={1000}
                        maxHeight={800}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Add Gathering bar */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddGathering}
                className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-amber-600/40 hover:border-amber-600 hover:bg-amber-50/40 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-700" />
                <span>Add Another Sacred Gathering Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANNOUNCEMENTS ON LANDING PAGE */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Section Configuration */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span>Landing Page Announcement Board Display</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Control the visibility, titles, and which circulars are featured on the public homepage.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showAnnouncements !== false}
                    onChange={(e) => setFormData({ ...formData, showAnnouncements: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2.5 text-xs font-bold text-slate-700">
                    {formData.showAnnouncements !== false ? 'Section Visible' : 'Section Hidden'}
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Board Section Title</label>
                <input
                  type="text"
                  value={formData.announcementsTitle || 'Digital Announcement Board.'}
                  onChange={(e) => setFormData({ ...formData, announcementsTitle: e.target.value })}
                  placeholder="e.g. Digital Announcement Board."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Board Category Subtitle</label>
                <input
                  type="text"
                  value={formData.announcementsSubtitle || 'Perspectives & Circulars'}
                  onChange={(e) => setFormData({ ...formData, announcementsSubtitle: e.target.value })}
                  placeholder="e.g. Perspectives & Circulars"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Spotlight / Featured Circular</label>
                <select
                  value={formData.featuredAnnouncementId || ''}
                  onChange={(e) => setFormData({ ...formData, featuredAnnouncementId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 outline-none"
                >
                  <option value="">Auto-prioritize most recent circular</option>
                  {announcements.map((ann) => (
                    <option key={ann.announcementId} value={ann.announcementId}>
                      {ann.featured ? '★ ' : ''}
                      {ann.title} ({ann.publishDate})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Announcements List & Quick Image Replace */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Active Announcements & Their Images
                </h3>
                <p className="text-xs text-slate-500">
                  Click on any announcement image to replace it, or edit circular details.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenNewAnnouncement}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Announcement to Board</span>
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No announcements yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Add your first announcement to display on the landing page.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.map((ann) => {
                  const isFeatured =
                    formData.featuredAnnouncementId === ann.announcementId || ann.featured;
                  return (
                    <div
                      key={ann.announcementId}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isFeatured
                          ? 'border-amber-400 bg-amber-50/30 ring-1 ring-amber-400/40'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Image Preview with Replace Overlay */}
                        <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                          {ann.image ? (
                            <img
                              src={ann.image}
                              alt={ann.title}
                              className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                              <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                              <span className="text-[11px] font-medium">No banner image set</span>
                            </div>
                          )}

                          {/* Quick Replace Overlay Button */}
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                            <button
                              type="button"
                              onClick={() => setQuickImageAnnouncement(ann)}
                              className="px-4 py-2 rounded-xl bg-white hover:bg-amber-50 text-slate-900 font-bold text-xs shadow-lg flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                              <span>Replace Announcement Photo</span>
                            </button>
                          </div>

                          {/* Badges on image */}
                          <div className="absolute top-2 left-2 flex gap-1.5 pointer-events-none">
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
                            {isFeatured && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Featured on Landing Page</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{ann.announcementId}</span>
                            <span>{ann.publishDate}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{ann.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {ann.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setQuickImageAnnouncement(ann)}
                          className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Change Photo</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditAnnouncement(ann)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(ann.announcementId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete announcement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HERO & BRANDING TEXT */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Hero Welcome & Organization Header</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Locale Badge Text</label>
                <input
                  type="text"
                  value={formData.chapterName}
                  onChange={(e) => setFormData({ ...formData, chapterName: e.target.value })}
                  placeholder="e.g. MCGI YOUTH • LOCAL OF ASCOVILLE"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Hero Headline</label>
                <input
                  type="text"
                  value={formData.heroTitle}
                  onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                  placeholder="e.g. Welcome, Youth!"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 uppercase">Hero Subtitle / Encouragement</label>
              <textarea
                rows={3}
                value={formData.heroSubtitle}
                onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                placeholder="Enter welcoming encouragement for youth visiting the website..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Featured Gathering Dropdown */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Featured Gathering / Assembly</span>
            </h3>

            <div className="text-xs space-y-1 max-w-xl">
              <label className="font-bold text-slate-700 uppercase">Featured Gathering Card</label>
              <select
                value={formData.featuredEventId || ''}
                onChange={(e) => setFormData({ ...formData, featuredEventId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 outline-none"
              >
                <option value="">Auto-select latest upcoming gathering</option>
                {events.map((ev) => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.eventName} ({ev.startDate})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Locale Contact & Footer Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="youth.ascoville@mcgi.org"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Locale Location Label</label>
                <input
                  type="text"
                  value={formData.contactLocation || ''}
                  onChange={(e) => setFormData({ ...formData, contactLocation: e.target.value })}
                  placeholder="Local of Ascoville"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: THEME & SECURITY */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          {/* Identity Verification Method */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Attendance Check-In Identity Verification Method</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Determines how members confirm their identity when self-checking into assemblies from the homepage.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'member_id',
                  title: 'Member ID Required',
                  desc: 'Member must enter their official Member ID (e.g. M-1001) before check-in.',
                },
                {
                  id: 'birthday',
                  title: 'Birth Date Required',
                  desc: 'Member verifies with birth date/year registered in roster.',
                },
                {
                  id: 'simple',
                  title: 'Single-Click Confirmation',
                  desc: 'Direct confirmation prompt with audit log recording.',
                },
              ].map((method) => (
                <div
                  key={method.id}
                  onClick={() =>
                    setFormData({ ...formData, verificationMethod: method.id as VerificationMethod })
                  }
                  className={`p-4 rounded-xl border cursor-pointer transition space-y-1 ${
                    formData.verificationMethod === method.id
                      ? 'border-amber-700 bg-amber-50/70 ring-1 ring-amber-700'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{method.title}</h4>
                    {formData.verificationMethod === method.id && (
                      <span className="text-amber-800 text-xs font-bold">✓</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">{method.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Palette Selection */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Palette className="w-4 h-4 text-amber-600" />
              <span>Color Palette Theme</span>
            </h3>

            <div className="max-w-md text-xs space-y-1">
              <label className="font-bold text-slate-700 uppercase">Default Palette</label>
              <select
                value={formData.colorTheme}
                onChange={(e) =>
                  setFormData({ ...formData, colorTheme: e.target.value as ThemePalette })
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 outline-none"
              >
                <option value="beige">Warm Sandstone & Linen (Beige Palette)</option>
                <option value="slate">Modern Swiss Slate & Obsidian</option>
                <option value="navy">MCGI Heritage Navy & Gold</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Save Button Bar (Footer) */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 text-white shadow-lg">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Remember to save your configuration changes to apply them to the public page.</span>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-sm flex items-center space-x-2 cursor-pointer active:scale-98"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>

      {/* MODAL 1: Full Announcement Create/Edit Modal */}
      {isAnnouncementModalOpen && editingAnnouncement && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsAnnouncementModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {announcements.some((a) => a.announcementId === editingAnnouncement.announcementId)
                  ? 'Edit Landing Page Announcement'
                  : 'Add New Landing Page Announcement'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncementForm} className="space-y-4 text-xs">
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
                    <option value="Published">Published (Visible on Landing Page)</option>
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
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-amber-600 outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Description / Message</label>
                <textarea
                  rows={4}
                  required
                  value={editingAnnouncement.description}
                  onChange={(e) =>
                    setEditingAnnouncement({ ...editingAnnouncement, description: e.target.value })
                  }
                  placeholder="Enter the complete text of the circular, guidelines, and message..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-amber-600 outline-none"
                />
              </div>

              {/* Banner Photo using ImageInputControl with Upload & URL */}
              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-700 uppercase">Announcement Photo / Banner</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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
                    id="modal-featured-check"
                    checked={editingAnnouncement.featured}
                    onChange={(e) =>
                      setEditingAnnouncement({ ...editingAnnouncement, featured: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="modal-featured-check"
                    className="font-semibold text-slate-800 cursor-pointer"
                  >
                    Feature on Homepage Hero Spotlight
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold transition shadow-xs cursor-pointer"
                >
                  Save Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Quick Replace Announcement Image Modal */}
      {quickImageAnnouncement && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setQuickImageAnnouncement(null)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Replace Announcement Image</h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {quickImageAnnouncement.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickImageAnnouncement(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <ImageInputControl
              label="New Announcement Photo"
              sublabel="Upload an image from your computer or paste a direct image URL"
              value={quickImageAnnouncement.image || ''}
              onChange={(newUrl) => handleSaveQuickImage(newUrl)}
              aspectRatioClass="aspect-[16/9]"
              maxWidth={1200}
              maxHeight={800}
            />

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setQuickImageAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
