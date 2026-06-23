import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../../service/permission.service';
import * as customerService from '../../../../../service/customer.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userPermissions = session.user.userPermissions;
  const hasView = hasPermission(userPermissions, 'customers:view') || 
                  hasPermission(userPermissions, 'customers:view-cards');

  if (!hasView) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  const resolvedParams = await params;
  const customerId = Number(resolvedParams.id);
  if (isNaN(customerId)) {
    return NextResponse.json({ error: 'Invalid Customer ID' }, { status: 400 });
  }

  try {
    const maskSensitive = !hasPermission(userPermissions, 'customers:view-cards');
    const cards = await customerService.getCards(customerId, maskSensitive);
    return NextResponse.json(cards);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
