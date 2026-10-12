import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getReportAgentsList } from '../../../../repository/report.repository';
import { prisma } from '../../../../lib/db';

import { hasPermission } from '../../../../service/permission.service';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const permissions = (session.user as any).userPermissions;
  const sessionUser = session.user as any;
  const canViewAll =
    hasPermission(permissions, 'reports:agent-sales') ||
    hasPermission(permissions, 'super-admin') ||
    sessionUser?.roleId === 1;

  const canViewTeam = hasPermission(permissions, 'reports:agent-sales-team');

  const { searchParams } = new URL(request.url);
  const teamIdParam = searchParams.get('teamId');
  const statusParam = searchParams.get('status');

  let teamIds = teamIdParam
    ? teamIdParam
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n))
    : undefined;

  let returnTeams = true;
  if (!canViewAll && canViewTeam) {
    teamIds = sessionUser?.teamId ? [Number(sessionUser.teamId)] : [];
    returnTeams = false;
  }

  const status = statusParam !== null && statusParam !== undefined ? Number(statusParam) : undefined;

  try {
    const [agents, teams] = await Promise.all([
      getReportAgentsList(teamIds && teamIds.length > 0 ? teamIds : undefined, undefined, status),
      returnTeams
        ? prisma.crmTeams.findMany({
            select: {
              teamId: true,
              teamName: true,
            },
            orderBy: {
              teamName: 'asc',
            },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      agents,
      teams,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
