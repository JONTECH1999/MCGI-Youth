import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Upload,
  Download,
  Eye,
  Edit2,
  Archive,
  Trash2,
  Users,
  ChevronDown,
} from 'lucide-react';
import { Member } from '../../types/member';
import { AttendanceRecord } from '../../types/attendance';
import { StatusBadge } from '../common/Badge';
import { Pagination } from '../common/Pagination';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { MemberProfileModal } from './MemberProfileModal';
import { MemberFormModal } from './MemberFormModal';
import { MemberImportModal } from './MemberImportModal';
import { OFFICIAL_COMMITTEES } from '../../data/sampleCommittees';
import { useAuth } from '../../context/AuthContext';

interface MemberTableProps {
  members: Member[];
  attendanceRecords: AttendanceRecord[];
  onSaveMember: (member: Member) => Promise<{ success: boolean; message: string }>;
  onArchiveMember: (memberId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  onDeleteMember: (memberId: string) => Promise<{ success: boolean; message: string }>;
  onImportMembers: (members: Member[]) => Promise<{ imported: number; updated: number }>;
}

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  attendanceRecords,
  onSaveMember,
  onArchiveMember,
  onDeleteMember,
  onImportMembers,
}) => {
  const { isAdmin } = useAuth();

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [committeeFilter, setCommitteeFilter] = useState('All');
  const [activityFilter, setActivityFilter] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals state
  const [selectedProfileMember, setSelectedProfileMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Confirmations
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return [...members]
      .filter((m) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = m.fullName.toLowerCase().includes(q) ||
            m.firstName.toLowerCase().includes(q) ||
            m.lastName.toLowerCase().includes(q);
          const matchesId = m.memberId.toLowerCase().includes(q);
          const matchesContact = m.contactNumber.toLowerCase().includes(q);
          if (!matchesName && !matchesId && !matchesContact) return false;
        }

        if (statusFilter !== 'All' && m.membershipStatus !== statusFilter) return false;
        if (categoryFilter !== 'All' && m.memberCategory !== categoryFilter) return false;
        if (activityFilter !== 'All' && m.activityStatus !== activityFilter) return false;
        if (committeeFilter !== 'All' && !m.committees.includes(committeeFilter)) return false;

        return true;
      })
      .sort((a, b) => {
        const numA = Number(String(a.memberId).replace(/[^0-9]/g, '')) || 0;
        const numB = Number(String(b.memberId).replace(/[^0-9]/g, '')) || 0;
        return numA - numB;
      });
  }, [members, searchQuery, statusFilter, categoryFilter, activityFilter, committeeFilter]);

  // Paginated slice
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Member ID', 'Full Name', 'Age', 'Gender', 'Category', 'Status', 'Activity Status',
      'Contact', 'Email', 'Committees', 'Attendance %', 'Last Attendance'
    ];
    const rows = filteredMembers.map((m) => [
      m.memberId,
      `"${m.fullName}"`,
      m.age,
      m.gender,
      m.memberCategory,
      m.membershipStatus,
      m.activityStatus,
      `"${m.contactNumber}"`,
      m.email || '',
      `"${m.committees.join(', ')}"`,
      `${m.attendancePercentage}%`,
      m.lastAttendanceDate || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MCGI_Youth_Members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by full name, Member ID, or contact number..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder-slate-400 shadow-2xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingMember(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Member</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <Upload className="h-4 w-4 text-slate-500" />
              <span>Import Data</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              title="Export filtered list to CSV"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white py-1 px-2.5 text-xs text-slate-700"
          >
            <option value="All">All Membership Statuses</option>
            <option value="Active">Active</option>
            <option value="On & Off">On & Off</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="Missing">Missing</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white py-1 px-2.5 text-xs text-slate-700"
          >
            <option value="All">All Categories</option>
            <option value="Junior">Junior (&lt;18)</option>
            <option value="Senior">Senior (18+)</option>
          </select>

          {/* Activity */}
          <select
            value={activityFilter}
            onChange={(e) => {
              setActivityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white py-1 px-2.5 text-xs text-slate-700"
          >
            <option value="All">All Activity Statuses</option>
            <option value="Regular">Regular</option>
            <option value="Active">Active</option>
            <option value="At Risk">At Risk</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Committee */}
          <select
            value={committeeFilter}
            onChange={(e) => {
              setCommitteeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white py-1 px-2.5 text-xs text-slate-700"
          >
            <option value="All">All Committees</option>
            {OFFICIAL_COMMITTEES.map((comm) => (
              <option key={comm} value={comm}>
                {comm}
              </option>
            ))}
          </select>

          <span className="ml-auto text-xs text-slate-500 font-medium">
            Found <span className="font-bold text-slate-900">{filteredMembers.length}</span> member(s)
          </span>
        </div>
      </div>

      {/* Responsive Member Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Member ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Membership Status</th>
                <th className="py-3 px-4">Activity Status</th>
                <th className="py-3 px-4">Committees</th>
                <th className="py-3 px-4 text-center">Attendance Rate</th>
                <th className="py-3 px-4">Last Attended</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No member records match the filter.</p>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
                  <tr key={member.memberId} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {member.memberId}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{member.fullName}</div>
                      <div className="text-[11px] text-slate-500">{member.contactNumber}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <StatusBadge status={member.memberCategory} />
                      <span className="text-[11px] text-slate-500 ml-1.5">({member.age} yrs)</span>
                    </td>

                    {/* Membership Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={member.membershipStatus} />
                    </td>

                    {/* Activity Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={member.activityStatus} />
                    </td>

                    {/* Committees */}
                    <td className="py-3 px-4 max-w-xs">
                      {member.committees && member.committees.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.committees.slice(0, 2).map((comm) => (
                            <span
                              key={comm}
                              className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded text-slate-700"
                            >
                              {comm}
                            </span>
                          ))}
                          {member.committees.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              +{member.committees.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">None</span>
                      )}
                    </td>

                    {/* Attendance Rate */}
                    <td className="py-3 px-4 text-center font-bold">
                      <span
                        className={`${
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

                    {/* Last Attended */}
                    <td className="py-3 px-4 text-slate-600">
                      {member.lastAttendanceDate || <span className="text-slate-400 italic">None</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedProfileMember(member)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                          title="View Profile & Attendance History"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingMember(member);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="Edit Member Information"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setArchiveTargetId(member.memberId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          title="Archive Member (Set Inactive)"
                        >
                          <Archive className="h-4 w-4" />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(member.memberId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredMembers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Member Profile Modal */}
      <MemberProfileModal
        isOpen={Boolean(selectedProfileMember)}
        onClose={() => setSelectedProfileMember(null)}
        member={selectedProfileMember}
        attendanceRecords={attendanceRecords}
      />

      {/* Member Form Modal */}
      <MemberFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={onSaveMember}
        initialMember={editingMember}
        existingMemberIds={members.map((m) => m.memberId)}
      />

      {/* Member Import Modal */}
      <MemberImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={onImportMembers}
        existingMemberIds={members.map((m) => m.memberId)}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(archiveTargetId)}
        onClose={() => setArchiveTargetId(null)}
        onConfirm={() => {
          if (archiveTargetId) onArchiveMember(archiveTargetId);
        }}
        title="Archive Youth Member?"
        message="Archiving will change this member's status to Inactive. Their historical attendance records and statistical contributions will be completely preserved."
        confirmLabel="Archive Member"
        variant="warning"
      />

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) onDeleteMember(deleteTargetId);
        }}
        title="Delete Member Record?"
        message="Are you sure you want to permanently delete this member record? This action cannot be undone."
        confirmLabel="Permanently Delete"
        variant="danger"
      />
    </div>
  );
};
