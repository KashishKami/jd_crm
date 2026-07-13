import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './api/auth/[...nextauth]/route';
import DashboardPage from './dashboard_client_page';
import * as dashboardService from '../service/dashboard.service';
import { hasPermission } from '../service/permission.service';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const permissions = session.user.userPermissions || '';

  const estParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date()).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {} as Record<string, string>);
  
  const currentMonth = parseInt(estParts.month);
  const currentYear = parseInt(estParts.year);

  // Fetch metrics and backend team dashboard data concurrently
  const [metrics, initialBackendData] = await Promise.all([
    dashboardService.getMetricsForUser(session),
    (
      hasPermission(permissions, 'dashboard:backend-top-performer') ||
      hasPermission(permissions, 'dashboard:backend-bottom-performer') ||
      hasPermission(permissions, 'dashboard:backend-pending-cases')
    ) ? dashboardService.getBackendTeamDashboard(session, currentMonth, currentYear) : Promise.resolve(null)
  ]);

  return (
    <DashboardPage
      initialMetrics={metrics}
      userPermissions={permissions}
      userName={session.user.name || ''}
      initialBackendData={initialBackendData}
    />
  );
}
