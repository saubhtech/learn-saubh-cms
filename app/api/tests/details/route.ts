import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const resultid = request.nextUrl.searchParams.get('resultid');

    if (!resultid) {
      return NextResponse.json(
        { success: false, error: 'Missing resultid parameter' },
        { status: 400 }
      );
    }

    const sql = `
      SELECT 
        t.testid,
        t.mcqid,
        t.opted,
        m.question,
        m.option1,
        m.option2,
        m.option3,
        m.option4,
        m.option5,
        m.answer AS correct
      FROM etest t
      JOIN emcq m ON t.mcqid = m.mcqid
      WHERE t.resultid = $1
      ORDER BY t.testid ASC
    `;

    const result = await query(sql, [resultid]);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('GET Test Details error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}