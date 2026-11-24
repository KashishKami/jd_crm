import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import * as contactService from '../../../../../service/vendorContact.service';

type Params = { params: Promise<{ id: string }> | { id: string } };

function errorResponse(error: unknown) {
  if (error instanceof contactService.ContactError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
}

/** GET /api/vendors/:id/contacts[?includeInactive=1] — contacts at a supplier */
export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const perms = session.user.userPermissions;
  if (!contactService.canViewContacts(perms)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient Permissions' }, { status: 403 });
  }

  const vendorId = Number((await params).id);
  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  // Deactivated contacts are only listed for people who can manage them
  const wantsInactive = new URL(request.url).searchParams.get('includeInactive') === '1';
  const includeInactive = wantsInactive && contactService.canManageContacts(perms);

  try {
    const contacts = await contactService.listContacts(vendorId, includeInactive);
    return NextResponse.json(contacts);
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST /api/vendors/:id/contacts — add a contact (returns the existing one if the name is already there) */
export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!contactService.canAddContacts(session.user.userPermissions)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient Permissions' }, { status: 403 });
  }

  const vendorId = Number((await params).id);
  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { contact, created } = await contactService.addContact(vendorId, body);
    return NextResponse.json(contact, { status: created ? 201 : 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
