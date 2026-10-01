import React, { useState, useEffect } from 'react';
import { Member, MembershipStatus, MemberCategory, StudentStatus, EmploymentStatus, ParentBaptismStatus } from '../../types/member';
import { Modal } from '../common/Modal';
import { OFFICIAL_COMMITTEES, COMMITTEE_METADATA } from '../../data/sampleCommittees';
import { useAppData } from '../../context/AppDataContext';
import { CheckCircle2, ShieldAlert, Sparkles, Heart } from 'lucide-react';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member) => Promise<{ success: boolean; message: string }>;
  initialMember?: Member | null;
  existingMemberIds: string[];
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMember,
  existingMemberIds,
}) => {
  const { settings } = useAppData();
  const isEditing = Boolean(initialMember);

  // Active committees list from settings or default
  const availableCommittees = React.useMemo(() => {
    if (settings?.committees && settings.committees.length > 0) {
      return settings.committees.filter((c) => c.isActive).map((c) => c.name);
    }
    return OFFICIAL_COMMITTEES as unknown as string[];
  }, [settings?.committees]);

  const [formData, setFormData] = useState<Partial<Member>>({
    memberId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    birthday: '',
    age: 18,
    gender: 'Male',
    contactNumber: '',
    email: '',
    address: '',
    membershipStatus: 'Active',
    memberCategory: 'Junior',
    studentStatus: 'Student',
    employmentStatus: 'Unemployed',
    registeredVoter: false,
    workingStudent: false,
    outOfSchoolYouth: false,
    parentBaptismStatus: 'Unbaptized Parent/s',
    committees: [],
    dateRegistered: new Date().toISOString().split('T')[0],
    notes: '',
    suspensionCategory: undefined,
    isForgiven: false,
    isNBB: false,
    nbbMonth: 'June',
    nbbQuarter: '2nd Quarter',
    baptismDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialMember) {
      setFormData({
        ...initialMember,
        isForgiven: initialMember.isForgiven ?? (initialMember.notes?.toLowerCase().includes('napatawad') || false),
        isNBB: initialMember.isNBB ?? (initialMember.notes?.toLowerCase().includes('nbb') || false),
        nbbMonth: initialMember.nbbMonth || 'June',
        nbbQuarter: initialMember.nbbQuarter || '2nd Quarter',
      });
    } else {
      const nextNum = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        memberId: `M-${nextNum}`,
        firstName: '',
        middleName: '',
        lastName: '',
        birthday: '',
        age: 18,
        gender: 'Male',
        contactNumber: '',
        email: '',
        address: '',
        membershipStatus: 'Active',
        memberCategory: 'Junior',
        studentStatus: 'Student',
        employmentStatus: 'Unemployed',
        registeredVoter: false,
        workingStudent: false,
        outOfSchoolYouth: false,
        parentBaptismStatus: 'Unbaptized Parent/s',
        committees: [],
        dateRegistered: new Date().toISOString().split('T')[0],
        notes: '',
        suspensionCategory: undefined,
        isForgiven: false,
        isNBB: false,
        nbbMonth: 'June',
        nbbQuarter: '2nd Quarter',
        baptismDate: '',
      });
    }
    setErrors({});
  }, [initialMember, isOpen]);

  // Birthday calculation with official MCGI Youth brackets:
  // Junior: 14 to 24 years old; Senior: 25 years old & above
  const handleBirthdayChange = (bday: string) => {
    if (!bday) {
      setFormData((prev) => ({ ...prev, birthday: bday }));
      return;
    }
    const birthYear = new Date(bday).getFullYear();
    const currentYear = new Date().getFullYear();
    const calcAge = Math.max(0, currentYear - birthYear);
    const suggestedCategory: MemberCategory = calcAge <= 24 ? 'Junior' : 'Senior';

    setFormData((prev) => ({
      ...prev,
      birthday: bday,
      age: calcAge,
      memberCategory: suggestedCategory,
    }));
  };

  const handleCommitteeToggle = (committee: string) => {
    const current = formData.committees || [];
    if (current.includes(committee)) {
      setFormData((prev) => ({
        ...prev,
        committees: current.filter((c) => c !== committee),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        committees: [...current, committee],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: Record<string, string> = {};

    if (!formData.memberId?.trim()) {
      validationErrors.memberId = 'Member ID is required.';
    } else if (!isEditing && existingMemberIds.includes(formData.memberId.trim())) {
      validationErrors.memberId = 'This Member ID is already registered.';
    }

    if (!formData.firstName?.trim()) {
      validationErrors.firstName = 'First Name is required.';
    }

    if (!formData.lastName?.trim()) {
      validationErrors.lastName = 'Last Name is required.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    const fullName = `${formData.firstName!.trim()} ${
      formData.middleName ? formData.middleName.trim() + ' ' : ''
    }${formData.lastName!.trim()}`;

    const memberToSave: Member = {
      memberId: formData.memberId!.trim(),
      firstName: formData.firstName!.trim(),
      middleName: formData.middleName?.trim() || '',
      lastName: formData.lastName!.trim(),
      fullName,
      birthday: formData.birthday || '',
      age: Number(formData.age) || 0,
      gender: formData.gender as 'Male' | 'Female',
      contactNumber: formData.contactNumber || '',
      email: formData.email || '',
      address: formData.address || '',
      membershipStatus: formData.membershipStatus as MembershipStatus,
      memberCategory: formData.memberCategory as MemberCategory,
      studentStatus: formData.studentStatus as StudentStatus,
      employmentStatus: formData.employmentStatus as EmploymentStatus,
      registeredVoter: Boolean(formData.registeredVoter),
      workingStudent: Boolean(formData.workingStudent),
      outOfSchoolYouth: Boolean(formData.outOfSchoolYouth),
      parentBaptismStatus: formData.parentBaptismStatus as ParentBaptismStatus,
      committees: formData.committees || [],
      dateRegistered: formData.dateRegistered || new Date().toISOString().split('T')[0],
      lastAttendanceDate: initialMember?.lastAttendanceDate,
      attendanceCount: initialMember?.attendanceCount || 0,
      attendancePercentage: initialMember?.attendancePercentage || 0,
      activityStatus: initialMember?.activityStatus || 'Active',
      activityReason: initialMember?.activityReason,
      notes: formData.notes || '',
      suspensionCategory: formData.membershipStatus === 'Suspended' ? (formData.suspensionCategory || 'Active Suspended') : undefined,
      isForgiven: Boolean(formData.isForgiven),
      isNBB: Boolean(formData.isNBB),
      nbbMonth: formData.isNBB ? formData.nbbMonth : undefined,
      nbbQuarter: formData.isNBB ? formData.nbbQuarter : undefined,
      baptismDate: formData.baptismDate || undefined,
      createdAt: initialMember?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await onSave(memberToSave);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrors({ form: res.message });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Youth Member Record' : 'Register New Youth Member'}
      subtitle="Complete profile will synchronize directly with Google Sheets MEMBERS tab"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errors.form}
          </div>
        )}

        {/* Member ID & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Member ID *
            </label>
            <input
              type="text"
              value={formData.memberId || ''}
              onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              disabled={isEditing}
              className={`w-full rounded-lg border py-2 px-3 text-xs font-mono font-bold shadow-2xs focus:outline-hidden ${
                errors.memberId ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
              } ${isEditing ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
            />
            {errors.memberId && <p className="text-[11px] text-rose-600 mt-0.5">{errors.memberId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Membership Status *
            </label>
            <select
              value={formData.membershipStatus}
              onChange={(e) => setFormData({ ...formData, membershipStatus: e.target.value as any })}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden"
            >
              <option value="Active">Active</option>
              <option value="On & Off">On & Off</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="Missing">Missing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category (Age Bracket) *
            </label>
            <select
              value={formData.memberCategory}
              onChange={(e) => setFormData({ ...formData, memberCategory: e.target.value as any })}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden"
            >
              <option value="Junior">Junior (14 to 24 yrs old)</option>
              <option value="Senior">Senior (25 yrs old & above)</option>
            </select>
          </div>
        </div>

        {/* Conditional Suspended Classification */}
        {formData.membershipStatus === 'Suspended' && (
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1 animate-fade-in">
            <label className="block text-xs font-bold text-purple-900">
              Suspension Classification (Required for Official Reporting) *
            </label>
            <p className="text-[11px] text-purple-700">
              Classify member under the official MCGI Youth suspended sub-breakdown:
            </p>
            <select
              value={formData.suspensionCategory || 'Active Suspended'}
              onChange={(e) => setFormData({ ...formData, suspensionCategory: e.target.value as any })}
              className="w-full sm:w-1/2 rounded-lg border border-purple-300 bg-white py-1.5 px-3 text-xs font-bold text-purple-900 focus:border-purple-600 focus:outline-hidden"
            >
              <option value="Active Suspended">Active Suspended</option>
              <option value="On & Off Suspended">On & Off Suspended</option>
              <option value="Inactive / RFA">Inactive / RFA</option>
            </select>
          </div>
        )}

        {/* Names */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className={`w-full rounded-lg border py-2 px-3 text-xs shadow-2xs focus:outline-hidden ${
                errors.firstName ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.firstName && <p className="text-[11px] text-rose-600 mt-0.5">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Middle Name
            </label>
            <input
              type="text"
              value={formData.middleName || ''}
              onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs shadow-2xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName || ''}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className={`w-full rounded-lg border py-2 px-3 text-xs shadow-2xs focus:outline-hidden ${
                errors.lastName ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.lastName && <p className="text-[11px] text-rose-600 mt-0.5">{errors.lastName}</p>}
          </div>
        </div>

        {/* Birthday, Age & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Birthday
            </label>
            <input
              type="date"
              value={formData.birthday || ''}
              onChange={(e) => handleBirthdayChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs shadow-2xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Age ({formData.age && formData.age <= 24 ? 'Junior: 14-24' : 'Senior: 25+'})
            </label>
            <input
              type="number"
              min={0}
              max={120}
              value={formData.age ?? 0}
              onChange={(e) => {
                const a = parseInt(e.target.value) || 0;
                setFormData({
                  ...formData,
                  age: a,
                  memberCategory: a <= 24 ? 'Junior' : 'Senior',
                });
              }}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs shadow-2xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gender *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs shadow-2xs focus:border-blue-500 focus:outline-hidden"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        {/* Contact, Email & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Number
            </label>
            <input
              type="text"
              value={formData.contactNumber || ''}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              placeholder="+63 9XX XXX XXXX"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs shadow-2xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="youth@example.com"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs shadow-2xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Address / Residence
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street, Barangay, City / Local of Ascoville"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs shadow-2xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Demographics Details */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Demographic Metrics</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Student Status</label>
              <select
                value={formData.studentStatus}
                onChange={(e) => setFormData({ ...formData, studentStatus: e.target.value as any })}
                className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-2 text-xs"
              >
                <option value="Student">Student</option>
                <option value="Non-Student">Non-Student</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Employment Status</label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-2 text-xs"
              >
                <option value="Unemployed">Unemployed</option>
                <option value="Employed">Employed (With Work)</option>
                <option value="Self-Employed">Self-Employed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Parent Baptism Status</label>
              <select
                value={formData.parentBaptismStatus}
                onChange={(e) => setFormData({ ...formData, parentBaptismStatus: e.target.value as any })}
                className="w-full rounded-md border border-slate-300 bg-white py-1.5 px-2 text-xs"
              >
                <option value="Both Mother & Father">Both Mother & Father</option>
                <option value="Mother Only">Mother Only</option>
                <option value="Father Only">Father Only</option>
                <option value="Unbaptized Parent/s">Unbaptized Parent/s</option>
              </select>
            </div>
          </div>

          {/* Demographic Checkboxes */}
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.registeredVoter}
                onChange={(e) => setFormData({ ...formData, registeredVoter: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Registered Voter (18 yrs & above)</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.workingStudent}
                onChange={(e) => setFormData({ ...formData, workingStudent: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Working Student</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.outOfSchoolYouth}
                onChange={(e) => setFormData({ ...formData, outOfSchoolYouth: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Out of School Youth</span>
            </label>
          </div>
        </div>

        {/* Special Reporting Tags: Bilang ng Napatawad & NBB Youth */}
        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-3">
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Special Status: Restored & Newly Baptized Brethren</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Napatawad Checkbox */}
            <div className="p-2.5 bg-white rounded-lg border border-amber-200">
              <label className="inline-flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isForgiven}
                  onChange={(e) => setFormData({ ...formData, isForgiven: e.target.checked })}
                  className="mt-0.5 rounded border-amber-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-emerald-600 inline" />
                    Bilang ng Napatawad
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Check if member is forgiven / restored into active spiritual fellowship.
                  </p>
                </div>
              </label>
            </div>

            {/* NBB Youth Checkbox */}
            <div className="p-2.5 bg-white rounded-lg border border-amber-200">
              <label className="inline-flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isNBB}
                  onChange={(e) => setFormData({ ...formData, isNBB: e.target.checked })}
                  className="mt-0.5 rounded border-amber-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 inline" />
                    NBB Youth (Newly Baptized)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Newly Baptized Brethren for official quarter reporting.
                  </p>
                </div>
              </label>

              {formData.isNBB && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">Month:</span>
                  <select
                    value={formData.nbbMonth || 'June'}
                    onChange={(e) => setFormData({ ...formData, nbbMonth: e.target.value })}
                    className="rounded border border-slate-300 bg-white py-1 px-2 text-xs font-bold text-blue-800"
                  >
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Committees Multi-Select */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Committees & Ministries Assignment
            </label>
            <span className="text-[11px] text-slate-500">
              Selected: <strong className="text-blue-700">{formData.committees?.length || 0}</strong>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-2">
            Label member's designated committees (e.g. GCOS, Youth Choir, Teatro Kristiano). Members can belong to multiple committees.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 rounded-xl border border-slate-200 bg-white max-h-52 overflow-y-auto">
            {availableCommittees.map((comm) => {
              const isChecked = formData.committees?.includes(comm);
              const meta = COMMITTEE_METADATA[comm];
              const displayLabel = meta?.displayLabel || comm;

              return (
                <label
                  key={comm}
                  className={`flex items-start gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                    isChecked
                      ? 'bg-blue-50/90 border-blue-300 text-blue-950 font-semibold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCommitteeToggle(comm)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight text-slate-900 truncate">{displayLabel}</p>
                    <p className="text-[10px] text-slate-500 font-normal line-clamp-1">{meta?.description || 'Locale ministry'}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes / Pastoral Observations
          </label>
          <textarea
            rows={2}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any administrative notes, shift schedules, or follow-up status..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs shadow-2xs focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Saving to Database...' : isEditing ? 'Update Member' : 'Register Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
