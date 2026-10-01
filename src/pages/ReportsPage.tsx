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
  Layers,
  Send,
  Sparkles,
  Users,
  Check,
  RefreshCw,
  Award,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { StatsService } from '../services/statsService';
import { ReportSnapshot, ReportPeriodType } from '../types/reports';
import { Modal } from '../components/common/Modal';
import { GasApiService } from '../services/gasApi';

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
  const [activeReportTab, setActiveReportTab] = useState<
    'official_sheet' | 'gatherings_attendance' | 'membership' | 'attendance' | 'activity' | 'demographics' | 'snapshots'
  >('official_sheet');

  // Snapshot modal
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [viewingSnapshot, setViewingSnapshot] = useState<ReportSnapshot | null>(null);

  // Sync state
  const [isPushingToSheet, setIsPushingToSheet] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Compute live statistics
  const currentMembershipStats = useMemo(() => StatsService.calculateMembershipStatistics(members), [members]);
  const currentDemographicStats = useMemo(() => StatsService.calculateDemographicStatistics(members), [members]);
  const currentAttendanceAnalytics = useMemo(
    () => StatsService.calculateAttendanceAnalytics(attendance, events, members),
    [attendance, events, members]
  );

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

  // Attendance of every gathering
  const gatheringsAttendance = useMemo(() => {
    return events.map((ev) => {
      const evRecords = attendance.filter((a) => a.eventId === ev.eventId);
      const present = evRecords.filter((a) => a.attendanceStatus === 'Present').length;
      const absent = evRecords.filter((a) => a.attendanceStatus === 'Absent').length;
      const late = evRecords.filter((a) => a.attendanceStatus === 'Late').length;
      const excused = evRecords.filter((a) => a.attendanceStatus === 'Excused').length;
      const totalLogged = evRecords.length;
      const qualifying = present + absent + late;
      const rate = qualifying > 0 ? Math.round(((present + late) / qualifying) * 1000) / 10 : 0;

      return {
        event: ev,
        totalLogged,
        present,
        absent,
        late,
        excused,
        rate,
      };
    });
  }, [events, attendance]);

  // 48 Official columns values array matching Google Sheet structure
  const officialColumnValues = useMemo(() => {
    const mem = currentMembershipStats;
    const demo = currentDemographicStats;

    return [
      mem.totalRegisteredMembers,
      mem.active.total,
      mem.active.junior,
      mem.active.senior,
      mem.onAndOff.total,
      mem.onAndOff.junior,
      mem.onAndOff.senior,
      mem.inactive.total,
      mem.inactive.junior,
      mem.inactive.senior,
      mem.suspended.total,
      mem.suspended.activeSuspended,
      mem.suspended.onAndOffSuspended,
      mem.suspended.inactiveRfa,
      mem.bilangNgNapatawad,
      mem.missing,
      mem.nbbYouth.overallTotal,
      mem.nbbYouth.june,
      mem.nbbYouth.july,
      mem.nbbYouth.august,
      demo.withCommitteeTotal,
      demo.multipleCommitteesCount,
      demo.committees['Artist Guild'] || 0,
      demo.committees['Broadcast'] || 0,
      demo.committees['Core Group'] || 0,
      demo.committees['MCGI DRRT'] || 0,
      demo.committees['Guest Coordinators'] || 0,
      demo.committees['LKD'] || 0,
      demo.committees['MCGI Bible Readers'] || 0,
      demo.committees['Music Ministry'] || 0,
      demo.committees['NAR'] || 0,
      demo.committees['Officers (Youth, GS, Locale/District)'] || 0,
      demo.committees['Photoville'] || 0,
      demo.committees['RACS'] || 0,
      demo.committees['Servants Ministry'] || 0,
      demo.committees['Teatro Kristiano'] || 0,
      demo.committees['T.O.C. (Thanksgiving Committee)'] || 0,
      demo.committees['Others'] || 0,
      demo.withoutCommitteeTotal,
      demo.education.totalStudents,
      demo.employment.youthWithWork,
      demo.voting.registeredVoters,
      demo.education.workingStudents,
      demo.education.outOfSchoolYouth,
      demo.parentStatus.motherOnly,
      demo.parentStatus.fatherOnly,
      demo.parentStatus.bothParents,
      demo.parentStatus.unbaptizedParents,
    ];
  }, [currentMembershipStats, currentDemographicStats]);

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
      createdBy: user?.fullName || 'Ascoville Youth Officer',
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

  // Push official summary directly to Google Sheets
  const handlePushToGoogleSheets = async () => {
    if (!GasApiService.isConfigured()) {
      setPushStatusMessage({
        type: 'error',
        text: 'Google Apps Script URL is not configured. Please set it in Settings -> Google Sheets.',
      });
      setTimeout(() => setPushStatusMessage(null), 5000);
      return;
    }

    setIsPushingToSheet(true);
    setPushStatusMessage(null);

    try {
      const res = await GasApiService.pushOfficialSummary({
        periodLabel,
        values: officialColumnValues,
      });

      if (res.success) {
        setPushStatusMessage({
          type: 'success',
          text: 'Successfully pushed official summary table to Google Sheets (OFFICIAL_SUMMARY tab)!',
        });
      } else {
        setPushStatusMessage({
          type: 'error',
          text: res.message || 'Failed to update Google Sheets.',
        });
      }
    } catch (err: any) {
      setPushStatusMessage({
        type: 'error',
        text: err.message || 'Error communicating with Google Sheets.',
      });
    } finally {
      setIsPushingToSheet(false);
      setTimeout(() => setPushStatusMessage(null), 6000);
    }
  };

  // Export to official CSV matching Google Sheets multi-header format
  const handleExportOfficialCsv = () => {
    const row1 = [
      ...Array(20).fill('MEMBERSHIP STATISTICS'),
      ...Array(28).fill('DEMOGRAPHICS'),
    ];

    const row2 = [
      '(AUTO) NUMBER OF REGISTERED MEMBERS',
      'ACTIVE MEMBERS', '', '',
      'ON & OFF', '', '',
      'INACTIVE MEMBERS', '', '',
      'SUSPENDED', '', '', '',
      'BILANG NG NAPATAWAD',
      'MISSING',
      'NBB Youth - 2nd Quarter', '', '', '',
      'WITH COMMITTEE', ...Array(17).fill(''),
      'WITHOUT COMMITTEE',
      'TOTAL NUMBER OF STUDENTS',
      'TOTAL NUMBER OF YOUTH MEMBERS WITH WORK',
      'TOTAL NUMBER OF REGISTERED VOTERS (18 YEARS & ABOVE)',
      'TOTAL NUMBER OF WORKING STUDENTS',
      'TOTAL NUMBER OF OUT OF SCHOOL YOUTH',
      'NUMBER OF YOUTH WITH BAPTIZED PARENT/S', '', '',
      'TOTAL NUMBER OF MCGI YOUTH WITH UNBAPTIZED PARENT/S',
    ];

    const row3 = [
      '(AUTO) NUMBER OF REGISTERED MEMBERS',
      '(AUTO) TOTAL ACTIVE MEMBERS (JUNIOR + SENIOR)',
      'JUNIOR (14 TO 24 YEARS OLD)',
      'SENIOR (25 YEARS OLD & ABOVE)',
      '(AUTO) TOTAL ON & OFF MEMBERS (JUNIOR + SENIOR)',
      'JUNIOR (14 TO 24 YEARS OLD)',
      'SENIOR (25 YEARS OLD & ABOVE)',
      '(AUTO) TOTAL INACTIVE MEMBERS (JUNIOR + SENIOR)',
      'JUNIOR (14 TO 24 YEARS OLD)',
      'SENIOR (25 YEARS OLD & ABOVE)',
      '(AUTO) TOTAL SUSPENDED MEMBERS (ACTIVE + ON & OFF + INACTIVE/RFA)',
      'ACTIVE SUSPENDED',
      'ON & OFF SUSPENDED',
      'INACTIVE / RFA',
      'BILANG NG NAPATAWAD',
      'MISSING',
      '(AUTO) OVERALL TOTAL',
      'JUNE',
      'JULY',
      'AUGUST',
      '(AUTO) OVERALL TOTAL',
      'MULTIPLE COMMITTEE',
      'ARTIST GUILD',
      'BROADCAST',
      'CORE GROUP',
      'MCGI DRRT',
      'GUEST COORDINATORS',
      'LKD',
      'MCGI BIBLE READERS',
      'MUSIC MINISTRY',
      'NAR',
      'OFFICERS (YOUTH, GS, LOCALE/DISTRICT)',
      'PHOTOVILLE',
      'RACS',
      'SERVANTS MINISTRY',
      'TEATRO KRISTIANO',
      'T.O.C. (THANKSGIVING COMMITTEE)',
      'OTHERS',
      'WITHOUT COMMITTEE',
      'TOTAL NUMBER OF STUDENTS',
      'TOTAL NUMBER OF YOUTH MEMBERS WITH WORK',
      'TOTAL NUMBER OF REGISTERED VOTERS (18 YEARS & ABOVE)',
      'TOTAL NUMBER OF WORKING STUDENTS',
      'TOTAL NUMBER OF OUT OF SCHOOL YOUTH',
      'MOTHER ONLY',
      'FATHER ONLY',
      'BOTH MOTHER & FATHER',
      'TOTAL NUMBER OF MCGI YOUTH WITH UNBAPTIZED PARENT/S',
    ];

    const escapeCsv = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csvContent = [
      row1.map(escapeCsv).join(','),
      row2.map(escapeCsv).join(','),
      row3.map(escapeCsv).join(','),
      officialColumnValues.map(escapeCsv).join(','),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MCGI_Youth_Ascoville_Membership_Demographics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Official Administrative Reports · Local of Ascoville</span>
            </h2>
            <p className="text-xs text-slate-500">
              MCGI Youth official membership statistics, demographic breakdown, and per-gathering attendance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePushToGoogleSheets}
              disabled={isPushingToSheet}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              title="Push official 48-column summary table to Google Sheets"
            >
              <Send className={`h-3.5 w-3.5 ${isPushingToSheet ? 'animate-pulse' : ''}`} />
              <span>{isPushingToSheet ? 'Syncing to Sheet...' : 'Push to Google Sheets'}</span>
            </button>

            <button
              onClick={handleExportOfficialCsv}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
              title="Download official CSV matching Google Sheets multi-header format"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Official CSV</span>
            </button>

            <button
              onClick={() => {
                setSnapshotTitle(`Official Youth Report (${periodLabel})`);
                setIsSnapshotModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-slate-500" />
              <span>Save Snapshot</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {pushStatusMessage && (
          <div
            className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
              pushStatusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {pushStatusMessage.type === 'success' ? (
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <Filter className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{pushStatusMessage.text}</span>
          </div>
        )}

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
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  periodType === type ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {periodType === 'Monthly' && (
            <input
              type="month"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              className="rounded-lg border border-slate-300 py-1 px-2.5 text-xs font-semibold text-slate-800 bg-white"
            />
          )}

          {periodType === 'Quarterly' && (
            <select
              value={periodQuarter}
              onChange={(e) => setPeriodQuarter(e.target.value)}
              className="rounded-lg border border-slate-300 py-1 px-2.5 text-xs font-semibold text-slate-800 bg-white"
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
              className="rounded-lg border border-slate-300 py-1 px-2.5 text-xs font-semibold text-slate-800 bg-white"
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
                className="rounded-lg border border-slate-300 py-1 px-2 text-xs bg-white"
              />
              <span>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border border-slate-300 py-1 px-2 text-xs bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex border-b border-slate-200 no-print overflow-x-auto">
        <button
          onClick={() => setActiveReportTab('official_sheet')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeReportTab === 'official_sheet'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
          <span>Official Summary Sheet (MCGI Format)</span>
        </button>

        <button
          onClick={() => setActiveReportTab('gatherings_attendance')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeReportTab === 'gatherings_attendance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="h-3.5 w-3.5 text-blue-600" />
          <span>Attendance of Every Gathering ({gatheringsAttendance.length})</span>
        </button>

        <button
          onClick={() => setActiveReportTab('membership')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeReportTab === 'membership'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Membership Registry
        </button>

        <button
          onClick={() => setActiveReportTab('attendance')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeReportTab === 'attendance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Attendance Performance
        </button>

        <button
          onClick={() => setActiveReportTab('activity')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeReportTab === 'activity'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Member Activity & At-Risk
        </button>

        <button
          onClick={() => setActiveReportTab('demographics')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeReportTab === 'demographics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Demographic Profile
        </button>

        <button
          onClick={() => setActiveReportTab('snapshots')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
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
            MCGI YOUTH MINISTRY · LOCAL OF ASCOVILLE
          </div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            OFFICIAL ADMINISTRATIVE REPORT & SPREADSHEET SUMMARY
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Reporting Period: <strong className="text-slate-900">{periodLabel}</strong> • Single Source of Truth: Google Sheets
          </p>
        </div>

        {/* Tab 0: Master Official MCGI Summary Sheet View */}
        {activeReportTab === 'official_sheet' && (
          <div className="space-y-6">
            {/* 1. First: Attendance of Every Gathering Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-700" />
                    <span>Part 1: Attendance of Every Gathering</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Live recorded attendance figures for sacred gatherings and spiritual services.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-700">
                    Total Gatherings: <strong className="text-blue-800">{events.length}</strong>
                  </span>
                  <span className="font-semibold text-slate-700">
                    Overall Rate: <strong className="text-emerald-700">{currentAttendanceAnalytics.overallAttendanceRate}%</strong>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Gathering Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Date / Schedule</th>
                      <th className="py-2.5 px-3 text-center">Present</th>
                      <th className="py-2.5 px-3 text-center">Absent</th>
                      <th className="py-2.5 px-3 text-center">Late</th>
                      <th className="py-2.5 px-3 text-center">Excused</th>
                      <th className="py-2.5 px-3 text-center font-bold">Total Logs</th>
                      <th className="py-2.5 px-3 text-right">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {gatheringsAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-slate-400 italic">
                          No gatherings recorded yet. Create an event in Attendance to start logging attendance.
                        </td>
                      </tr>
                    ) : (
                      gatheringsAttendance.map((g) => (
                        <tr key={g.event.eventId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{g.event.eventName}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {g.event.eventType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{g.event.startDate}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{g.present}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-rose-700">{g.absent}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-amber-700">{g.late}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{g.excused}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{g.totalLogged}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-xs ${
                                g.rate >= 75
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : g.rate >= 50
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {g.rate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Main: Official Membership Statistics & Demographics 48-Column Summary */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>Part 2: Official Membership Statistics & Demographics Summary</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Exact 48-column Google Sheets layout with auto-calculated formulas matching the official reporting template.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    Scroll horizontally to inspect all 48 columns →
                  </span>
                </div>
              </div>

              {/* Multi-Tier Responsive Table */}
              <div className="overflow-x-auto border-2 border-slate-800 rounded-xl shadow-md bg-white">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    {/* Header Row 1: Grand Categories */}
                    <tr className="text-white text-xs font-black uppercase tracking-wider text-center">
                      <th colSpan={20} className="py-2 px-3 bg-blue-900 border-r border-white/20">
                        MEMBERSHIP STATISTICS
                      </th>
                      <th colSpan={28} className="py-2 px-3 bg-emerald-800">
                        DEMOGRAPHICS
                      </th>
                    </tr>

                    {/* Header Row 2: Major Groupings */}
                    <tr className="bg-slate-900 text-white text-[11px] font-bold text-center border-b border-white/10">
                      <th className="py-2 px-2.5 border-r border-slate-700 min-w-[120px]">
                        (AUTO) REGISTERED
                      </th>
                      <th colSpan={3} className="py-2 px-2.5 border-r border-slate-700 bg-slate-800/80">
                        ACTIVE MEMBERS
                      </th>
                      <th colSpan={3} className="py-2 px-2.5 border-r border-slate-700 bg-slate-800/50">
                        ON & OFF
                      </th>
                      <th colSpan={3} className="py-2 px-2.5 border-r border-slate-700 bg-slate-800/80">
                        INACTIVE MEMBERS
                      </th>
                      <th colSpan={4} className="py-2 px-2.5 border-r border-slate-700 bg-purple-950/80">
                        SUSPENDED
                      </th>
                      <th className="py-2 px-2.5 border-r border-slate-700 bg-emerald-950/60 min-w-[90px]">
                        BILANG NG NAPATAWAD
                      </th>
                      <th className="py-2 px-2.5 border-r border-slate-700 min-w-[80px]">
                        MISSING
                      </th>
                      <th colSpan={4} className="py-2 px-2.5 border-r border-slate-700 bg-blue-950/80">
                        NBB Youth - 2nd Quarter
                      </th>
                      <th colSpan={18} className="py-2 px-2.5 border-r border-slate-700 bg-emerald-950/70">
                        WITH COMMITTEE
                      </th>
                      <th className="py-2 px-2.5 border-r border-slate-700 min-w-[100px]">
                        WITHOUT COMMITTEE
                      </th>
                      <th className="py-2 px-2.5 border-r border-slate-700 min-w-[90px]">
                        STUDENTS
                      </th>
                      <th className="py-2 px-2.5 border-r border-slate-700 min-w-[100px]">
                        WITH WORK
                      </th>
                      <th className="py-2 px-2.5 border-r border-slate-700 min-w-[110px]">
                        VOTERS (18+)
                      </th>
                      <th className="py-2 px-2.5 border-r border-slate-700 min-w-[100px]">
                        WORKING STUDENTS
                      </th>
                      <th className="py-2 px-2.5 border-r border-slate-700 min-w-[90px]">
                        OSY
                      </th>
                      <th colSpan={3} className="py-2 px-2.5 border-r border-slate-700 bg-slate-800">
                        BAPTIZED PARENT/S
                      </th>
                      <th className="py-2 px-2.5 min-w-[120px] bg-slate-900">
                        UNBAPTIZED PARENT/S
                      </th>
                    </tr>

                    {/* Header Row 3: Sub-Headers (Exact 48 Columns) */}
                    <tr className="bg-slate-100 text-slate-800 text-[10px] font-bold text-center border-b-2 border-slate-300">
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[110px]">NUMBER OF REGISTERED MEMBERS</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[90px] text-blue-900 font-extrabold bg-blue-50/50">TOTAL ACTIVE</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[85px]">JUNIOR (14-24)</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[85px]">SENIOR (25+)</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[90px] text-amber-900 font-extrabold bg-amber-50/50">TOTAL ON & OFF</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[85px]">JUNIOR (14-24)</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[85px]">SENIOR (25+)</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[90px] text-rose-900 font-extrabold bg-rose-50/50">TOTAL INACTIVE</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[85px]">JUNIOR (14-24)</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[85px]">SENIOR (25+)</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[95px] text-purple-900 font-extrabold bg-purple-50/50">TOTAL SUSPENDED</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">ACTIVE SUSP</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">ON&OFF SUSP</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[85px]">INACTIVE/RFA</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[90px] text-emerald-800 bg-emerald-50 font-extrabold">BILANG NG NAPATAWAD</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[70px]">MISSING</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[90px] text-blue-900 font-extrabold bg-blue-50/50">OVERALL TOTAL</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[65px]">JUNE</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[65px]">JULY</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[65px]">AUGUST</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[90px] text-emerald-900 font-extrabold bg-emerald-50">OVERALL TOTAL</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">MULTIPLE COMM</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[75px]">ARTIST GUILD</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[75px]">BROADCAST</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[75px]">CORE GROUP</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[75px]">MCGI DRRT</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">GUEST COORD</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[65px]">LKD</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">BIBLE READERS</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">MUSIC MINISTRY</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[65px]">NAR</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">OFFICERS</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[75px]">PHOTOVILLE</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[65px]">RACS</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">SERVANTS</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">TEATRO</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[75px]">T.O.C.</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[65px]">OTHERS</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[90px] text-amber-800">WITHOUT COMM</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">STUDENTS</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">WITH WORK</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[85px]">VOTERS (18+)</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[85px]">WORKING STUD</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[75px]">OSY</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">MOTHER ONLY</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[80px]">FATHER ONLY</th>
                      <th className="py-2 px-2 border-r border-slate-300 min-w-[85px]">BOTH PARENTS</th>
                      <th className="py-2 px-2 min-w-[95px] text-slate-700">UNBAPTIZED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Live Values Row */}
                    <tr className="bg-white font-black text-center text-xs divide-x divide-slate-200">
                      {officialColumnValues.map((val, idx) => (
                        <td
                          key={idx}
                          className={`py-3.5 px-2 ${
                            idx === 0
                              ? 'text-blue-900 bg-blue-50/40 text-sm'
                              : idx === 1
                              ? 'text-emerald-700 bg-emerald-50/40 text-sm'
                              : idx === 4
                              ? 'text-amber-700 bg-amber-50/30'
                              : idx === 7
                              ? 'text-rose-700 bg-rose-50/30'
                              : idx === 10
                              ? 'text-purple-700 bg-purple-50/30'
                              : idx === 14
                              ? 'text-emerald-800 bg-emerald-100/40'
                              : idx === 20
                              ? 'text-emerald-900 bg-emerald-50/50 text-sm'
                              : 'text-slate-900'
                          }`}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Attendance of Gatherings Dedicated View */}
        {activeReportTab === 'gatherings_attendance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Gathering Attendance Detailed Report
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 border rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Gatherings</span>
                <span className="text-xl font-bold text-slate-900">{events.length}</span>
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

            <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-bold text-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Gathering Title</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Present</th>
                    <th className="py-2.5 px-3 text-center">Absent</th>
                    <th className="py-2.5 px-3 text-center">Late</th>
                    <th className="py-2.5 px-3 text-center">Excused</th>
                    <th className="py-2.5 px-3 text-center font-bold">Total Enrolled</th>
                    <th className="py-2.5 px-3 text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gatheringsAttendance.map((g) => (
                    <tr key={g.event.eventId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{g.event.eventName}</td>
                      <td className="py-2.5 px-3">{g.event.eventType}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{g.event.startDate}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{g.present}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-700">{g.absent}</td>
                      <td className="py-2.5 px-3 text-center text-amber-700">{g.late}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{g.excused}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">{g.totalLogged}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-700">{g.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Membership Report */}
        {activeReportTab === 'membership' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Membership Registry Summary
            </h3>
            <table className="w-full text-xs text-left border border-slate-300">
              <thead className="bg-slate-100 font-bold text-slate-800">
                <tr>
                  <th className="py-2.5 px-3 border-b">Classification</th>
                  <th className="py-2.5 px-3 border-b text-center">Junior (14 to 24 yrs old)</th>
                  <th className="py-2.5 px-3 border-b text-center">Senior (25 yrs & above)</th>
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
                <tr>
                  <td className="py-2 px-3 font-semibold text-emerald-800">Bilang ng Napatawad</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-center font-bold text-emerald-700">{currentMembershipStats.bilangNgNapatawad}</td>
                  <td className="py-2 px-3 text-right">-</td>
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

        {/* Tab 3: Attendance Performance Report */}
        {activeReportTab === 'attendance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Attendance Performance Summary
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

        {/* Tab 4: Member Activity Report */}
        {activeReportTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Member Activity & At-Risk Status
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

        {/* Tab 5: Complete Demographic Profile */}
        {activeReportTab === 'demographics' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Complete Demographic Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-lg p-3">
                <span className="font-bold text-xs text-slate-800 block mb-2">Age Brackets (Official):</span>
                <ul className="text-xs space-y-1 text-slate-600">
                  <li>Junior Youth (14 to 24 yrs old): <strong>{currentDemographicStats.age.junior}</strong></li>
                  <li>Senior Youth (25 yrs & above): <strong>{currentDemographicStats.age.senior}</strong></li>
                </ul>
              </div>

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
                  <li>Registered Voters (18+): <strong>{currentDemographicStats.voting.registeredVoters}</strong></li>
                </ul>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3">
              <span className="font-bold text-xs text-slate-800 block mb-2">Parent Baptism Status:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>Mother Only: <strong>{currentDemographicStats.parentStatus.motherOnly}</strong></div>
                <div>Father Only: <strong>{currentDemographicStats.parentStatus.fatherOnly}</strong></div>
                <div>Both Parents: <strong>{currentDemographicStats.parentStatus.bothParents}</strong></div>
                <div>Unbaptized Parent/s: <strong>{currentDemographicStats.parentStatus.unbaptizedParents}</strong></div>
              </div>
            </div>

            {/* Committees count list */}
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-800">Committees Breakdown:</span>
                <span className="text-xs text-slate-500">
                  With Committee: <strong>{currentDemographicStats.withCommitteeTotal}</strong> | Without: <strong>{currentDemographicStats.withoutCommitteeTotal}</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {Object.entries(currentDemographicStats.committees).map(([cName, count]) => (
                  <div key={cName} className="p-1.5 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                    <span className="truncate pr-1 text-slate-700">{cName}:</span>
                    <strong className="text-blue-900">{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Saved Snapshots */}
        {activeReportTab === 'snapshots' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Preserved Report Snapshots ({reports.length})
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
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
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
              Ascoville Youth Committee
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
              placeholder="e.g. Final locale report submitted for pastoral review."
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSnapshotModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
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
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white cursor-pointer"
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
