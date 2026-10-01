import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Save,
  Download,
  Printer,
  History,
  CheckCircle,
  FileSpreadsheet,
  Clock,
  Eye,
  Filter,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { StatsService } from '../services/statsService';
import { ReportSnapshot, ReportPeriodType } from '../types/reports';
import { Modal } from '../components/common/Modal';

export const ReportsPage: React.FC = () => {
  const { members, events, attendance, reports, saveReportSnapshot } = useAppData();
  const { user } = useAuth();

  // Period state
  const [periodType, setPeriodType] = useState<ReportPeriodType>('Monthly');
  const [periodMonth, setPeriodMonth] = useState<string>('2026-09');
  const [periodQuarter, setPeriodQuarter] = useState<string>('Q3 2026');
  const [periodYear, setPeriodYear] = useState<string>('2026');
  const [customStart, setCustomStart] = useState<string>('2026-09-01');
  const [customEnd, setCustomEnd] = useState<string>('2026-09-30');

  // Active Report Tab
  const [activeReportTab, setActiveReportTab] = useState<'membership' | 'attendance' | 'activity' | 'demographics' | 'snapshots'>('membership');

  // Snapshot modal
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [viewingSnapshot, setViewingSnapshot] = useState<ReportSnapshot | null>(null);

  // Compute live statistics
  const currentMembershipStats = useMemo(() => StatsService.calculateMembershipStatistics(members), [members]);
  const currentDemographicStats = useMemo(() => StatsService.calculateDemographicStatistics(members), [members]);
  const currentAttendanceAnalytics = useMemo(() => StatsService.calculateAttendanceAnalytics(attendance, events, members), [attendance, events, members]);

  // Label for current period
  const periodLabel = useMemo(() => {
    switch (periodType) {
      case 'Monthly':
        return `Monthly: ${periodMonth}`;
      case 'Quarterly':
        return `Quarter: ${periodQuarter}`;
      case 'Yearly':
        return `Year: ${periodYear}`;
      case 'Custom':
        return `Custom: ${customStart} to ${customEnd}`;
    }
  }, [periodType, periodMonth, periodQuarter, periodYear, customStart, customEnd]);

  // Save snapshot handler
  const handleSaveSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = snapshotTitle.trim() || `Official Youth Report - ${periodLabel}`;

    const newSnapshot: ReportSnapshot = {
      snapshotId: `SNP-${Date.now().toString().slice(-6)}`,
      title,
      periodType,
      periodLabel,
      startDate: periodType === 'Custom' ? customStart : '2026-09-01',
      endDate: periodType === 'Custom' ? customEnd : '2026-09-30',
      createdAt: new Date().toISOString(),
      createdBy: user?.fullName || 'District Youth Officer',
      notes: snapshotNotes,
      membershipStats: currentMembershipStats,
      demographicStats: currentDemographicStats,
      attendanceSummary: {
        totalEvents: events.length,
        totalAttendanceRecords: attendance.length,
        presentRate: currentAttendanceAnalytics.overallAttendanceRate,
        presentCount: currentAttendanceAnalytics.presentCount,
        absentCount: currentAttendanceAnalytics.absentCount,
        excusedCount: currentAttendanceAnalytics.excusedCount,
        lateCount: currentAttendanceAnalytics.lateCount,
      },
    };

    await saveReportSnapshot(newSnapshot);
    setIsSnapshotModalOpen(false);
    setSnapshotTitle('');
    setSnapshotNotes('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Period Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Official Administrative Reports</h2>
            <p className="text-xs text-slate-500">
              Generate submission-ready reports and preserve historical report snapshots in Google Sheets
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSnapshotTitle(`Official Youth Report (${periodLabel})`);
                setIsSnapshotModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              <span>Save Report Snapshot</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Period Selector Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>Reporting Period:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['Monthly', 'Quarterly', 'Yearly', 'Custom'] as ReportPeriodType[]).map((type) => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  periodType === type ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Conditional Date Pickers based on Period Type */}
          {periodType === 'Monthly' && (
            <input
              type="month"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              className="rounded-lg border border-slate-300 py-1 px-2.5 text-xs font-semibold text-slate-800"
            />
          )}

          {periodType === 'Quarterly' && (
            <select
              value={periodQuarter}
              onChange={(e) => setPeriodQuarter(e.target.value)}
              className="rounded-lg border border-slate-300 py-1 px-2.5 text-xs font-semibold text-slate-800"
            >
              <option value="Q1 2026">Q1 2026 (Jan - Mar)</option>
              <option value="Q2 2026">Q2 2026 (Apr - Jun)</option>
              <option value="Q3 2026">Q3 2026 (Jul - Sep)</option>
              <option value="Q4 2026">Q4 2026 (Oct - Dec)</option>
            </select>
          )}

          {periodType === 'Yearly' && (
            <select
              value={periodYear}
              onChange={(e) => setPeriodYear(e.target.value)}
              className="rounded-lg border border-slate-300 py-1 px-2.5 text-xs font-semibold text-slate-800"
            >
              <option value="2026">Year 2026</option>
              <option value="2025">Year 2025</option>
            </select>
          )}

          {periodType === 'Custom' && (
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border border-slate-300 py-1 px-2 text-xs"
              />
              <span>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border border-slate-300 py-1 px-2 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex border-b border-slate-200 no-print">
        <button
          onClick={() => setActiveReportTab('membership')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
            activeReportTab === 'membership'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Membership Report
        </button>
        <button
          onClick={() => setActiveReportTab('attendance')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
            activeReportTab === 'attendance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Attendance Report
        </button>
        <button
          onClick={() => setActiveReportTab('activity')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
            activeReportTab === 'activity'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Member Activity Report
        </button>
        <button
          onClick={() => setActiveReportTab('demographics')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
            activeReportTab === 'demographics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Demographic Report
        </button>
        <button
          onClick={() => setActiveReportTab('snapshots')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeReportTab === 'snapshots'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Saved Snapshots ({reports.length})</span>
        </button>
      </div>

      {/* Printable Official Report Document Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs print-break-inside">
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
          <div className="inline-block bg-blue-900 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded tracking-widest mb-1">
            MCGI YOUTH MINISTRY
          </div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            OFFICIAL ADMINISTRATIVE REPORT
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Reporting Period: <strong className="text-slate-900">{periodLabel}</strong> • Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Tab 1: Membership Report */}
        {activeReportTab === 'membership' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Membership Registry Summary
            </h3>
            <table className="w-full text-xs text-left border border-slate-300">
              <thead className="bg-slate-100 font-bold text-slate-800">
                <tr>
                  <th className="py-2.5 px-3 border-b">Classification</th>
                  <th className="py-2.5 px-3 border-b text-center">Junior (&lt; 18)</th>
                  <th className="py-2.5 px-3 border-b text-center">Senior (18+)</th>
                  <th className="py-2.5 px-3 border-b text-center font-bold">Total</th>
                  <th className="py-2.5 px-3 border-b text-right">% of Registry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2 px-3 font-semibold text-emerald-800">Active Members</td>
                  <td className="py-2 px-3 text-center">{currentMembershipStats.active.junior}</td>
                  <td className="py-2 px-3 text-center">{currentMembershipStats.active.senior}</td>
                  <td className="py-2 px-3 text-center font-bold text-emerald-700">{currentMembershipStats.active.total}</td>
                  <td className="py-2 px-3 text-right">
                    {members.length > 0 ? `${Math.round((currentMembershipStats.active.total / members.length) * 100)}%` : '0%'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-amber-800">On & Off Members</td>
                  <td className="py-2 px-3 text-center">{currentMembershipStats.onAndOff.junior}</td>
                  <td className="py-2 px-3 text-center">{currentMembershipStats.onAndOff.senior}</td>
                  <td className="py-2 px-3 text-center font-bold text-amber-700">{currentMembershipStats.onAndOff.total}</td>
                  <td className="py-2 px-3 text-right">
                    {members.length > 0 ? `${Math.round((currentMembershipStats.onAndOff.total / members.length) * 100)}%` : '0%'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-rose-800">Inactive Members</td>
                  <td className="py-2 px-3 text-center">{currentMembershipStats.inactive.junior}</td>
                  <td className="py-2 px-3 text-center">{currentMembershipStats.inactive.senior}</td>
                  <td className="py-2 px-3 text-center font-bold text-rose-700">{currentMembershipStats.inactive.total}</td>
                  <td className="py-2 px-3 text-right">
                    {members.length > 0 ? `${Math.round((currentMembershipStats.inactive.total / members.length) * 100)}%` : '0%'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-purple-800">Suspended Total</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-center font-bold text-purple-700">{currentMembershipStats.suspended.total}</td>
                  <td className="py-2 px-3 text-right">
                    {members.length > 0 ? `${Math.round((currentMembershipStats.suspended.total / members.length) * 100)}%` : '0%'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-700">Missing Members</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-center font-bold text-slate-800">{currentMembershipStats.missing}</td>
                  <td className="py-2 px-3 text-right">
                    {members.length > 0 ? `${Math.round((currentMembershipStats.missing / members.length) * 100)}%` : '0%'}
                  </td>
                </tr>
                <tr className="bg-slate-100 font-black">
                  <td className="py-2.5 px-3 uppercase">Total Registered</td>
                  <td className="py-2.5 px-3 text-center">
                    {currentMembershipStats.active.junior + currentMembershipStats.onAndOff.junior + currentMembershipStats.inactive.junior}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {currentMembershipStats.active.senior + currentMembershipStats.onAndOff.senior + currentMembershipStats.inactive.senior}
                  </td>
                  <td className="py-2.5 px-3 text-center text-blue-900">{currentMembershipStats.totalRegisteredMembers}</td>
                  <td className="py-2.5 px-3 text-right">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Attendance Report */}
        {activeReportTab === 'attendance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Attendance Performance Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 border rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Records</span>
                <span className="text-xl font-bold text-slate-900">{currentAttendanceAnalytics.totalRecords}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-[10px] text-emerald-700 uppercase font-bold block">Present Marks</span>
                <span className="text-xl font-bold text-emerald-800">{currentAttendanceAnalytics.presentCount}</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <span className="text-[10px] text-rose-700 uppercase font-bold block">Absent Marks</span>
                <span className="text-xl font-bold text-rose-800">{currentAttendanceAnalytics.absentCount}</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-[10px] text-blue-700 uppercase font-bold block">Overall Rate</span>
                <span className="text-xl font-bold text-blue-800">{currentAttendanceAnalytics.overallAttendanceRate}%</span>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-4">
              Breakdown by Event Type
            </h4>
            <table className="w-full text-xs text-left border border-slate-300">
              <thead className="bg-slate-100 font-bold text-slate-800">
                <tr>
                  <th className="py-2 px-3 border-b">Event Type</th>
                  <th className="py-2 px-3 border-b text-center">Attendance Logs</th>
                  <th className="py-2 px-3 border-b text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentAttendanceAnalytics.byEventType.map((item) => (
                  <tr key={item.eventType}>
                    <td className="py-2 px-3 font-semibold">{item.eventType}</td>
                    <td className="py-2 px-3 text-center">{item.count}</td>
                    <td className="py-2 px-3 text-right font-bold text-blue-700">{item.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Member Activity Report */}
        {activeReportTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Member Activity & At-Risk Status
            </h3>
            <p className="text-xs text-slate-600">
              Members identified as At-Risk or Inactive based on current activity thresholds:
            </p>

            <table className="w-full text-xs text-left border border-slate-300">
              <thead className="bg-slate-100 font-bold text-slate-800">
                <tr>
                  <th className="py-2 px-3 border-b">Member Name</th>
                  <th className="py-2 px-3 border-b">Status</th>
                  <th className="py-2 px-3 border-b">Activity</th>
                  <th className="py-2 px-3 border-b text-center">Rate</th>
                  <th className="py-2 px-3 border-b">Assessment Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {members
                  .filter((m) => m.activityStatus === 'At Risk' || m.activityStatus === 'Inactive')
                  .map((m) => (
                    <tr key={m.memberId}>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {m.fullName} <span className="text-[10px] text-slate-500 font-normal">({m.memberId})</span>
                      </td>
                      <td className="py-2 px-3">{m.membershipStatus}</td>
                      <td className="py-2 px-3 font-bold text-amber-700">{m.activityStatus}</td>
                      <td className="py-2 px-3 text-center font-bold">{m.attendancePercentage}%</td>
                      <td className="py-2 px-3 text-slate-600 italic">{m.activityReason || 'Below required threshold'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Demographic Report */}
        {activeReportTab === 'demographics' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              4. Complete Demographic Profile
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-3">
                <span className="font-bold text-xs text-slate-800 block mb-2">Education Classification:</span>
                <ul className="text-xs space-y-1 text-slate-600">
                  <li>Total Students: <strong>{currentDemographicStats.education.totalStudents}</strong></li>
                  <li>Working Students: <strong>{currentDemographicStats.education.workingStudents}</strong></li>
                  <li>Out-of-School Youths: <strong>{currentDemographicStats.education.outOfSchoolYouth}</strong></li>
                </ul>
              </div>

              <div className="border border-slate-200 rounded-lg p-3">
                <span className="font-bold text-xs text-slate-800 block mb-2">Employment & Voting:</span>
                <ul className="text-xs space-y-1 text-slate-600">
                  <li>Youth With Work: <strong>{currentDemographicStats.employment.youthWithWork}</strong></li>
                  <li>Not Working: <strong>{currentDemographicStats.employment.notWorking}</strong></li>
                  <li>Registered Voters: <strong>{currentDemographicStats.voting.registeredVoters}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Saved Snapshots */}
        {activeReportTab === 'snapshots' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              5. Preserved Report Snapshots ({reports.length})
            </h3>
            <p className="text-xs text-slate-500">
              Snapshots preserve the exact historical statistics of the reporting period and are stored in the REPORTS Google Sheet tab.
            </p>

            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No report snapshots saved yet. Click "Save Report Snapshot" above to create one.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {reports.map((snap) => (
                  <div key={snap.snapshotId} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{snap.title}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                          {snap.periodLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Created by {snap.createdBy} on {new Date(snap.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      onClick={() => setViewingSnapshot(snap)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Snapshot</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Signatures Footer for Official Submission */}
        <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">
              {user?.fullName || 'Authorized Youth Officer'}
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Prepared By (Youth Officer)</span>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">
              District Youth Committee
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Reviewed By (Core Group)</span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">
              Assigned Worker
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Noted / Approved By</span>
          </div>
        </div>
      </div>

      {/* Snapshot Modal */}
      <Modal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        title="Save Official Report Snapshot"
        subtitle="Freezes current statistics for submission and preserves in Google Sheets"
        maxWidth="md"
      >
        <form onSubmit={handleSaveSnapshot} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Snapshot Title *
            </label>
            <input
              type="text"
              required
              value={snapshotTitle}
              onChange={(e) => setSnapshotTitle(e.target.value)}
              placeholder="e.g. September 2026 Monthly Youth Report"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Period Label
            </label>
            <input
              type="text"
              readOnly
              value={periodLabel}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Submitting Officer Remarks
            </label>
            <textarea
              rows={3}
              value={snapshotNotes}
              onChange={(e) => setSnapshotNotes(e.target.value)}
              placeholder="e.g. Final district report submitted for pastoral review."
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSnapshotModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              Preserve Snapshot
            </button>
          </div>
        </form>
      </Modal>

      {/* Snapshot Inspection Modal */}
      {viewingSnapshot && (
        <Modal
          isOpen={Boolean(viewingSnapshot)}
          onClose={() => setViewingSnapshot(null)}
          title={`Snapshot: ${viewingSnapshot.title}`}
          subtitle={`Preserved on ${new Date(viewingSnapshot.createdAt).toLocaleDateString()} by ${viewingSnapshot.createdBy}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800 block">Period:</span>
              <span className="text-slate-600">{viewingSnapshot.periodLabel}</span>
              {viewingSnapshot.notes && (
                <p className="mt-1 italic text-slate-500">"{viewingSnapshot.notes}"</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                <span className="text-[10px] text-blue-700 font-bold block uppercase">Total Members</span>
                <span className="text-lg font-black text-blue-900">{viewingSnapshot.membershipStats.totalRegisteredMembers}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">Active Members</span>
                <span className="text-lg font-black text-emerald-900">{viewingSnapshot.membershipStats.active.total}</span>
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                <span className="text-[10px] text-amber-700 font-bold block uppercase">On & Off</span>
                <span className="text-lg font-black text-amber-900">{viewingSnapshot.membershipStats.onAndOff.total}</span>
              </div>
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg">
                <span className="text-[10px] text-rose-700 font-bold block uppercase">Inactive</span>
                <span className="text-lg font-black text-rose-900">{viewingSnapshot.membershipStats.inactive.total}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setViewingSnapshot(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
