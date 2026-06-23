import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './api/auth/[...nextauth]/route';
import DashboardPage from './dashboard_client_page';
import * as dashboardService from '../service/dashboard.service';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  // Fetch the metrics server-side
  const metrics = await dashboardService.getMetricsForUser(session);

  return (
    <DashboardPage
      initialMetrics={metrics}
      userPermissions={session.user.userPermissions || ''}
      userName={session.user.name || ''}
    />
  );
}
