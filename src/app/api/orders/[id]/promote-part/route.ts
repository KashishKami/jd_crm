import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../../service/permission.service';
import * as orderService from '../../../../../service/order.service';
import { prisma } from '../../../../../lib/db';

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
  const currentParentId = Number(id);
  if (isNaN(currentParentId)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { newPrimaryPartId } = body;
    if (!newPrimaryPartId) {
      return NextResponse.json({ error: 'Missing newPrimaryPartId' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { uid: Number(session.user.id) },
      select: { uid: true, name: true, nickname: true },
    });
    const uid = user?.uid || Number(session.user.id);
    const name = user?.nickname || user?.name || session.user.name || 'Agent';

    await orderService.promotePrimary(currentParentId, Number(newPrimaryPartId), {
      uid,
      name,
      nickname: user?.nickname || null,
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('PROMOTION ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
