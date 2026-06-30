import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../../service/permission.service';
import * as orderRepository from '../../../../../repository/order.repository';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.user.userPermissions, 'orders:view-workflow-history')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const id = Number((await params).id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
  }
  const history = await orderRepository.getWorkflowStatusHistoryByOrderId(id);
  return NextResponse.json(history);
}
