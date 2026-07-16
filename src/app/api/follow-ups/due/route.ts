import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import * as followupService from '../../../../service/followup.service';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const due = await followupService.getDueFollowUps(session.user as any);
    return NextResponse.json(due, { status: 200 });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
