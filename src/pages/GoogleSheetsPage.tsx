import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Layers,
  ShieldCheck,
  Code,
  Zap,
  UploadCloud,
  HelpCircle,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { GasApiService } from '../services/gasApi';
import { isSupabaseRequired } from '../services/supabaseClient';

export const GoogleSheetsPage: React.FC = () => {
  const {
    settings,
    saveSettings,
    testConnection,
    syncFromGoogleSheets,
    initGoogleSheets,
    pushAllToGoogleSheets,
    members,
    events,
    attendance,
    connectionStatus,
    connectionError,
    lastSyncTimestamp,
    isSyncing,
  } = useAppData();

  const [appsScriptUrlInput, setAppsScriptUrlInput] = useState(settings.googleSheets.appsScriptUrl || '');
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(settings.googleSheets.spreadsheetId || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPushingAll, setIsPushingAll] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync inputs if settings change externally
  React.useEffect(() => {
    if (settings.googleSheets.appsScriptUrl && !appsScriptUrlInput) {
      setAppsScriptUrlInput(settings.googleSheets.appsScriptUrl);
    }
    if (settings.googleSheets.spreadsheetId && !spreadsheetIdInput) {
      setSpreadsheetIdInput(settings.googleSheets.spreadsheetId);
    }
  }, [settings.googleSheets.appsScriptUrl, settings.googleSheets.spreadsheetId]);

  // Save Connection Settings
  const handleSaveConnection = async (overrideUrl?: string, overrideId?: string) => {
    setIsSaving(true);
    const updated = {
      ...settings,
      googleSheets: {
        ...settings.googleSheets,
        appsScriptUrl: (overrideUrl !== undefined ? overrideUrl : appsScriptUrlInput).trim(),
        spreadsheetId: (overrideId !== undefined ? overrideId : spreadsheetIdInput).trim(),
      },
    };
    await saveSettings(updated);
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Test Connection
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    await handleSaveConnection();
    const res = await testConnection(appsScriptUrlInput.trim());
    setIsTesting(false);
    setTestResult({
      success: res.success,
      message: res.message || (res.success ? 'Successfully connected to Google Sheet!' : 'Failed to connect.'),
      details: res,
    });
  };

  // Auto initialize worksheets
  const handleInitializeSpreadsheet = async () => {
    setIsInitializing(true);
    setInitResult(null);
    try {
      await handleSaveConnection();
      const res = await initGoogleSheets();
      setInitResult({
        success: res.success,
        message: res.message || (res.success ? 'All 15 worksheets (including OFFICIAL_SUMMARY table) formatted and created in Google Sheets!' : 'Failed to initialize sheets.'),
      });
    } catch (err: any) {
      setInitResult({
        success: false,
        message: `Error: ${err.message}`,
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Push all local app data to Google Sheets
  const handlePushAll = async () => {
    setIsPushingAll(true);
    setPushResult(null);
    try {
      await handleSaveConnection();
      const res = await pushAllToGoogleSheets();
      setPushResult({
        success: res.success,
        message: res.message || (res.success ? 'Successfully uploaded all app data to Google Sheets!' : 'Failed to push data.'),
      });
    } catch (err: any) {
      setPushResult({
        success: false,
        message: err.message || 'Error uploading data to Google Sheets.',
      });
    } finally {
      setIsPushingAll(false);
    }
  };

  const handleSyncFromSheets = async () => {
    await handleSaveConnection();
    await syncFromGoogleSheets();
  };

  const handleCopyScript = () => {
    // Read the script from template or copy sample
    const sampleScriptSnippet = `/**
 * MCGI YOUTH ADMINISTRATIVE BACKEND (Code.gs)
 * Paste this into Extensions -> Apps Script in your Google Spreadsheet
 * Follow instructions in google-apps-script/Code.gs
 */
function doGet(e) { /* Full Code.gs file available in workspace */ }`;

    navigator.clipboard.writeText(sampleScriptSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isSupabaseRequired ? 'Google Sheets Secondary Copy' : 'Google Sheets Connection'}
          </h2>
          <p className="text-xs text-slate-500">
            {isSupabaseRequired
              ? 'Supabase is the primary database. Google Sheets is an authenticated secondary copy.'
              : 'Configure Supabase Auth before connecting Google Sheets for real member data.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              connectionStatus === 'Connected'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : connectionStatus === 'Checking'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connectionStatus === 'Connected'
                  ? 'bg-emerald-500'
                  : connectionStatus === 'Checking'
                  ? 'bg-blue-500 animate-ping'
                  : 'bg-amber-500'
              }`}
            />
            <span>{connectionStatus === 'Connected' ? 'Live Connected' : 'Local / Offline Mode'}</span>
          </span>
        </div>
      </div>

      {/* Connection Parameters Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Google Apps Script Web App Connection</span>
          </h3>

          <div className="flex items-center gap-2">
            {isSaved && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                <Check className="h-3 w-3" />
                <span>Saved Permanently!</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => handleSaveConnection()}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              title="Saves this URL and Spreadsheet ID permanently in your browser"
            >
              {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Google Apps Script Web App URL * (must end in <code>/exec</code>)
              </label>
              {appsScriptUrlInput.trim().includes('/exec') && (
                <a
                  href={`${appsScriptUrlInput.trim()}${appsScriptUrlInput.includes('?') ? '&' : '?'}action=ping`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                  title="Opens a new browser tab directly testing your Apps Script deployment"
                >
                  <span>Test in Browser Tab</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <input
              type="url"
              value={appsScriptUrlInput}
              onChange={(e) => setAppsScriptUrlInput(e.target.value)}
              onBlur={() => handleSaveConnection()}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
              <p>
                Obtained from Google Spreadsheet &gt; Extensions &gt; Apps Script &gt; Deploy &gt; New deployment &gt; Web app (Access: Anyone).
              </p>
              <span className="text-slate-400 text-[10px]">Auto-saves on blur</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google Spreadsheet ID (Optional reference)
            </label>
            <input
              type="text"
              value={spreadsheetIdInput}
              onChange={(e) => setSpreadsheetIdInput(e.target.value)}
              onBlur={() => handleSaveConnection()}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Overwrite & Upload Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <UploadCloud className="h-4 w-4 text-indigo-600" />
                  <span>Ready to Overwrite & Upload to Google Sheet</span>
                </h4>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Current Web App Roster: <strong className="font-semibold">{members.length} Members</strong> ({members.filter(m => m.gender === 'Female').length} Sisters, {members.filter(m => m.gender === 'Male').length} Brothers) • <strong>{events.length} Events</strong> • <strong>{attendance.length} Attendance Records</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePushAll}
                  disabled={isPushingAll || (!GasApiService.isConfigured() && !appsScriptUrlInput.trim().includes('/exec'))}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
                  title="Replaces Google Sheets rows with the current Supabase-backed app data"
                >
                  <UploadCloud className={`h-3.5 w-3.5 ${isPushingAll ? 'animate-spin' : ''}`} />
                  <span>{isPushingAll ? 'Uploading...' : 'Replace Google Sheet Data'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="pt-2">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Synchronization Actions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* 1. Test Connection */}
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting || !appsScriptUrlInput.trim()}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
                title="Pings your Apps Script Web App to verify live communication"
              >
                {isTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                <span>{isTesting ? 'Testing...' : '1. Test Connection'}</span>
              </button>

              {/* 2. Format 15 Sheets */}
              <button
                type="button"
                onClick={handleInitializeSpreadsheet}
                disabled={isInitializing || (!GasApiService.isConfigured() && !appsScriptUrlInput.trim().includes('/exec'))}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                title="Creates all 15 worksheets (MEMBERS, ATTENDANCE_EVENTS, OFFICIAL_SUMMARY, etc.) with frozen navy blue headers and formulas"
              >
                {isInitializing ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-500" /> : <Layers className="h-3.5 w-3.5 text-slate-500" />}
                <span>{isInitializing ? 'Formatting...' : '2. Format 15 Sheets'}</span>
              </button>

              {/* 3. Push All App Data (Upload) */}
              <button
                type="button"
                onClick={handlePushAll}
                disabled={isPushingAll || (!GasApiService.isConfigured() && !appsScriptUrlInput.trim().includes('/exec'))}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                title="Uploads all members, attendance, events, announcements, and official summaries into your Google Sheet"
              >
                <UploadCloud className={`h-3.5 w-3.5 ${isPushingAll ? 'animate-spin' : ''}`} />
                <span>{isPushingAll ? 'Uploading Data...' : '3. Push All App Data'}</span>
              </button>

              {/* 4. Sync from Google Sheets (Download) */}
              <button
                type="button"
                onClick={handleSyncFromSheets}
                disabled={isSupabaseRequired || isSyncing || (!GasApiService.isConfigured() && !appsScriptUrlInput.trim().includes('/exec'))}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                title={isSupabaseRequired ? 'Disabled: Supabase is the source of truth' : 'Pulls and updates records from Google Sheets'}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSupabaseRequired ? '4. Pull disabled (Supabase primary)' : isSyncing ? 'Downloading...' : '4. Sync from Sheets'}</span>
              </button>
            </div>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
              {testResult.details?.spreadsheetTitle && (
                <p className="mt-1 text-[11px] text-emerald-800">
                  Target Spreadsheet: <strong>{testResult.details.spreadsheetTitle}</strong> (ID: {testResult.details.spreadsheetId})
                </p>
              )}
            </div>
          )}

          {/* Init Status feedback */}
          {initResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs ${
                initResult.success
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {initResult.success ? <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                <span>{initResult.message}</span>
              </div>
            </div>
          )}

          {/* Push Status feedback */}
          {pushResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs ${
                pushResult.success
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {pushResult.success ? <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                <span>{pushResult.message}</span>
              </div>
            </div>
          )}

          {/* Connection Status Metadata */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Connection State</span>
              <span className="font-semibold text-slate-900">{connectionStatus}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Successful Sync</span>
              <span className="font-semibold text-slate-900">
                {lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleString() : 'Never synced yet'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Database Architecture</span>
              <span className="font-semibold text-emerald-700">Google Sheets (Single Truth Source)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Minute Deployment Instructions Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">How to Setup Google Apps Script (3-Minute Setup)</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Ready-to-use Code.gs included</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-3 text-slate-600 leading-relaxed">
            <p>
              The full Google Apps Script backend file is provided in your project repository under{' '}
              <strong className="text-slate-900 font-mono">google-apps-script/Code.gs</strong>.
            </p>
            <ol className="list-decimal pl-4 space-y-2">
              <li>
                Open <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline inline-flex items-center gap-0.5">sheets.new <ExternalLink className="h-3 w-3" /></a> to create a new spreadsheet.
              </li>
              <li>
                Click <strong>Extensions</strong> → <strong>Apps Script</strong>.
              </li>
              <li>
                Copy all code from <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">google-apps-script/Code.gs</code> and paste it into the editor.
              </li>
              <li>
                <strong>Direct Test (100% Guaranteed):</strong> Select <strong>`testScriptDirectly`</strong> from the function dropdown at the top and click <strong>Run ▶️</strong>. Authorize permissions when prompted. This instantly creates and formats all 15 sheets!
              </li>
              <li>
                Click <strong>Deploy</strong> → <strong>New deployment</strong> → Select <strong>Web app</strong>.
              </li>
              <li>
                Set <em>Execute as:</em> <strong>Me</strong> and <em>Who has access:</em> <strong>Anyone</strong> (crucial: if set to "Only myself", Google blocks web requests).
              </li>
              <li>
                Copy the Web app URL (ends in <code>/exec</code>) and paste it into the input box above, then click <strong>3. Push All App Data</strong>!
              </li>
            </ol>
          </div>

          <div className="p-4 bg-slate-900 text-slate-300 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                <span>Why is my Google Sheet empty?</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">Troubleshooting</span>
            </div>
            <ul className="list-disc pl-4 text-[11px] space-y-1.5 text-slate-300">
              <li>
                {isSupabaseRequired
                  ? <><strong>Supabase is the source of truth.</strong> Pulling from Sheets is disabled to protect newer database data. Use <strong>"3. Push All App Data"</strong> for an authenticated secondary copy.</>
                  : <><strong>"Sync from Sheets" downloads from your sheet.</strong> If it is blank, use <strong>"3. Push All App Data"</strong> to upload the app's data.</>}
              </li>
              <li>
                <strong>"Format 15 Sheets" only creates table headers:</strong> It generates the 15 tabs and official MCGI blue columns. You still need to click <strong>"3. Push All App Data"</strong> to populate the rows.
              </li>
              <li>
                <strong>Permission Issue:</strong> If "Who has access" in your Apps Script deployment is set to "Only myself", Google blocks external browsers. Update the deployment to "Anyone".
              </li>
              <li>
                <strong>Instant Local Test:</strong> Inside Google Sheets Apps Script, click the function dropdown, pick <code>testScriptDirectly</code>, and click <strong>Run ▶️</strong>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
