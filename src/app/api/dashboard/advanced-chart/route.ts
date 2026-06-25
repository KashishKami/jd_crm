import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getAdvancedChartMetrics } from '../../../../service/dashboard.service';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const teamIdStr = searchParams.get('teamId');
  const agentIdStr = searchParams.get('agentId');
  const range = searchParams.get('range') || '7d';
  const startDateStr = searchParams.get('startDate') || undefined;
  const endDateStr = searchParams.get('endDate') || undefined;

  const teamId = teamIdStr ? Number(teamIdStr) : undefined;
  const agentId = agentIdStr ? Number(agentIdStr) : undefined;

  try {
    const data = await getAdvancedChartMetrics(session, teamId, agentId, range, startDateStr, endDateStr);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
