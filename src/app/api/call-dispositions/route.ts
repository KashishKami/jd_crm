import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import * as callDispositionService from '../../../service/callDisposition.service';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);

  const filters = {
    agentId:     searchParams.get('agentId')     ? Number(searchParams.get('agentId'))     : undefined,
    teamId:      searchParams.get('teamId')      ? Number(searchParams.get('teamId'))      : undefined,
    disposition: searchParams.get('disposition') ?? undefined,
    dateFrom:    searchParams.get('dateFrom')    ?? undefined,
    dateTo:      searchParams.get('dateTo')      ?? undefined,
    page:        searchParams.get('page')        ? Number(searchParams.get('page'))        : 1,
    limit:       searchParams.get('limit')       ? Number(searchParams.get('limit'))       : 20,
  };

  try {
    const result = await callDispositionService.getAllDispositions(session.user as any, filters);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    if (err.message.startsWith('Forbidden')) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const record = await callDispositionService.createDisposition(session.user as any, body);
    return NextResponse.json({ disposition: record }, { status: 201 });
  } catch (err: any) {
    if (err.message.startsWith('Forbidden'))    return NextResponse.json({ error: err.message }, { status: 403 });
    if (err.message.startsWith('Bad Request'))  return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
