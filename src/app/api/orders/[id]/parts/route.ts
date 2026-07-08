import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../../service/permission.service';
import * as orderService from '../../../../../service/order.service';
import { prisma } from '../../../../../lib/db';

export async function POST(
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
  const parentOrderId = Number(id);
  if (isNaN(parentOrderId)) {
    return NextResponse.json({ error: 'Invalid parent order ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const user = await prisma.users.findUnique({
      where: { uid: Number(session.user.id) },
      select: { uid: true, name: true, nickname: true },
    });
    const uid = user?.uid || Number(session.user.id);
    const name = user?.nickname || user?.name || session.user.name || 'Agent';

    const newPart = await orderService.addPart(parentOrderId, body, {
      uid,
      name,
      nickname: user?.nickname || null,
    });
    return NextResponse.json({ partOrderId: newPart.crmOrderId }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
