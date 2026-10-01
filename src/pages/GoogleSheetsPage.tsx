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
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { GasApiService } from '../services/gasApi';

export const GoogleSheetsPage: React.FC = () => {
  const {
    settings,
    saveSettings,
    testConnection,
    syncFromGoogleSheets,
    initGoogleSheets,
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
  const [initResult, setInitResult] = useState<string | null>(null);

  // Save Connection Settings
  const handleSaveConnection = async () => {
    const updated = {
      ...settings,
      googleSheets: {
        ...settings.googleSheets,
        appsScriptUrl: appsScriptUrlInput.trim(),
        spreadsheetId: spreadsheetIdInput.trim(),
      },
    };
    await saveSettings(updated);
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
      const res = await initGoogleSheets();
      if (res.success) {
        setInitResult('All 12 worksheets formatted and created in Google Sheets!');
      } else {
        setInitResult(`Failed: ${res.message || 'Check Apps Script deployment permissions.'}`);
      }
    } catch (err: any) {
      setInitResult(`Error: ${err.message}`);
    } finally {
      setIsInitializing(false);
    }
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
          <h2 className="text-base font-bold text-slate-900">Google Sheets Official Database Integration</h2>
          <p className="text-xs text-slate-500">
            Google Sheets is the primary database and single source of truth. Manage Web App connection and sync below.
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
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <span>Google Apps Script Web App Connection</span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google Apps Script Web App URL * (ends in <code>/exec</code>)
            </label>
            <input
              type="url"
              value={appsScriptUrlInput}
              onChange={(e) => setAppsScriptUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Obtain this by deploying your Apps Script as a Web App with access set to "Anyone".
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google Spreadsheet ID (Optional reference)
            </label>
            <input
              type="text"
              value={spreadsheetIdInput}
              onChange={(e) => setSpreadsheetIdInput(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !appsScriptUrlInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
            >
              {isTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              <span>{isTesting ? 'Testing Connection...' : 'Test Connection & Save'}</span>
            </button>

            <button
              type="button"
              onClick={() => syncFromGoogleSheets()}
              disabled={isSyncing || !GasApiService.isConfigured()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync All Data from Google Sheets'}</span>
            </button>

            <button
              type="button"
              onClick={handleInitializeSpreadsheet}
              disabled={isInitializing || !GasApiService.isConfigured()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              title="Automatically creates all 12 worksheets with frozen rows, formulas, and formatting"
            >
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>Auto-Initialize All 12 Sheets</span>
            </button>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                <span>{testResult.message}</span>
              </div>
              {testResult.details?.spreadsheetTitle && (
                <p className="mt-1 text-[11px] text-emerald-800">
                  Target Spreadsheet: <strong>{testResult.details.spreadsheetTitle}</strong>
                </p>
              )}
            </div>
          )}

          {initResult && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs">
              {initResult}
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
                Copy the code from <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">google-apps-script/Code.gs</code> and paste it into the editor.
              </li>
              <li>
                Run <strong>`initializeSpreadsheetStructure()`</strong> from the toolbar once to create and format all 12 sheets with official MCGI blue headers and formulas!
              </li>
              <li>
                Click <strong>Deploy</strong> → <strong>New deployment</strong> → Select <strong>Web app</strong>.
              </li>
              <li>
                Set <em>Execute as:</em> <strong>Me</strong> and <em>Who has access:</em> <strong>Anyone</strong>.
              </li>
              <li>
                Copy the Web app URL and paste it into the input box above!
              </li>
            </ol>
          </div>

          <div className="p-4 bg-slate-900 text-slate-300 rounded-xl space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-mono text-[11px] text-slate-400">google-apps-script/Code.gs</span>
              <span className="text-[10px] text-emerald-400 font-bold">Production Ready</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Includes full support for:
            </p>
            <ul className="list-disc pl-4 text-[11px] space-y-1 text-slate-300">
              <li>Batch Attendance saving with duplicate prevention</li>
              <li>Member CRUD & Safe Inactive Archiving</li>
              <li>Automatic formulas for Membership & Attendance stats</li>
              <li>Full Audit trail and Status change history</li>
              <li>Official Submission Report formatting</li>
            </ul>
            <div className="pt-2">
              <p className="text-[10px] text-slate-500 italic">
                File is located at <code>file:///google-apps-script/Code.gs</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
