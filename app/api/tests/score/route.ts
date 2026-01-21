import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const resultid = request.nextUrl.searchParams.get('resultid');

    if (!resultid) {
      return NextResponse.json({ success: false, error: 'Missing resultid' }, { status: 400 });
    }

    const sql = `SELECT * FROM calculate_test_score($1)`;
    const result = await query(sql, [resultid]);

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
