import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../../service/permission.service';
import * as commentService from '../../../../../service/comment.service';
import * as orderService from '../../../../../service/order.service';
import { prisma } from '../../../../../lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const crmOrderId = Number(id);
  if (isNaN(crmOrderId)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  // If restricted, check order ownership
  if (!canView && canCreate) {
    const order = await prisma.crmOrders.findUnique({
      where: { crmOrderId },
      select: { orderSalesAgentId: true },
    });
    if (!order || Number(order.orderSalesAgentId) !== Number(session.user.id)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient Permissions' },
        { status: 403 }
      );
    }
  }

  try {
    const comments = await commentService.getCommentsForOrder(crmOrderId);
    return NextResponse.json(comments);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const crmOrderId = Number(id);
  if (isNaN(crmOrderId)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  try {
    const order = await orderService.getOrderDetails(crmOrderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If restricted, check order ownership
    if (!canView && canCreate && Number(order.orderSalesAgentId) !== Number(session.user.id)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient Permissions' },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let commentText = '';
    let commentImage: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      commentText = (formData.get('comment') as string) || '';
      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        commentImage = await commentService.handleUpload(file);
      }
    } else {
      const body = await request.json();
      commentText = body.comment || '';
    }

    const user = await prisma.users.findUnique({
      where: { uid: Number(session.user.id) },
      select: { name: true, nickname: true },
    });

    const commentAgentName = user?.nickname || user?.name || session.user.name || 'Agent';

    const newComment = await commentService.createComment({
      customerId: order.orderCustomerId,
      orderId: crmOrderId,
      comment: commentText,
      commentImage,
      commentAgentId: Number(session.user.id),
      commentAgentName,
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
