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

  const canView = hasPermission(session.user.userPermissions, 'orders:view');
  const canCreate = hasPermission(session.user.userPermissions, 'orders:create');
  if (!canView && !canCreate) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const saleStatus = searchParams.get('saleStatus') || undefined;
  const agentIdStr = searchParams.get('agentId');
  let agentId = agentIdStr ? Number(agentIdStr) : undefined;
  const teamIdStr = searchParams.get('teamId');
  let teamId = teamIdStr ? Number(teamIdStr) : undefined;

  // Enforce self-only restriction if lacking orders:view
  if (!canView && canCreate) {
    agentId = Number(session.user.id);
    teamId = undefined;
  }

  const backendExecutiveIdStr = searchParams.get('backendExecutiveId');
  const backendExecutiveId = backendExecutiveIdStr ? Number(backendExecutiveIdStr) : undefined;
  const partFoundByIdStr = searchParams.get('partFoundById');
  const partFoundById = partFoundByIdStr ? Number(partFoundByIdStr) : undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  try {
    const counts = await getPendingCounts({
      agentId,
      teamId,
      backendExecutiveId,
      partFoundById,
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
