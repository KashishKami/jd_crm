import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import * as contactService from '../../../../../../service/vendorContact.service';

type Params = { params: Promise<{ id: string; contactId: string }> | { id: string; contactId: string } };

/** PATCH /api/vendors/:id/contacts/:contactId — rename, edit details, or (de)activate. Requires vendors:edit. */
export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!contactService.canManageContacts(session.user.userPermissions)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient Permissions' }, { status: 403 });
  }

  const resolved = await params;
  const vendorId = Number(resolved.id);
  const contactId = Number(resolved.contactId);
  if (!Number.isInteger(vendorId) || vendorId <= 0 || !Number.isInteger(contactId) || contactId <= 0) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const contact = await contactService.updateContact(vendorId, contactId, body);
    return NextResponse.json(contact);
  } catch (error) {
    if (error instanceof contactService.ContactError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
