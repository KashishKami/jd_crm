import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../service/permission.service';
import * as customerService from '../../../../service/customer.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPermitted = hasPermission(session.user.userPermissions, 'customers:view');
  if (!isPermitted) {
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
    const customer = await customerService.getCustomerById(customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPermitted = hasPermission(session.user.userPermissions, 'customers:edit');
  if (!isPermitted) {
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
    const body = await request.json();
    const updatedCustomer = await customerService.updateCustomer(customerId, body);
    return NextResponse.json(updatedCustomer);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
