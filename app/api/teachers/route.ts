import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await query(`
      SELECT t.*, e.exam AS exam_name, s.subject AS subject_name
      FROM eteacher t
      LEFT JOIN exam e ON t.examid = e.examid
      LEFT JOIN esubject s ON t.subjectid = s.subjectid
      WHERE t.del = false
      ORDER BY t.teacherid DESC
    `);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userid, langid, examid, subjectid, euserid } = body;

    if (!userid || !langid || !examid || !subjectid || !euserid) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO eteacher (userid, langid, examid, subjectid, euserid, edate, del)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, FALSE)
       RETURNING *`,
      [userid, langid, examid, subjectid, euserid]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Teacher assigned successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherid, userid, langid, examid, subjectid, euserid } = body;

    if (!teacherid || !euserid) {
      return NextResponse.json({ success: false, error: 'Missing teacherid or euserid' }, { status: 400 });
    }

    const result = await query(
      `UPDATE eteacher SET
        userid = COALESCE($1, userid),
        langid = COALESCE($2, langid),
        examid = COALESCE($3, examid),
        subjectid = COALESCE($4, subjectid),
        euserid = $5,
        edate = CURRENT_DATE
       WHERE teacherid = $6 AND del = false
       RETURNING *`,
      [userid, langid, examid, subjectid, euserid, teacherid]
    );

    if (result.rowCount === 0)
      return NextResponse.json({ success: false, error: 'Teacher not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: result.rows[0], message: 'Teacher updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teacherid = searchParams.get('teacherid');
    const euserid = searchParams.get('euserid');

    if (!teacherid || !euserid)
      return NextResponse.json({ success: false, error: 'Missing teacherid or euserid' }, { status: 400 });

    const result = await query(
      `UPDATE eteacher SET del = true, euserid = $1, edate = CURRENT_DATE
       WHERE teacherid = $2 RETURNING teacherid`,
      [euserid, teacherid]
    );

    if (result.rowCount === 0)
      return NextResponse.json({ success: false, error: 'Teacher not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
