import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  AlertOctagon,
  Clock,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Vote,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useAppData } from '../context/AppDataContext';
import { StatsService } from '../services/statsService';
import { NavItemKey } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigateTab: (tab: NavItemKey) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { members, events, attendance, syncFromGoogleSheets } = useAppData();

  useEffect(() => {
    void syncFromGoogleSheets();
  }, []);

  // Global Date Filter
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'year'>('all');
  const [trendRange, setTrendRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Compute live statistics directly from active database
  const membershipStats = useMemo(() => {
    return StatsService.calculateMembershipStatistics(members);
  }, [members]);

  const demographicStats = useMemo(() => {
    return StatsService.calculateDemographicStatistics(members);
  }, [members]);

  const attendanceAnalytics = useMemo(() => {
    return StatsService.calculateAttendanceAnalytics(attendance, events, members, dateFilter);
  }, [attendance, events, members, dateFilter]);

  // Chart data: Membership Status
  const membershipChartData = [
    { name: 'Active', value: membershipStats.active.total, color: '#10b981' },
    { name: 'On & Off', value: membershipStats.onAndOff.total, color: '#f59e0b' },
    { name: 'Inactive', value: membershipStats.inactive.total, color: '#ef4444' },
    { name: 'Suspended', value: membershipStats.suspended.total, color: '#dc2626' },
    { name: 'Missing', value: membershipStats.missing, color: '#64748b' },
  ].filter((d) => d.value > 0);

  // Chart data: Category (Junior vs Senior)
  const categoryChartData = [
    {
      category: 'Active',
      Junior: membershipStats.active.junior,
      Senior: membershipStats.active.senior,
    },
    {
      category: 'On & Off',
      Junior: membershipStats.onAndOff.junior,
      Senior: membershipStats.onAndOff.senior,
    },
    {
      category: 'Inactive',
      Junior: membershipStats.inactive.junior,
      Senior: membershipStats.inactive.senior,
    },
  ];

  // Chart data: Top Committees
  const committeeChartData = Object.keys(demographicStats.committees)
    .map((comm) => ({
      name: comm,
      members: demographicStats.committees[comm],
    }))
    .filter((d) => d.members > 0)
    .sort((a, b) => b.members - a.members)
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      {/* Global Date Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">MCGI Youth Administrative Overview</h2>
          <p className="text-xs text-slate-500">Live statistics computed from official Google Sheets database</p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">Period:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Row 1: Membership KPI Cards */}
      <div className="order-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Membership Status Breakdown
          </h3>
          <button
            onClick={() => onNavigateTab('members')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            <span>View All Members</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Members */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Members</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{membershipStats.totalRegisteredMembers}</span>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Registered in DB</span>
          </div>

          {/* Active */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Active</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-700">{membershipStats.active.total}</span>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-[10px] text-emerald-600 mt-1 block">
              Jr: {membershipStats.active.junior} • Sr: {membershipStats.active.senior}
            </span>
          </div>

          {/* On & Off */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-xs">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">On & Off</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-700">{membershipStats.onAndOff.total}</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <span className="text-[10px] text-amber-600 mt-1 block">
              Jr: {membershipStats.onAndOff.junior} • Sr: {membershipStats.onAndOff.senior}
            </span>
          </div>

          {/* Inactive */}
          <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 shadow-xs">
            <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">Inactive</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-700">{membershipStats.inactive.total}</span>
              <UserX className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-[10px] text-rose-600 mt-1 block">
              Jr: {membershipStats.inactive.junior} • Sr: {membershipStats.inactive.senior}
            </span>
          </div>

          {/* Suspended */}
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 shadow-xs">
            <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider block">Suspended</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-purple-700">{membershipStats.suspended.total}</span>
              <AlertOctagon className="h-4 w-4 text-purple-500" />
            </div>
            <span className="text-[10px] text-purple-600 mt-1 block">Under pastoral care</span>
          </div>

          {/* Missing */}
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">Missing</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-700">{membershipStats.missing}</span>
              <Layers className="h-4 w-4 text-slate-400" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Relocated / Unreached</span>
          </div>
        </div>
      </div>

      {/* Row 2: Attendance Activity & Risk Cards */}
      <div className="order-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Attendance & Activity Monitoring
          </h3>
          <button
            onClick={() => onNavigateTab('activity')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            <span>View Activity Tracker</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-50/70 p-5 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Present Today</span>
            <div className="mt-1 text-3xl sm:text-4xl font-black text-emerald-700 leading-none">
              {attendanceAnalytics.presentToday}
            </div>
            <span className="text-xs text-emerald-700 mt-2 block">Marked present today</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Overall Rate</span>
            <div className="mt-1 text-2xl font-black text-blue-600">
              {attendanceAnalytics.overallAttendanceRate}%
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Qualifying events</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">At Risk</span>
            <div className="mt-1 text-2xl font-black text-amber-600">
              {attendanceAnalytics.atRiskCount}
            </div>
            <span className="text-[10px] text-amber-600 font-medium mt-1 block">Needs follow-up</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Inactive Activity</span>
            <div className="mt-1 text-2xl font-black text-rose-600">
              {attendanceAnalytics.inactiveCount}
            </div>
            <span className="text-[10px] text-rose-600 font-medium mt-1 block">Exceeded missed threshold</span>
          </div>
        </div>
      </div>

      {/* Row 3: Demographics Summary Cards */}
      <div className="order-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Demographic Overview
          </h3>
          <button
            onClick={() => onNavigateTab('demographics')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            <span>View Full Demographics</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase">
              <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
              <span>Students</span>
            </div>
            <div className="mt-1 text-xl font-black text-slate-800">
              {demographicStats.education.totalStudents}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase">
              <Briefcase className="h-3.5 w-3.5 text-emerald-600" />
              <span>Youth With Work</span>
            </div>
            <div className="mt-1 text-xl font-black text-slate-800">
              {demographicStats.employment.youthWithWork}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase">
              <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
              <span>Working Students</span>
            </div>
            <div className="mt-1 text-xl font-black text-slate-800">
              {demographicStats.education.workingStudents}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase">
              <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
              <span>Out of School</span>
            </div>
            <div className="mt-1 text-xl font-black text-slate-800">
              {demographicStats.education.outOfSchoolYouth}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase">
              <Vote className="h-3.5 w-3.5 text-purple-600" />
              <span>Voters</span>
            </div>
            <div className="mt-1 text-xl font-black text-slate-800">
              {demographicStats.voting.registeredVoters}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Charts Grid */}
      <div className="order-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Membership Distribution Donut */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-1">Membership Status Distribution</h4>
          <p className="text-xs text-slate-500 mb-4">Official classification across all registered members</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={membershipChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {membershipChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Junior vs Senior Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-1">Junior vs Senior Youths</h4>
          <p className="text-xs text-slate-500 mb-4">Age bracket distribution (&lt;18 vs 18+)</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Junior" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Senior" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Attendance Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Attendance Trend Over Time</h4>
              <p className="text-xs text-slate-500">Qualifying event attendance percentages and marked totals</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setTrendRange('7d')}
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  trendRange === '7d' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Last 7d
              </button>
              <button
                onClick={() => setTrendRange('30d')}
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  trendRange === '30d' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Last 30d
              </button>
              <button
                onClick={() => setTrendRange('all')}
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  trendRange === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                }`}
              >
                All
              </button>
            </div>
          </div>

          <div className="h-64">
            {attendanceAnalytics.trend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No attendance trend data available for this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceAnalytics.trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="present"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Present"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="absent"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Absent"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="late"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    name="Late"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Committee Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Committee Member Distribution</h4>
              <p className="text-xs text-slate-500">Active participation across MCGI auxiliary ministries</p>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Multiple Committees: <strong className="text-slate-900">{demographicStats.multipleCommitteesCount}</strong>
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={committeeChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="members" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
