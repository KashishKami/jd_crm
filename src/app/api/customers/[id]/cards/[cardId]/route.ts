import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../../../service/permission.service';
import * as customerService from '../../../../../../service/customer.service';

/**
 * GET /api/customers/:id/cards/:cardId
 *
 * Returns the full card record including customerCardCopyImage and customerPhotoIdImage
 * (Base64 LONGTEXT fields). This is the ONLY endpoint that returns image data.
 * Requires: customers:view-cards permission.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; cardId: string }> | { id: string; cardId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPermitted = hasPermission(session.user.userPermissions, 'customers:view-cards');
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  const resolvedParams = await params;
  const customerId = Number(resolvedParams.id);
  const cardId = Number(resolvedParams.cardId);

  if (isNaN(customerId) || isNaN(cardId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const card = await customerService.getCardById(cardId);
    if (!card || card.cardCustomerId !== customerId) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    return NextResponse.json(card);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
