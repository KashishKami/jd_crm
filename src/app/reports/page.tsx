import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { hasPermission } from '../../service/permission.service';
import ReportsContainer from '../../components/reports/ReportsContainer';

export const metadata = {
  title: 'Reports | JD CRM',
  description: 'Agent Sales Performance Aggregates and Financial Report Matrix',
};

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const permissions = session.user.userPermissions;
  const sessionUser = session.user as any;
  const canViewReports =
    hasPermission(permissions, 'dashboard:view-advanced-chart') ||
    hasPermission(permissions, 'orders:view') ||
    hasPermission(permissions, 'super-admin') ||
    sessionUser?.roleId === 1;

  if (!canViewReports) {
    redirect('/access-denied');
  }

  return <ReportsContainer />;
}
