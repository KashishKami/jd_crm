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

  const isPermitted = hasPermission(session.user.userPermissions, 'orders:view');
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const saleStatus = searchParams.get('saleStatus') || undefined;
  const agentIdStr = searchParams.get('agentId');
  const agentId = agentIdStr ? Number(agentIdStr) : undefined;
  const teamIdStr = searchParams.get('teamId');
  const teamId = teamIdStr ? Number(teamIdStr) : undefined;
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
    const result = await orderService.createOrder(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
