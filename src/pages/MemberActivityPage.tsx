import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  UserCheck,
  UserX,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Clock,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Member, ActivityStatus } from '../types/member';
import { StatusBadge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { MemberProfileModal } from '../components/members/MemberProfileModal';
import { OFFICIAL_COMMITTEES } from '../data/sampleCommittees';
import { NavItemKey } from '../components/layout/Sidebar';

interface MemberActivityPageProps {
  onNavigateTab: (tab: NavItemKey) => void;
}

export const MemberActivityPage: React.FC<MemberActivityPageProps> = ({ onNavigateTab }) => {
  const { members, attendance, settings } = useAppData();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<string>('All');
  const [membershipStatusFilter, setMembershipStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [committeeFilter, setCommitteeFilter] = useState<string>('All');

  // Sorting
  const [sortBy, setSortBy] = useState<'rate' | 'lastAttendance' | 'name' | 'status'>('rate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Profile Modal
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Counts summary
  const summaryCounts = useMemo(() => {
    let regular = 0;
    let active = 0;
    let atRisk = 0;
    let inactive = 0;

    members.forEach((m) => {
      if (m.activityStatus === 'Regular') regular++;
      else if (m.activityStatus === 'Active') active++;
      else if (m.activityStatus === 'At Risk') atRisk++;
      else if (m.activityStatus === 'Inactive') inactive++;
    });

    return { regular, active, atRisk, inactive };
  }, [members]);

  // Filtered and Sorted members
  const processedMembers = useMemo(() => {
    return members
      .filter((m) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matches =
            m.fullName.toLowerCase().includes(q) ||
            m.memberId.toLowerCase().includes(q) ||
            m.contactNumber.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (activityFilter !== 'All' && m.activityStatus !== activityFilter) return false;
        if (membershipStatusFilter !== 'All' && m.membershipStatus !== membershipStatusFilter) return false;
        if (categoryFilter !== 'All' && m.memberCategory !== categoryFilter) return false;
        if (committeeFilter !== 'All' && !m.committees.includes(committeeFilter)) return false;

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'rate') {
          diff = a.attendancePercentage - b.attendancePercentage;
        } else if (sortBy === 'lastAttendance') {
          const dateA = a.lastAttendanceDate ? new Date(a.lastAttendanceDate).getTime() : 0;
          const dateB = b.lastAttendanceDate ? new Date(b.lastAttendanceDate).getTime() : 0;
          diff = dateA - dateB;
        } else if (sortBy === 'name') {
          diff = a.fullName.localeCompare(b.fullName);
        } else if (sortBy === 'status') {
          diff = a.membershipStatus.localeCompare(b.membershipStatus);
        }
        return sortDirection === 'asc' ? diff : -diff;
      });
  }, [
    members,
    searchQuery,
    activityFilter,
    membershipStatusFilter,
    categoryFilter,
    committeeFilter,
    sortBy,
    sortDirection,
  ]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedMembers.slice(start, start + pageSize);
  }, [processedMembers, currentPage, pageSize]);

  const toggleSort = (field: 'rate' | 'lastAttendance' | 'name' | 'status') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Config Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Member Activity & At-Risk Monitoring</h2>
          <p className="text-xs text-slate-500">
            Automated assessments evaluated against configured inactivity rules: Regular (&gt;={settings.attendanceRules.regularThresholdPercent}%),
            Active (&gt;={settings.attendanceRules.activeThresholdPercent}%), At Risk (&lt;{settings.attendanceRules.activeThresholdPercent}% or {settings.attendanceRules.missedEventsBeforeAtRisk} missed),
            Inactive (&gt;={settings.attendanceRules.daysWithoutAttendanceBeforeInactive} days or {settings.attendanceRules.missedEventsBeforeInactive} missed)
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('settings')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shrink-0"
        >
          <span>Configure Rules</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Activity Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setActivityFilter('Regular');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activityFilter === 'Regular'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400'
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Regular</span>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{summaryCounts.regular}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">&gt;= 75% attendance rate</span>
        </button>

        <button
          onClick={() => {
            setActivityFilter('Active');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activityFilter === 'Active'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active</span>
            <Flame className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{summaryCounts.active}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">&gt;= 50% attendance rate</span>
        </button>

        <button
          onClick={() => {
            setActivityFilter('At Risk');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activityFilter === 'At Risk'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">At Risk</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{summaryCounts.atRisk}</div>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Urgent follow-up needed</span>
        </button>

        <button
          onClick={() => {
            setActivityFilter('Inactive');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activityFilter === 'Inactive'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Inactive</span>
            <UserX className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{summaryCounts.inactive}</div>
          <span className="text-[10px] text-rose-600 font-medium mt-0.5 block">Exceeded inactivity limits</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search member by full name, Member ID, or contact number..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activityFilter}
              onChange={(e) => {
                setActivityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-700"
            >
              <option value="All">All Activity Statuses</option>
              <option value="Regular">Regular</option>
              <option value="Active">Active</option>
              <option value="At Risk">At Risk</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={membershipStatusFilter}
              onChange={(e) => {
                setMembershipStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-700"
            >
              <option value="All">All Membership Statuses</option>
              <option value="Active">Active</option>
              <option value="On & Off">On & Off</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="Missing">Missing</option>
            </select>

            <select
              value={committeeFilter}
              onChange={(e) => {
                setCommitteeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-700"
            >
              <option value="All">All Committees</option>
              {OFFICIAL_COMMITTEES.map((comm) => (
                <option key={comm} value={comm}>
                  {comm}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Sorted by <strong className="text-slate-800 uppercase">{sortBy}</strong> ({sortDirection.toUpperCase()})
          </span>
          <span>Showing {processedMembers.length} records</span>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    <span>Member</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200"
                  onClick={() => toggleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    <span>Membership Status</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Activity Status</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200 text-center"
                  onClick={() => toggleSort('rate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Attendance Rate</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200"
                  onClick={() => toggleSort('lastAttendance')}
                >
                  <div className="flex items-center gap-1">
                    <span>Last Attendance</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Rule Evaluation & Reason</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No member records found matching the active activity filters.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
                  <tr key={member.memberId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Member */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{member.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {member.memberId} • {member.memberCategory}
                      </div>
                    </td>

                    {/* Membership Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={member.membershipStatus} />
                    </td>

                    {/* Activity Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={member.activityStatus} />
                    </td>

                    {/* Attendance Rate */}
                    <td className="py-3 px-4 text-center font-bold">
                      <span
                        className={`text-sm ${
                          member.attendancePercentage >= 75
                            ? 'text-emerald-600'
                            : member.attendancePercentage >= 50
                            ? 'text-blue-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {member.attendancePercentage}%
                      </span>
                    </td>

                    {/* Last Attendance */}
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {member.lastAttendanceDate || <span className="text-slate-400 italic">None</span>}
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 max-w-sm">
                      {member.activityReason ? (
                        <div className="p-1.5 rounded-md bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px] leading-tight font-medium">
                          {member.activityReason}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Regular active attendance</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedMember(member)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={processedMembers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      <MemberProfileModal
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        attendanceRecords={attendance}
      />
    </div>
  );
};
