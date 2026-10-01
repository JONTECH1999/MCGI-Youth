import React, { useState, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Briefcase,
  Vote,
  Heart,
  Award,
  Layers,
  Info,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { StatsService } from '../services/statsService';
import { OFFICIAL_COMMITTEES } from '../data/sampleCommittees';

export const DemographicsPage: React.FC = () => {
  const { members } = useAppData();
  const [viewMode, setViewMode] = useState<'live' | 'baseline'>('live');

  // Live Demographics
  const liveStats = useMemo(() => {
    return StatsService.calculateDemographicStatistics(members);
  }, [members]);

  // Baseline Demographics from official report
  const baselineStats = useMemo(() => {
    return StatsService.getOfficialSampleBaseline().demographics;
  }, []);

  const stats = viewMode === 'live' ? liveStats : baselineStats;
  const totalCount = viewMode === 'live' ? members.length : 2649;

  const getPercent = (count: number) => {
    if (!totalCount) return '0.0%';
    return `${Math.round((count / totalCount) * 1000) / 10}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Demographic Classifications & Breakdown</h2>
          <p className="text-xs text-slate-500">
            Official youth demographic metrics synchronized with Google Sheets DEMOGRAPHICS tab
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('live')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'live' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Database ({members.length} Members)
          </button>
          <button
            onClick={() => setViewMode('baseline')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'baseline' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Official Sample Baseline (2,649)
          </button>
        </div>
      </div>

      {/* Grid of Demographic Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Age Classification (Junior vs Senior) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Age Classification</h3>
                <p className="text-[11px] text-slate-500">Junior (&lt; 18) vs Senior (18 and above)</p>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-700">{totalCount} Youths</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Junior Youths (&lt; 18)</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-purple-700">{stats.age.junior}</span>
                <span className="text-xs font-bold text-slate-500">{getPercent(stats.age.junior)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Senior Youths (18+)</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-700">{stats.age.senior}</span>
                <span className="text-xs font-bold text-slate-500">{getPercent(stats.age.senior)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Education Profile */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Education Profile</h3>
                <p className="text-[11px] text-slate-500">School enrollment, working students, and OSY</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Students</span>
              <div className="mt-1">
                <span className="text-xl font-black text-slate-900">{stats.education.totalStudents}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{getPercent(stats.education.totalStudents)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">Working Students</span>
              <div className="mt-1">
                <span className="text-xl font-black text-blue-700">{stats.education.workingStudents}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{getPercent(stats.education.workingStudents)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">Out of School (OSY)</span>
              <div className="mt-1">
                <span className="text-xl font-black text-rose-700">{stats.education.outOfSchoolYouth}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{getPercent(stats.education.outOfSchoolYouth)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Employment Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Employment Status</h3>
                <p className="text-[11px] text-slate-500">Youths with employment or self-employed</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Youth With Work (Employed)</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-700">{stats.employment.youthWithWork}</span>
                <span className="text-xs font-bold text-slate-500">{getPercent(stats.employment.youthWithWork)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Not Working / Dependent</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-700">{stats.employment.notWorking}</span>
                <span className="text-xs font-bold text-slate-500">{getPercent(stats.employment.notWorking)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Voter Registration */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <Vote className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Voter Registration</h3>
                <p className="text-[11px] text-slate-500">Registered in local government elections</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Registered Voters</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-700">{stats.voting.registeredVoters}</span>
                <span className="text-xs font-bold text-slate-500">{getPercent(stats.voting.registeredVoters)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Not Registered</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-700">{stats.voting.notRegistered}</span>
                <span className="text-xs font-bold text-slate-500">{getPercent(stats.voting.notRegistered)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Parent Baptism Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Parent Baptism Status</h3>
                <p className="text-[11px] text-slate-500">Ecclesiastical household status</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Both Mother & Father</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-emerald-700">{stats.parentStatus.bothParents}</span>
                <span className="text-xs font-bold text-slate-500">{getPercent(stats.parentStatus.bothParents)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Mother Only</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-blue-700">{stats.parentStatus.motherOnly}</span>
                <span className="text-xs font-bold text-slate-500">{getPercent(stats.parentStatus.motherOnly)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Father Only</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-indigo-700">{stats.parentStatus.fatherOnly}</span>
                <span className="text-xs font-bold text-slate-500">{getPercent(stats.parentStatus.fatherOnly)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Unbaptized Parent/s</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-amber-700">{stats.parentStatus.unbaptizedParents}</span>
                <span className="text-xs font-bold text-slate-500">{getPercent(stats.parentStatus.unbaptizedParents)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Committees Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Official Committees Breakdown</h3>
                <p className="text-[11px] text-slate-500">
                  A member may belong to multiple committees. Multi-committee membership does NOT duplicate total member count.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
              Multiple Committees: {stats.multipleCommitteesCount} Youths
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {OFFICIAL_COMMITTEES.map((comm) => {
              const count = stats.committees[comm] || 0;
              return (
                <div key={comm} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block truncate max-w-[140px]">{comm}</span>
                    <span className="text-[10px] text-slate-500">{getPercent(count)} of youths</span>
                  </div>
                  <span className="text-base font-black text-blue-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
