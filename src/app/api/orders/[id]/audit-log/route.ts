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

  const isPermitted = hasPermission(session.user.userPermissions, 'orders:view-audit-log');
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
    const rawLogs = await orderRepository.getAuditLogByOrderId(crmOrderId);

    // Check if user has permission to view unmasked card details
    const canViewCards = hasPermission(session.user.userPermissions, 'customers:view-cards');

    // Dynamic masking helper
    const maskCardNumber = (num: string | null) => {
      if (!num) return null;
      const clean = num.replace(/\s+/g, '');
      const last4 = clean.slice(-4);
      return `**** **** **** ${last4}`;
    };

    const processedLogs = rawLogs.map((log: any) => {
      const processed = {
        id:            log.id,
        orderId:       log.orderId,
        fieldName:     log.fieldName,
        oldValue:      log.oldValue,
        newValue:      log.newValue,
        changedById:   log.changedById,
        changedByName: log.changedByName,
        changedAt:     log.changedAt,
      };

      if (!canViewCards) {
        if (log.fieldName === 'customerCardNumber') {
          processed.oldValue = maskCardNumber(log.oldValue);
          processed.newValue = maskCardNumber(log.newValue);
        } else if (log.fieldName === 'customerCardCvv') {
          processed.oldValue = log.oldValue ? '***' : null;
          processed.newValue = log.newValue ? '***' : null;
        }
      }

      return processed;
    });

    return NextResponse.json(processedLogs);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
