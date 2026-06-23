import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { hasPermission } from '../../../service/permission.service';
import * as gatewayService from '../../../service/gateway.service';

export async function GET(request?: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(session.user.userPermissions, 'gateways:view')) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  const url = request ? request.url : 'http://localhost/api/gateways';
  const { searchParams } = new URL(url);
  const statusStr = searchParams.get('status');
  const status = statusStr !== null ? Number(statusStr) : undefined;

  try {
    const gateways = await gatewayService.getAllGateways(status);
    return NextResponse.json(gateways);
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

  if (!hasPermission(session.user.userPermissions, 'gateways:create')) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const gateway = await gatewayService.createGateway(body);
    return NextResponse.json(gateway, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
