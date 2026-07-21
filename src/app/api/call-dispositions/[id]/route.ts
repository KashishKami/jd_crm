import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import * as callDispositionService from '../../../../service/callDisposition.service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const record = await callDispositionService.getDispositionById(session.user as any, id);
    if (!record) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json({ disposition: record }, { status: 200 });
  } catch (err: any) {
    if (err.message.startsWith('Forbidden')) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const record = await callDispositionService.updateDisposition(session.user as any, id, body);
    return NextResponse.json({ disposition: record }, { status: 200 });
  } catch (err: any) {
    if (err.message.startsWith('Forbidden'))   return NextResponse.json({ error: err.message }, { status: 403 });
    if (err.message.startsWith('Not Found'))   return NextResponse.json({ error: err.message }, { status: 404 });
    if (err.message.startsWith('Bad Request')) return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    await callDispositionService.deleteDisposition(session.user as any, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    if (err.message.startsWith('Forbidden')) return NextResponse.json({ error: err.message }, { status: 403 });
    if (err.message.startsWith('Not Found')) return NextResponse.json({ error: err.message }, { status: 404 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
