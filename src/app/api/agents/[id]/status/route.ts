import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../../service/permission.service';
import * as agentService from '../../../../../service/agent.service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPermitted = hasPermission(session.user.userPermissions, 'agents:edit');
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  const resolvedParams = await params;
  const uid = Number(resolvedParams.id);
  if (isNaN(uid)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const { status } = await request.json();
    if (status !== 0 && status !== 1) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    const updatedAgent = await agentService.updateAgentStatus(uid, status);
    return NextResponse.json(updatedAgent);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
