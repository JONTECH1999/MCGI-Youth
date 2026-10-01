import { useAppData } from '../context/AppDataContext';
import { MemberTable } from '../components/members/MemberTable';

export const MembersPage: React.FC = () => {
  const {
    members,
    attendance,
    saveMember,
    archiveMember,
    deleteMember,
    importMembers,
  } = useAppData();

  return (
    <div className="space-y-6">
      <MemberTable
        members={members}
        attendanceRecords={attendance}
        onSaveMember={saveMember}
        onArchiveMember={archiveMember}
        onDeleteMember={deleteMember}
        onImportMembers={importMembers}
      />
    </div>
  );
};
