import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import * as followupService from '../../../../service/followup.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const followUpId = Number(id);

  try {
    const record = await followupService.getFollowUpById(
      session.user as any,
      followUpId
    );
    if (!record) {
      return NextResponse.json(
        { error: 'Follow-up not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(record, { status: 200 });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const followUpId = Number(id);

  try {
    const body = await request.json();

    if (body._markNotified === true) {
      const updated = await followupService.markNotificationSent(followUpId);
      return NextResponse.json(updated, { status: 200 });
    }

    const updated = await followupService.updateFollowUp(
      session.user as any,
      followUpId,
      body
    );
    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const followUpId = Number(id);

  try {
    const deleted = await followupService.deleteFollowUp(
      session.user as any,
      followUpId
    );
    return NextResponse.json(deleted, { status: 200 });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
