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
    const canViewPhone = hasPermission(session.user.userPermissions, 'customers:view-phone');
    const canViewEmail = hasPermission(session.user.userPermissions, 'customers:view-email');

    // Dynamic masking helpers
    const maskCardNumber = (num: string | null) => {
      if (!num) return null;
      const clean = num.replace(/\s+/g, '');
      const last4 = clean.slice(-4);
      return `**** **** **** ${last4}`;
    };

    const maskPhone = (phone: string | null | undefined): string => {
      if (!phone) return '—';
      if (phone.length < 4) return '***';
      return `***-***-${phone.slice(-4)}`;
    };

    const maskEmail = (email: string | null | undefined): string => {
      if (!email) return '—';
      const parts = email.split('@');
      if (parts.length !== 2) return '***@***.***';
      const name = parts[0];
      const domain = parts[1];
      if (name.length <= 2) return `${name[0]}***@${domain}`;
      return `${name.slice(0, 2)}***@${domain}`;
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
        if (log.fieldName && log.fieldName.startsWith('customerCardNumber')) {
          processed.oldValue = maskCardNumber(log.oldValue);
          processed.newValue = maskCardNumber(log.newValue);
        } else if (log.fieldName && log.fieldName.startsWith('customerCardCvv')) {
          processed.oldValue = log.oldValue ? '***' : null;
          processed.newValue = log.newValue ? '***' : null;
        } else if (log.fieldName && (log.fieldName.startsWith('customerCardCopyImage') || log.fieldName.startsWith('customerPhotoIdImage'))) {
          processed.oldValue = log.oldValue ? '[Uploaded]' : null;
          processed.newValue = log.newValue ? '[Uploaded]' : null;
        }
      }

      if (!canViewPhone) {
        if (log.fieldName === 'customerPhone' || log.fieldName === 'customerAlternatePhone1' || log.fieldName === 'customerAlternatePhone2') {
          processed.oldValue = log.oldValue ? maskPhone(log.oldValue) : null;
          processed.newValue = log.newValue ? maskPhone(log.newValue) : null;
        }
      }

      if (!canViewEmail) {
        if (log.fieldName === 'customerEmail') {
          processed.oldValue = log.oldValue ? maskEmail(log.oldValue) : null;
          processed.newValue = log.newValue ? maskEmail(log.newValue) : null;
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
