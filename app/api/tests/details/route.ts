import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const resultid = request.nextUrl.searchParams.get('resultid');

    if (!resultid) {
      return NextResponse.json({ success: false, error: 'Missing resultid' }, { status: 400 });
    }

    const sql = `
      SELECT t.mcqid, m.question, m.option1, m.option2, m.option3, m.option4,
             m.answer AS correct, t.opted
      FROM etest t
      JOIN emcq m ON t.mcqid = m.mcqid
      WHERE t.resultid = $1
    `;

    const result = await query(sql, [resultid]);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
