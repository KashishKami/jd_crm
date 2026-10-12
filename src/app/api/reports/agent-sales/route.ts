import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getAgentSalesMatrix } from '../../../../service/report.service';
import { AgentSalesFilterParams } from '../../../../types/report';

import { hasPermission } from '../../../../service/permission.service';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const permissions = (session.user as any).userPermissions;
  const sessionUser = session.user as any;
  const canViewAgentSales =
    hasPermission(permissions, 'reports:agent-sales') ||
    hasPermission(permissions, 'super-admin') ||
    sessionUser?.roleId === 1;

  if (!canViewAgentSales) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const range = (searchParams.get('range') || 'monthly') as AgentSalesFilterParams['range'];
  const teamIdParam = searchParams.get('teamId');
  const agentIdParam = searchParams.get('agentId');
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');
  const granularity = searchParams.get('granularity') as AgentSalesFilterParams['granularity'] || undefined;

  const year = yearParam ? parseInt(yearParam, 10) : undefined;
  const month = monthParam ? parseInt(monthParam, 10) : undefined;

  if (range === 'custom' && (!startDate || !endDate)) {
    return NextResponse.json(
      { error: 'startDate and endDate are required for custom range' },
      { status: 400 }
    );
  }

  const teamIds = teamIdParam
    ? teamIdParam
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n))
    : undefined;

  const agentIds = agentIdParam
    ? agentIdParam
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n))
    : undefined;

  try {
    const data = await getAgentSalesMatrix({
      range,
      teamIds: teamIds && teamIds.length > 0 ? teamIds : undefined,
      agentIds: agentIds && agentIds.length > 0 ? agentIds : undefined,
      startDate,
      endDate,
      year: year && !isNaN(year) ? year : undefined,
      month: month && !isNaN(month) ? month : undefined,
      granularity,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
