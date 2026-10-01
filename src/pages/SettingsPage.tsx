import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  FileText,
  Download,
  Upload,
  Check,
  Save,
  RefreshCw,
  History,
  Shield,
  Layers,
  Users,
  ShieldCheck,
  UserCheck,
  Key,
  Plus,
  Trash2,
  Edit2,
  Lock,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { OfficerAccount, UserRole } from '../data/defaultOfficers';
import { AttendanceRules, AttendanceCountingMethod, CommitteeSettingItem } from '../types/settings';
import { DEFAULT_COMMITTEE_SETTINGS } from '../data/sampleCommittees';
import { Pagination } from '../components/common/Pagination';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    saveSettings,
    logs,
    statusHistory,
    exportBackup,
    restoreBackup,
  } = useAppData();

  const { officers, saveOfficer, deleteOfficer, isAdmin, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'rules' | 'committees' | 'officers' | 'logs' | 'history' | 'backup'>('rules');

  // Committee management state
  const [committeeList, setCommitteeList] = useState<CommitteeSettingItem[]>(
    settings.committees && settings.committees.length > 0 ? settings.committees : DEFAULT_COMMITTEE_SETTINGS
  );
  const [committeeSearch, setCommitteeSearch] = useState('');
  const [committeeSaveMsg, setCommitteeSaveMsg] = useState<string | null>(null);
  const [isSavingCommittees, setIsSavingCommittees] = useState(false);
  const [commModalOpen, setCommModalOpen] = useState(false);
  const [editingComm, setEditingComm] = useState<CommitteeSettingItem | null>(null);
  const [commForm, setCommForm] = useState({
    name: '',
    alias: '',
    description: '',
    isActive: true,
  });

  // Form state for rules
  const [rulesForm, setRulesForm] = useState<AttendanceRules>({ ...settings.attendanceRules });
  const [rulesSaveMessage, setRulesSaveMessage] = useState<string | null>(null);
  const [isSavingRules, setIsSavingRules] = useState(false);

  // Officer management state
  const [officerModalOpen, setOfficerModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<OfficerAccount | null>(null);
  const [revealedPasskeys, setRevealedPasskeys] = useState<Record<string, boolean>>({});
  const [officerForm, setOfficerForm] = useState({
    username: '',
    fullName: '',
    role: 'OFFICER' as UserRole,
    email: '',
    title: '',
    passkey: '',
    status: 'Active' as 'Active' | 'Suspended',
  });
  const [officerActionMsg, setOfficerActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination for logs & history
  const [logsPage, setLogsPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const pageSize = 15;

  // Backup restore state
  const [restoreText, setRestoreText] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRules(true);
    setRulesSaveMessage(null);

    const updatedSettings = {
      ...settings,
      attendanceRules: { ...rulesForm },
    };

    const res = await saveSettings(updatedSettings);
    setIsSavingRules(false);
    setRulesSaveMessage(res.message);
    setTimeout(() => setRulesSaveMessage(null), 4000);
  };

  const handleDownloadBackup = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MCGI_Youth_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExecuteRestore = () => {
    if (!restoreText.trim()) return;
    const ok = restoreBackup(restoreText);
    if (ok) {
      setRestoreStatus('Database successfully restored from backup.');
      setRestoreText('');
    } else {
      setRestoreStatus('Failed to parse backup JSON. Please verify data integrity.');
    }
  };

  const openAddCommittee = () => {
    setEditingComm(null);
    setCommForm({
      name: '',
      alias: '',
      description: '',
      isActive: true,
    });
    setCommModalOpen(true);
  };

  const openEditCommittee = (comm: CommitteeSettingItem) => {
    setEditingComm(comm);
    setCommForm({
      name: comm.name,
      alias: comm.alias || '',
      description: comm.description || '',
      isActive: comm.isActive,
    });
    setCommModalOpen(true);
  };

  const handleSaveCommitteeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commForm.name.trim()) return;

    let updated: CommitteeSettingItem[];
    if (editingComm) {
      updated = committeeList.map((c) =>
        c.id === editingComm.id
          ? {
              ...c,
              name: commForm.name.trim(),
              alias: commForm.alias.trim(),
              description: commForm.description.trim(),
              isActive: commForm.isActive,
            }
          : c
      );
    } else {
      const newItem: CommitteeSettingItem = {
        id: `COMM-${Date.now().toString().slice(-4)}`,
        name: commForm.name.trim(),
        alias: commForm.alias.trim(),
        description: commForm.description.trim(),
        isActive: commForm.isActive,
      };
      updated = [...committeeList, newItem];
    }

    setCommitteeList(updated);
    setCommModalOpen(false);
    setIsSavingCommittees(true);
    const res = await saveSettings({ ...settings, committees: updated });
    setIsSavingCommittees(false);
    setCommitteeSaveMsg(res.message || 'Committee saved successfully.');
    setTimeout(() => setCommitteeSaveMsg(null), 3000);
  };

  const handleToggleCommitteeActive = async (id: string) => {
    const updated = committeeList.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c));
    setCommitteeList(updated);
    await saveSettings({ ...settings, committees: updated });
  };

  const handleDeleteCommittee = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this committee?')) return;
    const updated = committeeList.filter((c) => c.id !== id);
    setCommitteeList(updated);
    await saveSettings({ ...settings, committees: updated });
  };

  const handleResetCommittees = async () => {
    if (!window.confirm('Reset committees back to official 16 MCGI Youth committees?')) return;
    setCommitteeList(DEFAULT_COMMITTEE_SETTINGS);
    await saveSettings({ ...settings, committees: DEFAULT_COMMITTEE_SETTINGS });
    setCommitteeSaveMsg('Committees reset to official 16 defaults.');
    setTimeout(() => setCommitteeSaveMsg(null), 3000);
  };

  const openAddOfficer = () => {
    setEditingOfficer(null);
    setOfficerForm({
      username: '',
      fullName: '',
      role: 'OFFICER',
      email: '',
      title: '',
      passkey: Math.floor(1000 + Math.random() * 9000).toString(),
      status: 'Active',
    });
    setOfficerModalOpen(true);
  };

  const openEditOfficer = (officer: OfficerAccount) => {
    setEditingOfficer(officer);
    setOfficerForm({
      username: officer.username,
      fullName: officer.fullName,
      role: officer.role,
      email: officer.email,
      title: officer.title,
      passkey: officer.passkey,
      status: officer.status,
    });
    setOfficerModalOpen(true);
  };

  const handleSaveOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerForm.fullName.trim() || !officerForm.username.trim() || !officerForm.passkey.trim()) {
      setOfficerActionMsg({ type: 'error', text: 'Name, username, and passkey are required.' });
      return;
    }

    const officerToSave: OfficerAccount = {
      id: editingOfficer?.id || `OFF-${Date.now().toString().slice(-4)}`,
      username: officerForm.username.trim().toLowerCase(),
      fullName: officerForm.fullName.trim(),
      role: officerForm.role,
      email: officerForm.email.trim() || `${officerForm.username.trim().toLowerCase()}@ascoville.org`,
      title: officerForm.title.trim() || (officerForm.role === 'ADMIN' ? 'Ascoville Youth Administrator' : 'Youth Officer'),
      passkey: officerForm.passkey.trim(),
      status: officerForm.status,
      createdAt: editingOfficer?.createdAt || new Date().toISOString(),
      lastLoginAt: editingOfficer?.lastLoginAt,
    };

    const res = saveOfficer(officerToSave);
    if (res.success) {
      setOfficerActionMsg({ type: 'success', text: `Officer "${officerToSave.fullName}" saved successfully!` });
      setOfficerModalOpen(false);
      setTimeout(() => setOfficerActionMsg(null), 4000);
    } else {
      setOfficerActionMsg({ type: 'error', text: res.message });
    }
  };

  const handleDeleteOfficer = (officer: OfficerAccount) => {
    if (officer.id === user?.id || officer.username === user?.username) {
      alert('Security restriction: You cannot delete your own currently signed-in account.');
      return;
    }
    if (!confirm(`Are you sure you want to remove authorized officer "${officer.fullName}"?`)) {
      return;
    }
    const res = deleteOfficer(officer.id);
    if (res.success) {
      setOfficerActionMsg({ type: 'success', text: `Officer "${officer.fullName}" has been removed.` });
      setTimeout(() => setOfficerActionMsg(null), 4000);
    } else {
      alert(res.message);
    }
  };

  const togglePasskeyVisibility = (id: string) => {
    setRevealedPasskeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">System Settings & Rules Configuration</h2>
          <p className="text-xs text-slate-500">
            Customize attendance algorithms, manage authorized youth officers, and safeguard backups
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('rules')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'rules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Attendance Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('committees')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'committees'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Committees & Ministries ({committeeList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('officers')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'officers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Authorized Officers ({officers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Activity Log ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Status History ({statusHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'backup'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Download className="h-3.5 w-3.5" />
          <span>Backup & Restore</span>
        </button>
      </div>

      {/* Tab 1: Attendance Rules Form */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveRules} className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Configurable Activity & Inactivity Rules</h3>
            <p className="text-xs text-slate-500">
              Changes here will dynamically recompute member activity statuses (Regular, Active, At Risk, Inactive)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Threshold Percentages */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Attendance Rate Thresholds (%)
              </h4>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Regular Member Attendance Threshold (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={rulesForm.regularThresholdPercent}
                    onChange={(e) =>
                      setRulesForm({ ...rulesForm, regularThresholdPercent: Number(e.target.value) })
                    }
                    className="w-24 rounded-lg border border-slate-300 py-1.5 px-3 text-xs font-bold text-blue-900"
                  />
                  <span className="text-slate-500">Default: 75%</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Active Member Minimum Threshold (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={rulesForm.activeThresholdPercent}
                    onChange={(e) =>
                      setRulesForm({ ...rulesForm, activeThresholdPercent: Number(e.target.value) })
                    }
                    className="w-24 rounded-lg border border-slate-300 py-1.5 px-3 text-xs font-bold text-emerald-900"
                  />
                  <span className="text-slate-500">Default: 50%</span>
                </div>
              </div>
            </div>

            {/* Inactivity Limits */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Inactivity & At-Risk Triggers
              </h4>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Consecutive Missed Events Before "At Risk"
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={rulesForm.missedEventsBeforeAtRisk}
                    onChange={(e) =>
                      setRulesForm({ ...rulesForm, missedEventsBeforeAtRisk: Number(e.target.value) })
                    }
                    className="w-24 rounded-lg border border-slate-300 py-1.5 px-3 text-xs font-bold text-amber-900"
                  />
                  <span className="text-slate-500">Default: 3 missed events</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Consecutive Missed Events Before "Inactive"
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={rulesForm.missedEventsBeforeInactive}
                    onChange={(e) =>
                      setRulesForm({ ...rulesForm, missedEventsBeforeInactive: Number(e.target.value) })
                    }
                    className="w-24 rounded-lg border border-slate-300 py-1.5 px-3 text-xs font-bold text-rose-900"
                  />
                  <span className="text-slate-500">Default: 5 missed events</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Days Without Attendance Before "Inactive"
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={7}
                    max={365}
                    value={rulesForm.daysWithoutAttendanceBeforeInactive}
                    onChange={(e) =>
                      setRulesForm({ ...rulesForm, daysWithoutAttendanceBeforeInactive: Number(e.target.value) })
                    }
                    className="w-24 rounded-lg border border-slate-300 py-1.5 px-3 text-xs font-bold text-slate-900"
                  />
                  <span className="text-slate-500">Default: 30 days</span>
                </div>
              </div>
            </div>

            {/* Attendance Counting Mode (Method A vs Method B) */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200 md:col-span-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Multiple Schedule Attendance Logic
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    rulesForm.countingMethod === 'event_level'
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400'
                      : 'bg-white border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="countingMethod"
                      value="event_level"
                      checked={rulesForm.countingMethod === 'event_level'}
                      onChange={() => setRulesForm({ ...rulesForm, countingMethod: 'event_level' })}
                      className="text-blue-600"
                    />
                    <span className="font-bold text-slate-900">Method B — Event-Level Attendance (Recommended)</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 pl-5">
                    If the youth member attends ANY schedule belonging to the multi-schedule event (e.g., 7:00 PM or 3:30 AM),
                    the event counts as attended once. Avoids penalizing members who attend only one session.
                  </p>
                </label>

                <label
                  className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    rulesForm.countingMethod === 'separate'
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400'
                      : 'bg-white border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="countingMethod"
                      value="separate"
                      checked={rulesForm.countingMethod === 'separate'}
                      onChange={() => setRulesForm({ ...rulesForm, countingMethod: 'separate' })}
                      className="text-blue-600"
                    />
                    <span className="font-bold text-slate-900">Method A — Separate Schedules</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 pl-5">
                    Each individual schedule counts as a separate attendance record.
                  </p>
                </label>
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={rulesForm.excusedCountsAsMissed}
                    onChange={(e) => setRulesForm({ ...rulesForm, excusedCountsAsMissed: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Excused attendance marks count towards missed qualifying events</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {rulesSaveMessage && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="h-4 w-4" />
                {rulesSaveMessage}
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={isSavingRules || !isAdmin}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                title={!isAdmin ? 'Administrator privileges required to change rules' : undefined}
              >
                <Save className="h-4 w-4" />
                <span>{isSavingRules ? 'Saving Rules...' : 'Save & Recompute Rules'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab: Committees & Ministries Configuration */}
      {activeTab === 'committees' && (
        <div className="space-y-4">
          {/* Top Info & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Official Youth Committees & Ministries</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure official committees for member profiling (GCOS, Choir, Teatro, etc.) and demographic statistical reporting.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAddCommittee}
                disabled={!isAdmin}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Committee</span>
              </button>

              <button
                type="button"
                onClick={handleResetCommittees}
                disabled={!isAdmin}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                title="Reset to 16 official MCGI Youth committees"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>

          {committeeSaveMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{committeeSaveMsg}</span>
            </div>
          )}

          {/* Search bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <input
              type="text"
              value={committeeSearch}
              onChange={(e) => setCommitteeSearch(e.target.value)}
              placeholder="Search committees by name or alias (e.g. GCOS, Choir, DRRT, TK)..."
              className="w-full text-xs py-1.5 px-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-500 whitespace-nowrap font-medium">
              Showing {committeeList.filter(c => c.name.toLowerCase().includes(committeeSearch.toLowerCase()) || c.alias?.toLowerCase().includes(committeeSearch.toLowerCase())).length} of {committeeList.length}
            </span>
          </div>

          {/* Committees Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {committeeList
              .filter(
                (c) =>
                  !committeeSearch.trim() ||
                  c.name.toLowerCase().includes(committeeSearch.toLowerCase()) ||
                  c.alias?.toLowerCase().includes(committeeSearch.toLowerCase()) ||
                  c.description?.toLowerCase().includes(committeeSearch.toLowerCase())
              )
              .map((comm) => (
                <div
                  key={comm.id}
                  className={`p-4 rounded-xl border transition-all ${
                    comm.isActive
                      ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{comm.name}</span>
                        {comm.alias && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                            {comm.alias}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{comm.id}</span>
                    </div>

                    {/* Active toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleCommitteeActive(comm.id)}
                      disabled={!isAdmin}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition cursor-pointer ${
                        comm.isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {comm.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 font-light min-h-[32px] line-clamp-2">
                    {comm.description || 'No description provided.'}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditCommittee(comm)}
                      disabled={!isAdmin}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer disabled:opacity-50"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCommittee(comm.id)}
                      disabled={!isAdmin}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Committee Add/Edit Modal */}
          {commModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-scale-up">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingComm ? 'Edit Committee / Ministry' : 'Add New Committee / Ministry'}
                  </h3>
                  <button
                    onClick={() => setCommModalOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveCommitteeItem} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Committee Name *</label>
                    <input
                      type="text"
                      required
                      value={commForm.name}
                      onChange={(e) => setCommForm({ ...commForm, name: e.target.value })}
                      placeholder="e.g. Guest Coordinators, Music Ministry, Teatro Kristiano"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Alias / Code (Short Label)</label>
                    <input
                      type="text"
                      value={commForm.alias}
                      onChange={(e) => setCommForm({ ...commForm, alias: e.target.value })}
                      placeholder="e.g. GCOS, Choir, TK, DRRT, TOC"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description / Responsibilities</label>
                    <textarea
                      rows={3}
                      value={commForm.description}
                      onChange={(e) => setCommForm({ ...commForm, description: e.target.value })}
                      placeholder="Duties, functions, and roles in the locale..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={commForm.isActive}
                      onChange={(e) => setCommForm({ ...commForm, isActive: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="font-semibold text-slate-800">Active (Visible in Member Registry & Forms)</span>
                  </label>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCommModalOpen(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCommittees}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingCommittees ? 'Saving...' : editingComm ? 'Update Committee' : 'Add Committee'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Authorized Officers & Access Control */}
      {activeTab === 'officers' && (
        <div className="space-y-6">
          {/* Notification Message */}
          {officerActionMsg && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                officerActionMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <span>{officerActionMsg.text}</span>
              <button
                onClick={() => setOfficerActionMsg(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Role Status Banner */}
          {!isAdmin && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Officer Access Notice: </span>
                You are currently signed in as a <span className="font-semibold text-amber-800">Youth Officer</span>.
                You can review the directory of authorized officers below. Creating new officer accounts, updating passkeys, or modifying system roles requires <span className="font-semibold text-amber-800">System Administrator</span> privileges.
              </div>
            </div>
          )}

          {/* Officer Metrics & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Authorized Youth Officers</h3>
                <p className="text-xs text-slate-500">
                  {officers.length} active officer accounts configured in this locale
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={openAddOfficer}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Register New Officer</span>
              </button>
            )}
          </div>

          {/* Officers Table / Roster */}
          <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Officer Profile</th>
                    <th className="py-3 px-4">Username & Email</th>
                    <th className="py-3 px-4 text-center">System Role</th>
                    <th className="py-3 px-4 text-center">Passkey PIN</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {officers.map((off) => {
                    const isCurrentUser = off.id === user?.id || off.username === user?.username;
                    const passkeyRevealed = revealedPasskeys[off.id];

                    return (
                      <tr key={off.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {off.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{off.fullName}</span>
                                {isCurrentUser && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium border border-slate-200">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">{off.title}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-700">
                          <div>
                            <span className="font-semibold text-slate-800">@{off.username}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-sans">{off.email}</span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {off.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                              <ShieldCheck className="h-3 w-3" />
                              Administrator
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold">
                              <UserCheck className="h-3 w-3" />
                              Youth Officer
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center font-mono">
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => togglePasskeyVisibility(off.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Click to reveal/hide passkey"
                            >
                              <Key className="h-3 w-3 text-slate-500" />
                              <span>{passkeyRevealed ? off.passkey : '••••'}</span>
                              {passkeyRevealed ? (
                                <EyeOff className="h-3 w-3 text-slate-400 ml-0.5" />
                              ) : (
                                <Eye className="h-3 w-3 text-slate-400 ml-0.5" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-400">••••</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {off.lastLoginAt ? (
                            <div>
                              <span>{new Date(off.lastLoginAt).toLocaleDateString()}</span>
                              <span className="block text-[10px] text-slate-400">
                                {new Date(off.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Never logged in</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isAdmin ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditOfficer(off)}
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition"
                                title="Edit Officer Details"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOfficer(off)}
                                disabled={isCurrentUser}
                                className={`p-1.5 rounded-md transition ${
                                  isCurrentUser
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                                }`}
                                title={isCurrentUser ? 'Cannot delete active session' : 'Remove Officer'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Read-only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security and Roles Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 text-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Administrator Permissions</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                <li>Configure attendance calculation algorithms & inactivity thresholds</li>
                <li>Register, edit, and manage authorized officer passkeys and access</li>
                <li>Download database JSON backups and execute system restores</li>
                <li>Configure public landing page banners, logos, and headline settings</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2 font-bold text-slate-800 text-xs">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span>Youth Officer Permissions</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                <li>Batch check-in and fast attendance recording for services & events</li>
                <li>Youth member directory registration, profile updates, and tracking</li>
                <li>Digital announcement publishing, scheduling, and notice board management</li>
                <li>Official demographic summaries, weekly trend analysis, and reports</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Officer Modal */}
      {officerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingOfficer ? 'Edit Officer Account' : 'Register Authorized Officer'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Youth officer credentials for administrative portal access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOfficerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOfficerSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={officerForm.fullName}
                  onChange={(e) => setOfficerForm({ ...officerForm, fullName: e.target.value })}
                  placeholder="e.g. Officer Juan Dela Cruz"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={officerForm.username}
                    onChange={(e) =>
                      setOfficerForm({
                        ...officerForm,
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''),
                      })
                    }
                    placeholder="e.g. juan.officer"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={officerForm.role}
                    onChange={(e) => setOfficerForm({ ...officerForm, role: e.target.value as UserRole })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="OFFICER">Youth Officer</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Committee / Official Title
                </label>
                <input
                  type="text"
                  value={officerForm.title}
                  onChange={(e) => setOfficerForm({ ...officerForm, title: e.target.value })}
                  placeholder="e.g. Committee Attendance Secretary"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={officerForm.email}
                  onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
                  placeholder="e.g. juan.delacruz@ascoville.org"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Passkey PIN <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setOfficerForm({
                        ...officerForm,
                        passkey: Math.floor(1000 + Math.random() * 9000).toString(),
                      })
                    }
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold"
                  >
                    Generate Random PIN
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={officerForm.passkey}
                  onChange={(e) => setOfficerForm({ ...officerForm, passkey: e.target.value })}
                  placeholder="e.g. 1234"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold tracking-widest focus:border-blue-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  The officer enters this 4+ digit PIN on the Youth Officer Login portal.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOfficerModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition"
                >
                  {editingOfficer ? 'Update Officer' : 'Save Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Activity Log (Audit Trail) */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Official System Activity Log</h3>
            <span className="text-xs text-slate-500">Records all administrative mutations and sync actions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Module</th>
                  <th className="py-2.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.slice((logsPage - 1) * pageSize, logsPage * pageSize).map((log) => (
                  <tr key={log.logId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{log.user}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-700">{log.module}</td>
                    <td className="py-2.5 px-4 text-slate-800">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={logsPage}
            totalItems={logs.length}
            pageSize={pageSize}
            onPageChange={setLogsPage}
          />
        </div>
      )}

      {/* Tab 3: Member Status History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Member Status Transition History</h3>
            <span className="text-xs text-slate-500">MEMBER_STATUS_HISTORY official records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Changed At</th>
                  <th className="py-2.5 px-4">Member ID</th>
                  <th className="py-2.5 px-4">Previous Status</th>
                  <th className="py-2.5 px-4">New Status</th>
                  <th className="py-2.5 px-4">Reason / Notes</th>
                  <th className="py-2.5 px-4">Changed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statusHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No status transitions recorded yet.
                    </td>
                  </tr>
                ) : (
                  statusHistory.slice((historyPage - 1) * pageSize, historyPage * pageSize).map((h) => (
                    <tr key={h.historyId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(h.changedAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{h.memberId}</td>
                      <td className="py-2.5 px-4">{h.previousStatus}</td>
                      <td className="py-2.5 px-4 font-bold text-blue-700">{h.newStatus}</td>
                      <td className="py-2.5 px-4 text-slate-700">{h.reason}</td>
                      <td className="py-2.5 px-4 text-slate-500">{h.changedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={historyPage}
            totalItems={statusHistory.length}
            pageSize={pageSize}
            onPageChange={setHistoryPage}
          />
        </div>
      )}

      {/* Tab 4: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Database Backup & Recovery</h3>
            <p className="text-xs text-slate-500">
              Export and restore all local entities (members, attendance, events, schedules, logs) as JSON
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Export */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Export Full Backup
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Download a complete point-in-time snapshot of the administrative database to your local computer.
              </p>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
              >
                <Download className="h-4 w-4" />
                <span>Download Database JSON Backup</span>
              </button>
            </div>

            {/* Restore */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Restore From Backup JSON
              </h4>
              <textarea
                rows={4}
                value={restoreText}
                onChange={(e) => setRestoreText(e.target.value)}
                placeholder="Paste backup JSON content here..."
                className="w-full rounded-lg border border-slate-300 p-2 font-mono text-[11px] bg-white focus:outline-hidden"
              />
              {restoreStatus && (
                <p className="text-xs font-semibold text-blue-700">{restoreStatus}</p>
              )}
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={!restoreText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                <span>Restore Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
