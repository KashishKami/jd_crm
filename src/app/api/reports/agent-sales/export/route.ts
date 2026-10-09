import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { getAgentSalesMatrix } from '../../../../../service/report.service';
import { generateAgentSalesWorkbook } from '../../../../../lib/agent-sales-excel-exporter';
import { AgentSalesFilterParams, MetricViewType } from '../../../../../types/report';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = (searchParams.get('range') || 'monthly') as AgentSalesFilterParams['range'];
  const teamIdParam = searchParams.get('teamId');
  const agentIdParam = searchParams.get('agentId');
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const metricView = (searchParams.get('metricView') || 'all') as MetricViewType;

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
    const matrixData = await getAgentSalesMatrix({
      range,
      teamIds: teamIds && teamIds.length > 0 ? teamIds : undefined,
      agentIds: agentIds && agentIds.length > 0 ? agentIds : undefined,
      startDate,
      endDate,
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
