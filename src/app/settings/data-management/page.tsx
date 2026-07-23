import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { hasPermission } from '../../../service/permission.service';
import DataManagementClient from '../../../components/DataManagementClient';

export default async function DataManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !hasPermission(session.user.userPermissions, 'super-admin')) {
    redirect('/access-denied');
  }
  return (
    <div className="page-container data-management-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 1600px) {
          .data-management-page {
            margin-left: 20% !important;
            margin-right: 20% !important;
          }
        }
      ` }} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Management</h1>
          <p className="page-subtitle">Export all CRM data or create a database backup.</p>
        </div>
      </div>
      <DataManagementClient />
    </div>
  );
}
