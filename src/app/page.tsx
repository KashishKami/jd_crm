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

  // Fetch the metrics server-side
  const metrics = await dashboardService.getMetricsForUser(session);

  const estParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date()).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {} as Record<string, string>);
  
  const currentMonth = parseInt(estParts.month);
  const currentYear = parseInt(estParts.year);

  let initialBackendData = null;
  if (
    hasPermission(permissions, 'dashboard:backend-top-performer') ||
    hasPermission(permissions, 'dashboard:backend-bottom-performer') ||
    hasPermission(permissions, 'dashboard:backend-pending-cases')
  ) {
    initialBackendData = await dashboardService.getBackendTeamDashboard(session, currentMonth, currentYear);
  }

  return (
    <DashboardPage
      initialMetrics={metrics}
      userPermissions={permissions}
      userName={session.user.name || ''}
      initialBackendData={initialBackendData}
    />
  );
}
