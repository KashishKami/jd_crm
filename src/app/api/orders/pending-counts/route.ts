import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../service/permission.service';
import { getPendingCounts } from '../../../../repository/dashboard.repository';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPermitted = hasPermission(session.user.userPermissions, 'orders:view');
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const saleStatus = searchParams.get('saleStatus') || undefined;
  const agentIdStr = searchParams.get('agentId');
  const agentId = agentIdStr ? Number(agentIdStr) : undefined;
  const teamIdStr = searchParams.get('teamId');
  const teamId = teamIdStr ? Number(teamIdStr) : undefined;
  const backendExecutiveIdStr = searchParams.get('backendExecutiveId');
  const backendExecutiveId = backendExecutiveIdStr ? Number(backendExecutiveIdStr) : undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  try {
    const counts = await getPendingCounts({
      agentId,
      teamId,
      backendExecutiveId,
      dateFrom,
      dateTo,
      saleStatus,
    });
    return NextResponse.json(counts);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
