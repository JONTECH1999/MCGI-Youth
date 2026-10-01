import React from 'react';
import { Search, Calendar, CheckCircle2, ShieldCheck, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

interface CommunityGuideSectionProps {
  onOpenSearch: () => void;
}

export const CommunityGuideSection: React.FC<CommunityGuideSectionProps> = ({ onOpenSearch }) => {
  const steps = [
    {
      number: '01',
      title: 'Search Your Name',
      desc: 'Type your first name, last name, or Member ID into the search bar. No passwords required for basic member lookup.',
      icon: Search,
      highlight: 'Instant Search',
    },
    {
      number: '02',
      title: 'Verify & View Standing',
      desc: 'Confirm your Member ID or birthdate to view your personal status cards, attendance rate, and encouraging notes.',
      icon: ShieldCheck,
      highlight: 'Privacy Protected',
    },
    {
      number: '03',
      title: 'Confirm Attendance',
      desc: 'Pick your scheduled prayer meeting, thanksgiving, or activity batch and tap Attend. Saved directly to Google Sheets!',
      icon: CheckCircle2,
      highlight: 'Instant Check-In',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-entry-reveal">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/60 text-xs font-bold tracking-wider uppercase shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Simple 3-Step Guide</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
          How to Use the Youth Portal
        </h2>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Designed specifically for ordinary youth members to stay connected, check gathering schedules, and verify attendance effortlessly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              style={{ animationDelay: `${idx * 120}ms` }}
              className="group relative p-7 sm:p-8 rounded-3xl bg-white border border-[#E6DFD5] hover:border-amber-500/70 card-alive shadow-xs flex flex-col justify-between space-y-6"
            >
              {/* Top Row: Icon & Large Number */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200/80 border border-amber-300/60 text-amber-800 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-2xs">
                    <Icon className="w-6 h-6 text-amber-800" />
                  </div>
                  <span className="text-4xl font-black text-stone-200 group-hover:text-amber-200 transition-colors font-mono">
                    {step.number}
                  </span>
                </div>

                <div>
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 mb-2">
                    {step.highlight}
                  </span>
                  <h3 className="text-xl font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                    {step.title}
                  </h3>
                </div>

                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {/* Progress Line Indicator */}
              <div className="pt-2">
                <div className="h-1.5 w-14 bg-gradient-to-r from-amber-700 to-amber-500 rounded-full group-hover:w-full transition-all duration-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Call to Action Banner */}
      <div className="mt-14 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-stone-950 via-amber-950 to-stone-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border border-amber-800/40 relative overflow-hidden card-alive">
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 text-center md:text-left z-10">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-beacon-green" />
            <span>Ready in 5 Seconds</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Looking for your attendance record?</h3>
          <p className="text-stone-300 text-xs sm:text-sm max-w-xl">
            Search your name or Member ID now to view your personalized quarterly standing and check in for this week's gatherings.
          </p>
        </div>

        <button
          onClick={onOpenSearch}
          className="btn-shimmer py-4 px-7 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-extrabold text-sm transition-all duration-200 shadow-xl shadow-amber-950/50 hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer shrink-0 z-10 flex items-center space-x-2"
        >
          <span>Search My Name Now</span>
          <ArrowRight className="w-4 h-4 text-amber-100" />
        </button>
      </div>
    </section>
  );
};
