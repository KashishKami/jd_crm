import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../service/permission.service';
import * as orderService from '../../../../service/order.service';
import * as orderRepository from '../../../../repository/order.repository';
import { prisma } from '../../../../lib/db';

// Mask helpers
function maskCardNumber(num: string | null | undefined): string {
  if (!num) return '';
  const clean = num.replace(/\s+/g, '');
  if (clean.length < 4) return '****';
  return `**** **** **** ${clean.slice(-4)}`;
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  if (phone.length < 4) return '***';
  return `***-***-${phone.slice(-4)}`;
}

function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***.***';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

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

    // Fire-and-forget: log the view. Failure must NOT affect the response.
    orderRepository.logOrderView(
      crmOrderId,
      Number(session.user.id),
      session.user.nickname || session.user.name || 'Agent'
    ).catch((err) => console.error('[OrderView] Failed to log view:', err));

    const canViewPhone = hasPermission(session.user.userPermissions, 'customers:view-phone');
    const canViewEmail = hasPermission(session.user.userPermissions, 'customers:view-email');
    const canViewCards = hasPermission(session.user.userPermissions, 'customers:view-cards');

    if (order && (order as any).customer) {
      const customer = (order as any).customer;
      if (!canViewPhone) {
        customer.customerPhone = maskPhone(customer.customerPhone);
        if (customer.customerAlternatePhone1) {
          customer.customerAlternatePhone1 = maskPhone(customer.customerAlternatePhone1);
        }
        if (customer.customerAlternatePhone2) {
          customer.customerAlternatePhone2 = maskPhone(customer.customerAlternatePhone2);
        }
      }
      if (!canViewEmail) {
        customer.customerEmail = maskEmail(customer.customerEmail);
      }
      if (!canViewCards && customer.cards) {
        customer.cards = customer.cards.map((c: any) => ({
          ...c,
          customerCardNumber: maskCardNumber(c.customerCardNumber),
          customerCardCvv: c.customerCardCvv ? '***' : null,
          customerCardCopyImage: null,
          customerPhotoIdImage: null,
        }));
      }
    }

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
    const canViewAll = hasPermission(session.user.userPermissions, 'orders:view');
    const canCreate = hasPermission(session.user.userPermissions, 'orders:create');
    const isRestricted = !canViewAll && canCreate;
    if (isRestricted) {
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

    const body = await request.json();
    const user = await prisma.users.findUnique({
      where: { uid: Number(session.user.id) },
      select: { uid: true, name: true, nickname: true },
    });
    const uid = user?.uid || Number(session.user.id);
    const name = user?.nickname || user?.name || session.user.name || 'Agent';

    const updatedOrder = await orderService.updateOrder(
      crmOrderId,
      body,
      uid,
      name,
      session.user.userPermissions
    );
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
    const status = err.message.includes('remove all child parts') ? 409 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
