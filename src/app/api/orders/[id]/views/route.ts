import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../../service/permission.service';
import * as orderRepository from '../../../../../repository/order.repository';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPermitted = hasPermission(session.user.userPermissions, 'orders:view-log');
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
    const views = await orderRepository.getOrderViews(crmOrderId);
    return NextResponse.json(views);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
