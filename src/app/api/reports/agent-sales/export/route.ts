import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { getAgentSalesMatrix } from '../../../../../service/report.service';
import { generateAgentSalesWorkbook } from '../../../../../lib/agent-sales-excel-exporter';
import { AgentSalesFilterParams, MetricViewType } from '../../../../../types/report';

import { hasPermission } from '../../../../../service/permission.service';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const permissions = (session.user as any).userPermissions;
  const sessionUser = session.user as any;
  const canExport =
    hasPermission(permissions, 'reports:agent-sales-export') ||
    hasPermission(permissions, 'super-admin') ||
    sessionUser?.roleId === 1;

  if (!canExport) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const canViewAll =
    hasPermission(permissions, 'reports:agent-sales') ||
    hasPermission(permissions, 'super-admin') ||
    sessionUser?.roleId === 1;
  const canViewTeam = hasPermission(permissions, 'reports:agent-sales-team');

  const { searchParams } = new URL(request.url);
  const range = (searchParams.get('range') || 'monthly') as AgentSalesFilterParams['range'];
  const teamIdParam = searchParams.get('teamId');
  const agentIdParam = searchParams.get('agentId');
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');
  const granularity = searchParams.get('granularity') as AgentSalesFilterParams['granularity'] || undefined;
  const metricView = (searchParams.get('metricView') || 'all') as MetricViewType;
  const sortBy = (searchParams.get('sortBy') || undefined) as AgentSalesFilterParams['sortBy'];
  const sortOrder = (searchParams.get('sortOrder') || undefined) as AgentSalesFilterParams['sortOrder'];

  const year = yearParam ? parseInt(yearParam, 10) : undefined;
  const month = monthParam ? parseInt(monthParam, 10) : undefined;

  let teamIds = teamIdParam
    ? teamIdParam
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n))
    : undefined;

  // Strict team enforcement: users with only team-scoped permission are locked to their own team
  if (!canViewAll && canViewTeam) {
    teamIds = sessionUser?.teamId ? [Number(sessionUser.teamId)] : [];
  }

  const agentIds = agentIdParam
    ? agentIdParam
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n))
    : undefined;

  try {
    const matrixData = await getAgentSalesMatrix({
      range,
      teamIds: teamIds && teamIds.length > 0 ? teamIds : undefined,
      agentIds: agentIds && agentIds.length > 0 ? agentIds : undefined,
      startDate,
      endDate,
      year: year && !isNaN(year) ? year : undefined,
      month: month && !isNaN(month) ? month : undefined,
      granularity,
      sortBy,
      sortOrder,
    });

    const buffer = await generateAgentSalesWorkbook(matrixData, { metricView });
    const filename = `Agent_Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Export Failed' }, { status: 500 });
  }
}
