import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../service/permission.service';
import * as dashboardService from '../../../../service/dashboard.service';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const permissions = session.user.userPermissions || '';
  const isPermitted = hasPermission(permissions, 'dashboard:top-performer') || hasPermission(permissions, 'dashboard:bottom-performer');
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const estNow = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date()).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {} as Record<string, string>);

  const month = searchParams.get('month') ? Number(searchParams.get('month')) : parseInt(estNow.month);
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : parseInt(estNow.year);

  try {
    const data = await dashboardService.getChampionsLeague(session, month, year);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
