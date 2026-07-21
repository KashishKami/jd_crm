import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import * as callDispositionService from '../../../../service/callDisposition.service';
import * as XLSX from 'xlsx';
import { DateTime } from 'luxon';

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
  };

  try {
    // getAllDispositionsForExport already throws Forbidden if lacking call-dispositions:view
    const records = await callDispositionService.getAllDispositionsForExport(session.user as any, filters);

    // Build worksheet rows
    const rows = records.map((r, index) => {
      let teamName = '';
      if (r.teamId === 1) teamName = 'IT Park';
      else if (r.teamId === 2) teamName = 'DB Park';
      else if (r.teamId === 3) teamName = 'Alex';
      else teamName = r.teamId ? `Team ${r.teamId}` : '—';

      return {
        'S.No.':           index + 1,
        'Date (EST)':      DateTime.fromJSDate(new Date(r.createdAt)).setZone('America/New_York').toFormat('dd-MM-yyyy'),
        'Customer Phone':  r.customerPhone,
        'Customer Name':   r.customerName ?? '',
        'Agent Name':      r.agentName,
        'Center/Team':     teamName,
        'Disposition':     r.disposition,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Call Dispositions');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="call-dispositions-export.xlsx"',
      },
    });
  } catch (err: any) {
    if (err.message.startsWith('Forbidden')) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
