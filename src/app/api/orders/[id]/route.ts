import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../service/permission.service';
import * as orderService from '../../../../service/order.service';
import * as orderRepository from '../../../../repository/order.repository';
import { prisma } from '../../../../lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const crmOrderId = Number(id);
  if (isNaN(crmOrderId)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  try {
    const order = await orderService.getOrderDetails(crmOrderId);

    // Fire-and-forget: log the view. Failure must NOT affect the response.
    orderRepository.logOrderView(
      crmOrderId,
      Number(session.user.id),
      session.user.nickname || session.user.name || 'Agent'
    ).catch((err) => console.error('[OrderView] Failed to log view:', err));

    return NextResponse.json(order);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPermitted = hasPermission(session.user.userPermissions, 'orders:edit');
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  const { id } = await params;
  const crmOrderId = Number(id);
  if (isNaN(crmOrderId)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const user = await prisma.users.findUnique({
      where: { uid: Number(session.user.id) },
      select: { uid: true, name: true, nickname: true },
    });
    const uid = user?.uid || Number(session.user.id);
    const name = user?.nickname || user?.name || session.user.name || 'Agent';

    const updatedOrder = await orderService.updateOrder(crmOrderId, body, uid, name);
    return NextResponse.json(updatedOrder);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('PATCH error occurred:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPermitted = hasPermission(session.user.userPermissions, 'orders:delete');
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  const { id } = await params;
  const crmOrderId = Number(id);
  if (isNaN(crmOrderId)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  try {
    await orderService.deleteOrder(crmOrderId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
