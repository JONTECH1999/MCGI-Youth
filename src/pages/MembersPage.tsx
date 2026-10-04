import { useAppData } from '../context/AppDataContext';
import { MemberTable } from '../components/members/MemberTable';

export const MembersPage: React.FC = () => {
  const {
    members,
    deletedMembers,
    attendance,
    saveMember,
    archiveMember,
    deleteMember,
    restoreMember,
    importMembers,
  } = useAppData();

  return (
    <div className="space-y-6">
      <MemberTable
        members={members}
        deletedMembers={deletedMembers}
        attendanceRecords={attendance}
        onSaveMember={saveMember}
        onArchiveMember={archiveMember}
        onDeleteMember={deleteMember}
        onRestoreMember={restoreMember}
        onImportMembers={importMembers}
      />
    </div>
  );
};
