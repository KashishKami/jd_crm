import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { hasPermission } from '../../../service/permission.service';
import * as orderService from '../../../service/order.service';

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
  const status = searchParams.get('status') || undefined;
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
  const pageStr = searchParams.get('page');
  const limitStr = searchParams.get('limit');
  const page = pageStr !== null ? Number(pageStr) : undefined;
  const limit = limitStr !== null ? Number(limitStr) : undefined;

  try {
    const orders = await orderService.getAllOrders({
      status,
      saleStatus,
      agentId,
      teamId,
      backendExecutiveId,
      partFoundById,
      dateFrom,
      dateTo,
      page,
      limit,
    });
    return NextResponse.json(orders);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPermitted = hasPermission(session.user.userPermissions, 'orders:create');
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const result = await orderService.createOrder(body, {
      uid: session.user.id ? Number(session.user.id) : 0,
      name: session.user.name || '',
      nickname: session.user.nickname || null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
