import React, { useState } from 'react';
import {
  Palette,
  Image,
  Sparkles,
  Save,
  CheckCircle,
  Eye,
  ShieldCheck,
  Layout,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { LandingPageConfig, ThemePalette, VerificationMethod } from '../types/landingPage';

interface LandingPageSettingsPageProps {
  onPreviewPublic: () => void;
}

export const LandingPageSettingsPage: React.FC<LandingPageSettingsPageProps> = ({ onPreviewPublic }) => {
  const { landingPageConfig, saveLandingPageConfig, events, announcements } = useAppData();

  const [formData, setFormData] = useState<LandingPageConfig>({ ...landingPageConfig });
  const [notification, setNotification] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Preset high quality hero images
  const presetImages = [
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await saveLandingPageConfig(formData);
    setIsSaving(false);
    if (res.success) {
      setNotification('Landing page configuration updated and saved!');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layout className="w-6 h-6 text-amber-600" />
            <span>Member Landing Page Configuration</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customize the member-facing homepage: hero banner, welcoming copy, featured assemblies, and verification rules.
          </p>
        </div>

        <button
          onClick={onPreviewPublic}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>View Live Member Page</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: HERO & BRAND */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Hero Welcome & Organization Header</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Chapter / District Badge Text</label>
              <input
                type="text"
                value={formData.chapterName}
                onChange={(e) => setFormData({ ...formData, chapterName: e.target.value })}
                placeholder="e.g. MCGI YOUTH • CAMANAVA / NCR DISTRICT 1"
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
            <label className="font-bold text-slate-700 uppercase">Hero Subtitle / Message</label>
            <textarea
              rows={2}
              value={formData.heroSubtitle}
              onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
              placeholder="Enter welcoming encouragement for youth visiting the website..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs"
            />
          </div>
        </div>

        {/* SECTION 2: HERO IMAGE CONFIGURATION */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Image className="w-4 h-4 text-amber-600" />
            <span>Hero Background Image (Admin-Configurable)</span>
          </h3>

          <div className="space-y-2 text-xs">
            <label className="font-bold text-slate-700 uppercase">Hero Banner Image URL</label>
            <input
              type="url"
              value={formData.heroImageUrl}
              onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
              placeholder="https://example.com/banner.jpg"
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">Or pick from curated gathering banners:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {presetImages.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => setFormData({ ...formData, heroImageUrl: preset.url })}
                  className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                    formData.heroImageUrl === preset.url
                      ? 'border-amber-600 ring-2 ring-amber-600/30'
                      : 'border-slate-200 hover:border-amber-400'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-20 object-cover" />
                  <div className="p-1.5 bg-white text-[10px] font-semibold text-slate-700 truncate">
                    {preset.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: FEATURED EVENT & ANNOUNCEMENT */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Featured Highlights on Hero</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Featured Gathering / Event</label>
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

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Featured Announcement Circular</label>
              <select
                value={formData.featuredAnnouncementId || ''}
                onChange={(e) => setFormData({ ...formData, featuredAnnouncementId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 outline-none"
              >
                <option value="">Auto-select latest featured announcement</option>
                {announcements.map((ann) => (
                  <option key={ann.announcementId} value={ann.announcementId}>
                    {ann.title} ({ann.publishDate})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: SECURITY & VERIFICATION METHOD */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Attendance Check-In Identity Verification</span>
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed">
            Per security guidelines, prevents members from freely marking other people present without verification.
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

        {/* SECTION 5: PALETTE & CONTACT */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Palette className="w-4 h-4 text-amber-600" />
            <span>Color Palette & Footer Contact Info</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
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

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail || ''}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="youth.camanava@mcgi.org"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Contact Location</label>
              <input
                type="text"
                value={formData.contactLocation || ''}
                onChange={(e) => setFormData({ ...formData, contactLocation: e.target.value })}
                placeholder="CAMANAVA District, NCR"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition shadow-sm flex items-center space-x-2 cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Landing Page Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
