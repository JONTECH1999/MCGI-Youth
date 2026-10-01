import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { Member } from '../../types/member';
import { Modal } from '../common/Modal';

interface MemberImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (members: Member[]) => Promise<{ imported: number; updated: number }>;
  existingMemberIds: string[];
}

export const MemberImportModal: React.FC<MemberImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingMemberIds,
}) => {
  const [step, setStep] = useState<'paste' | 'preview' | 'result'>('paste');
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<Partial<Member>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<{ imported: number; updated: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse CSV or TSV pasted text
  const handleParse = () => {
    if (!rawText.trim()) return;

    const lines = rawText.trim().split('\n');
    if (lines.length <= 1) {
      setValidationErrors(['Input must contain a header row and at least one data row.']);
      return;
    }

    // Detect delimiter: tab or comma
    const headerLine = lines[0];
    const delimiter = headerLine.includes('\t') ? '\t' : ',';
    const rawHeaders = headerLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    const rows: Partial<Member>[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const obj: any = {};

      rawHeaders.forEach((h, idx) => {
        const val = cols[idx] || '';
        if (h.includes('id')) obj.memberId = val;
        else if (h.includes('first')) obj.firstName = val;
        else if (h.includes('middle')) obj.middleName = val;
        else if (h.includes('last')) obj.lastName = val;
        else if (h.includes('name') && !obj.firstName) obj.fullName = val;
        else if (h.includes('birth')) obj.birthday = val;
        else if (h.includes('age')) obj.age = parseInt(val) || 0;
        else if (h.includes('gender') || h.includes('sex')) obj.gender = val;
        else if (h.includes('contact') || h.includes('phone')) obj.contactNumber = val;
        else if (h.includes('email')) obj.email = val;
        else if (h.includes('address')) obj.address = val;
        else if (h.includes('status')) obj.membershipStatus = val;
        else if (h.includes('category') || h.includes('junior')) obj.memberCategory = val;
        else if (h.includes('student')) obj.studentStatus = val;
        else if (h.includes('employ') || h.includes('work')) obj.employmentStatus = val;
        else if (h.includes('voter')) obj.registeredVoter = val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes';
        else if (h.includes('working student')) obj.workingStudent = val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes';
        else if (h.includes('osy') || h.includes('out of school')) obj.outOfSchoolYouth = val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes';
        else if (h.includes('parent')) obj.parentBaptismStatus = val;
        else if (h.includes('committee')) {
          obj.committees = val ? val.split(';').map((c: string) => c.trim()) : [];
        }
      });

      // Default fallbacks
      if (!obj.memberId) {
        obj.memberId = `M-${1000 + i}`;
      }
      if (!obj.firstName && obj.fullName) {
        const parts = obj.fullName.split(' ');
        obj.firstName = parts[0] || 'Unknown';
        obj.lastName = parts.slice(1).join(' ') || 'Member';
      }

      if (!obj.firstName || !obj.lastName) {
        errors.push(`Row ${i + 1}: Missing First Name or Last Name.`);
      }

      if (!obj.fullName) {
        obj.fullName = `${obj.firstName} ${obj.middleName ? obj.middleName + ' ' : ''}${obj.lastName}`;
      }
      if (!obj.membershipStatus) obj.membershipStatus = 'Active';
      if (!obj.memberCategory) obj.memberCategory = (obj.age && obj.age < 18) ? 'Junior' : 'Senior';
      if (!obj.gender) obj.gender = 'Male';
      if (!obj.committees) obj.committees = [];

      rows.push(obj);
    }

    setParsedRows(rows);
    setValidationErrors(errors);
    setStep('preview');
  };

  const handleExecuteImport = async () => {
    setIsProcessing(true);
    const completeMembers: Member[] = parsedRows.map((r, idx) => ({
      memberId: r.memberId || `M-${2000 + idx}`,
      firstName: r.firstName || '',
      middleName: r.middleName || '',
      lastName: r.lastName || '',
      fullName: r.fullName || `${r.firstName} ${r.lastName}`,
      birthday: r.birthday || '',
      age: r.age || 18,
      gender: (r.gender as any) || 'Male',
      contactNumber: r.contactNumber || '',
      email: r.email || '',
      address: r.address || '',
      membershipStatus: (r.membershipStatus as any) || 'Active',
      memberCategory: (r.memberCategory as any) || 'Senior',
      studentStatus: (r.studentStatus as any) || 'Student',
      employmentStatus: (r.employmentStatus as any) || 'Unemployed',
      registeredVoter: Boolean(r.registeredVoter),
      workingStudent: Boolean(r.workingStudent),
      outOfSchoolYouth: Boolean(r.outOfSchoolYouth),
      parentBaptismStatus: (r.parentBaptismStatus as any) || 'Unbaptized Parent/s',
      committees: r.committees || [],
      dateRegistered: r.dateRegistered || new Date().toISOString().split('T')[0],
      attendanceCount: 0,
      attendancePercentage: 0,
      activityStatus: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const result = await onImport(completeMembers);
    setImportSummary(result);
    setIsProcessing(false);
    setStep('result');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Existing Membership Data"
      subtitle="Preserve existing records, auto-detect columns, and prevent duplicates"
      maxWidth="4xl"
    >
      {step === 'paste' && (
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 leading-relaxed">
            <span className="font-bold block mb-1">How to import from Google Sheets:</span>
            1. Open your current Google Sheet.
            <br />
            2. Select the header row and member data rows.
            <br />
            3. Copy (`Ctrl + C`) and paste (`Ctrl + V`) into the box below.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Paste Spreadsheet Data (TSV or CSV format)
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Member ID&#9;First Name&#9;Last Name&#9;Birthday&#9;Gender&#9;Status&#10;M-1001&#9;Juan&#9;Dela Cruz&#9;2008-05-14&#9;Male&#9;Active"
              className="w-full font-mono text-xs rounded-lg border border-slate-300 p-3 shadow-2xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {validationErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
              {validationErrors.map((err, idx) => (
                <p key={idx}>{err}</p>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleParse}
              disabled={!rawText.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
            >
              <span>Inspect & Preview</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Detected <span className="font-bold text-slate-900">{parsedRows.length}</span> member record(s).
            </p>
            <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">
              Duplicate ID protection active
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3">Member ID</th>
                  <th className="py-2 px-3">Full Name</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Conflict Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {parsedRows.map((r, i) => {
                  const isExisting = r.memberId && existingMemberIds.includes(r.memberId);
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-medium text-slate-900">{r.memberId}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{r.fullName}</td>
                      <td className="py-2 px-3">{r.memberCategory}</td>
                      <td className="py-2 px-3">{r.membershipStatus}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            isExisting ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isExisting ? 'Update Existing' : 'Create New'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('paste')}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{isProcessing ? 'Importing Data...' : 'Confirm & Import to Database'}</span>
            </button>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="text-center py-6 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Import Completed Successfully</h3>
            <p className="text-xs text-slate-500 mt-1">
              Registered{' '}
              <span className="font-bold text-emerald-600">{importSummary?.imported || 0}</span> new member(s) and
              updated{' '}
              <span className="font-bold text-blue-600">{importSummary?.updated || 0}</span> existing member(s).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
};
