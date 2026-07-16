import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import * as followupService from '../../../service/followup.service';
import { STATE_TIMEZONE_MAP } from '../../../lib/geography';
import { FollowUpFilters } from '../../../types/followup';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const agentIdParam = searchParams.get('agentId');
  const teamIdParam = searchParams.get('teamId');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  const filters: FollowUpFilters = {
    agentId: agentIdParam ? Number(agentIdParam) : undefined,
    teamId: teamIdParam ? Number(teamIdParam) : undefined,
    priority: searchParams.get('priority') || undefined,
    status: searchParams.get('status') || undefined,
    followUpDateFrom: searchParams.get('followUpDateFrom') || undefined,
    followUpDateTo: searchParams.get('followUpDateTo') || undefined,
    page: pageParam ? Number(pageParam) : 1,
    limit: limitParam ? Number(limitParam) : 10,
  };

  try {
    const result = await followupService.getAllFollowUps(session.user as any, filters);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const requiredFields = [
      'customerName',
      'customerState',
      'customerCountry',
      'vehicleYearMakeModel',
      'partRequired',
      'followUpDate',
      'followUpTime',
      'followUpReason',
      'status',
      'priority',
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const customerTimezone = STATE_TIMEZONE_MAP[body.customerState];
    if (!customerTimezone) {
      return NextResponse.json(
        { error: `Invalid state: ${body.customerState}` },
        { status: 400 }
      );
    }

    const created = await followupService.createFollowUp(session.user as any, {
      customerName: body.customerName,
      customerPhone: body.customerPhone || null,
      customerState: body.customerState,
      customerCountry: body.customerCountry,
      customerTimezone,
      vehicleYearMakeModel: body.vehicleYearMakeModel,
      partRequired: body.partRequired,
      quotedOptions: body.quotedOptions || null,
      followUpDate: body.followUpDate,
      followUpTime: body.followUpTime,
      followUpReason: body.followUpReason,
      status: body.status,
      priority: body.priority,
      notes: body.notes || null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
