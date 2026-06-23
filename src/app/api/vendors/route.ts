import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { hasPermission } from '../../../service/permission.service';
import * as vendorService from '../../../service/vendor.service';

export async function GET(request?: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPermitted = hasPermission(session.user.userPermissions, 'vendors:view');
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  const url = request ? request.url : 'http://localhost/api/vendors';
  const { searchParams } = new URL(url);
  const statusStr = searchParams.get('status');
  const status = statusStr !== null ? Number(statusStr) : undefined;

  try {
    const vendors = await vendorService.getAllVendors(status);
    return NextResponse.json(vendors);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPermitted = hasPermission(session.user.userPermissions, 'vendors:create');
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const newVendor = await vendorService.createVendor(body);
    return NextResponse.json(newVendor, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
