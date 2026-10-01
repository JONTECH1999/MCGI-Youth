import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  UserX,
  AlertOctagon,
  FileSpreadsheet,
  Download,
  Info,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { StatsService } from '../services/statsService';

export const StatisticsPage: React.FC = () => {
  const { members } = useAppData();
  const [viewMode, setViewMode] = useState<'live' | 'baseline'>('live');

  const liveStats = useMemo(() => {
    return StatsService.calculateMembershipStatistics(members);
  }, [members]);

  const baselineStats = useMemo(() => {
    return StatsService.getOfficialSampleBaseline().membership;
  }, []);

  const stats = viewMode === 'live' ? liveStats : baselineStats;
  const total = viewMode === 'live' ? members.length : 2649;

  const getPct = (val: number) => {
    if (!total) return '0.0%';
    return `${Math.round((val / total) * 1000) / 10}%`;
  };

  const exportTableCsv = () => {
    const rows = [
      ['Classification', 'Total Count', 'Junior (<18)', 'Senior (18+)', 'Percentage of Total'],
      ['Total Registered Members', stats.totalRegisteredMembers, stats.active.junior + stats.onAndOff.junior + stats.inactive.junior, stats.active.senior + stats.onAndOff.senior + stats.inactive.senior, '100.0%'],
      ['Active Members', stats.active.total, stats.active.junior, stats.active.senior, getPct(stats.active.total)],
      ['On & Off Members', stats.onAndOff.total, stats.onAndOff.junior, stats.onAndOff.senior, getPct(stats.onAndOff.total)],
      ['Inactive Members', stats.inactive.total, stats.inactive.junior, stats.inactive.senior, getPct(stats.inactive.total)],
      ['Suspended (Active Suspended)', stats.suspended.activeSuspended, '-', '-', getPct(stats.suspended.activeSuspended)],
      ['Suspended (On & Off Suspended)', stats.suspended.onAndOffSuspended, '-', '-', getPct(stats.suspended.onAndOffSuspended)],
      ['Suspended (Inactive/RFA)', stats.suspended.inactiveRfa, '-', '-', getPct(stats.suspended.inactiveRfa)],
      ['Suspended Total', stats.suspended.total, '-', '-', getPct(stats.suspended.total)],
      ['Missing Members', stats.missing, '-', '-', getPct(stats.missing)],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MCGI_Youth_Statistics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Official Membership Statistics & Breakdown</h2>
          <p className="text-xs text-slate-500">
            Official reporting structure matching the MEMBERSHIP_STATISTICS Google Sheet tab
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('live')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'live' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Live Database ({members.length})
            </button>
            <button
              onClick={() => setViewMode('baseline')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'baseline' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Official Sample Baseline (2,649)
            </button>
          </div>

          <button
            onClick={exportTableCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Official Report Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase">
              MEMBERSHIP_STATISTICS OFFICIAL REPORT
            </h3>
          </div>
          <span className="text-xs font-semibold bg-blue-600 px-3 py-1 rounded-full text-white">
            Total Registered: {stats.totalRegisteredMembers}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Membership Category / Breakdown</th>
                <th className="py-3 px-4 text-center">Junior (&lt; 18)</th>
                <th className="py-3 px-4 text-center">Senior (18+)</th>
                <th className="py-3 px-4 text-center font-black">Total Count</th>
                <th className="py-3 px-4 text-right">Percentage of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium">
              {/* Active */}
              <tr className="bg-emerald-50/30 hover:bg-emerald-50/60 font-semibold">
                <td className="py-3.5 px-4 text-emerald-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Active Members</span>
                </td>
                <td className="py-3.5 px-4 text-center">{stats.active.junior}</td>
                <td className="py-3.5 px-4 text-center">{stats.active.senior}</td>
                <td className="py-3.5 px-4 text-center text-sm font-extrabold text-emerald-800">
                  {stats.active.total}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                  {getPct(stats.active.total)}
                </td>
              </tr>

              {/* On & Off */}
              <tr className="bg-amber-50/30 hover:bg-amber-50/60 font-semibold">
                <td className="py-3.5 px-4 text-amber-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>On & Off Members</span>
                </td>
                <td className="py-3.5 px-4 text-center">{stats.onAndOff.junior}</td>
                <td className="py-3.5 px-4 text-center">{stats.onAndOff.senior}</td>
                <td className="py-3.5 px-4 text-center text-sm font-extrabold text-amber-800">
                  {stats.onAndOff.total}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-amber-700">
                  {getPct(stats.onAndOff.total)}
                </td>
              </tr>

              {/* Inactive */}
              <tr className="bg-rose-50/30 hover:bg-rose-50/60 font-semibold">
                <td className="py-3.5 px-4 text-rose-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>Inactive Members</span>
                </td>
                <td className="py-3.5 px-4 text-center">{stats.inactive.junior}</td>
                <td className="py-3.5 px-4 text-center">{stats.inactive.senior}</td>
                <td className="py-3.5 px-4 text-center text-sm font-extrabold text-rose-800">
                  {stats.inactive.total}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-rose-700">
                  {getPct(stats.inactive.total)}
                </td>
              </tr>

              {/* Suspended Breakdown */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 pl-8 text-slate-600">Active Suspended</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center font-bold text-slate-800">
                  {stats.suspended.activeSuspended}
                </td>
                <td className="py-3 px-4 text-right text-slate-500">
                  {getPct(stats.suspended.activeSuspended)}
                </td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 pl-8 text-slate-600">On & Off Suspended</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center font-bold text-slate-800">
                  {stats.suspended.onAndOffSuspended}
                </td>
                <td className="py-3 px-4 text-right text-slate-500">
                  {getPct(stats.suspended.onAndOffSuspended)}
                </td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 pl-8 text-slate-600">Inactive / RFA Suspended</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center font-bold text-slate-800">
                  {stats.suspended.inactiveRfa}
                </td>
                <td className="py-3 px-4 text-right text-slate-500">
                  {getPct(stats.suspended.inactiveRfa)}
                </td>
              </tr>

              <tr className="bg-purple-50/40 hover:bg-purple-50/70 font-semibold">
                <td className="py-3 px-4 text-purple-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  <span>Suspended Total</span>
                </td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center text-sm font-extrabold text-purple-800">
                  {stats.suspended.total}
                </td>
                <td className="py-3 px-4 text-right font-bold text-purple-700">
                  {getPct(stats.suspended.total)}
                </td>
              </tr>

              {/* Missing */}
              <tr className="bg-slate-100/60 hover:bg-slate-100 font-semibold">
                <td className="py-3 px-4 text-slate-800 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  <span>Missing Members</span>
                </td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center text-sm font-extrabold text-slate-800">
                  {stats.missing}
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-700">
                  {getPct(stats.missing)}
                </td>
              </tr>

              {/* Total Registered Members Summary Row */}
              <tr className="bg-slate-200/60 font-black text-slate-900 border-t-2 border-slate-300">
                <td className="py-4 px-4 text-sm uppercase">TOTAL REGISTERED MEMBERS</td>
                <td className="py-4 px-4 text-center text-sm">
                  {stats.active.junior + stats.onAndOff.junior + stats.inactive.junior}
                </td>
                <td className="py-4 px-4 text-center text-sm">
                  {stats.active.senior + stats.onAndOff.senior + stats.inactive.senior}
                </td>
                <td className="py-4 px-4 text-center text-base text-blue-900">
                  {stats.totalRegisteredMembers}
                </td>
                <td className="py-4 px-4 text-right text-sm">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
