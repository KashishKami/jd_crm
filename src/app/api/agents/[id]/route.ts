import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hasPermission } from '../../../../service/permission.service';
import * as agentService from '../../../../service/agent.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const uid = Number(resolvedParams.id);
  if (isNaN(uid)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const isSelf = Number(session.user.id) === uid;
  const isPermitted = hasPermission(session.user.userPermissions, 'agents:view') || isSelf;
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  try {
    const agent = await agentService.getAgentById(uid);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const hasViewDetails = hasPermission(session.user.userPermissions, 'agents:view-details') || isSelf;
    if (!hasViewDetails) {
      agent.profile = null;
      agent.academicRecord = null as any;
      agent.professionalRecord = null as any;
    }

    return NextResponse.json(agent);
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

  const resolvedParams = await params;
  const uid = Number(resolvedParams.id);
  if (isNaN(uid)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const isSelf = Number(session.user.id) === uid;
  const hasAgentEdit = hasPermission(session.user.userPermissions, 'agents:edit');
  const isPermitted = hasAgentEdit || isSelf;
  if (!isPermitted) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient Permissions' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // If editing self but lacks agents:edit, strip/ignore administrative fields
    if (isSelf && !hasAgentEdit) {
      delete body.roleId;
      delete body.teamId;
      delete body.designation;
      delete body.agentId;
      delete body.agentSalary;
      delete body.agentTarget;
      delete body.dateOfJoining;
      delete body.status;
    }

    // Force strip roleId if not super-admin
    const isSuperAdmin = hasPermission(session.user.userPermissions, 'super-admin');
    if (!isSuperAdmin) {
      delete body.roleId;
    }

    const updatedAgent = await agentService.updateAgent(uid, body);
    return NextResponse.json(updatedAgent);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
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
    await agentService.deleteAgent(uid);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
