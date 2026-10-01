import React from 'react';
import { Lock, Heart, Shield, Sparkles, MapPin, Mail } from 'lucide-react';

interface LandingFooterProps {
  chapterName: string;
  contactEmail?: string;
  contactLocation?: string;
  onOpenAdminLogin: () => void;
  onOpenSearch: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  chapterName,
  contactEmail,
  contactLocation,
  onOpenAdminLogin,
  onOpenSearch,
}) => {
  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-12 border-t border-stone-800 bg-dark-grain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          {/* Col 1: Organization */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3.5 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 text-white flex items-center justify-center font-bold shadow-md ring-1 ring-amber-500/30 transform group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-white text-base group-hover:text-amber-300 transition-colors">
                  MCGI YOUTH
                </span>
                <p className="text-[11px] text-amber-400/90 font-medium uppercase tracking-wider">
                  {chapterName || 'CAMANAVA / NCR DISTRICT 1'}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-400 max-w-md leading-relaxed">
              Serving the youth brethren and local chapters across Caloocan, Malabon, Navotas, and Valenzuela through faith, love, and dedicated spiritual fellowship.
            </p>

            <div className="flex flex-col space-y-2 text-xs text-stone-400 pt-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{contactLocation || 'CAMANAVA / NCR District 1, Philippines'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>{contactEmail || 'youth.camanava@mcgi.org'}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Youth Portal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-amber-300 transition-colors hover:translate-x-1 inline-block transform duration-150 cursor-pointer"
                >
                  Welcome & Search
                </button>
              </li>
              <li>
                <a href="#announcements" className="hover:text-amber-300 transition-colors hover:translate-x-1 inline-block transform duration-150">
                  Announcements Board
                </a>
              </li>
              <li>
                <a href="#upcoming-events" className="hover:text-amber-300 transition-colors hover:translate-x-1 inline-block transform duration-150">
                  Upcoming Gatherings
                </a>
              </li>
              <li>
                <button onClick={onOpenSearch} className="hover:text-amber-300 transition-colors hover:translate-x-1 inline-block transform duration-150 cursor-pointer">
                  Search My Name & Status
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Principles & Community */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Our Community</h4>
            <p className="text-xs text-stone-400 leading-relaxed italic font-serif">
              "Remember now thy Creator in the days of thy youth..." — Ecclesiastes 12:1
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenSearch}
                className="btn-shimmer w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs transition-all duration-200 cursor-pointer text-center shadow-md hover:shadow-amber-900/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                🔎 Check My Attendance
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Discreet Admin Access */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} MCGI Youth Ministry — NCR District 1. All rights reserved.</p>

          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-1.5 text-stone-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-beacon-green" />
              <span>Google Sheets Database Active</span>
            </span>

            {/* Discreet Admin Login */}
            <button
              onClick={onOpenAdminLogin}
              className="inline-flex items-center space-x-1.5 text-stone-400 hover:text-amber-300 transition cursor-pointer font-medium p-1 rounded hover:bg-stone-800/60"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Officer Login</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
