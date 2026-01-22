import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await query(`
      SELECT 
        t.teacherid,
        t.userid,
        t.langid,
        t.examid,
        t.subjectid,
        t.euserid,
        t.edate,
        array_agg(DISTINCT e.exam) FILTER (WHERE e.exam IS NOT NULL) AS exam_names,
        array_agg(DISTINCT s.subject) FILTER (WHERE s.subject IS NOT NULL) AS subject_names,
        array_agg(DISTINCT l.lang_name) FILTER (WHERE l.lang_name IS NOT NULL) AS lang_names
      FROM eteacher t
      LEFT JOIN exam e ON e.examid = ANY(t.examid)
      LEFT JOIN esubject s ON s.subjectid = ANY(t.subjectid)
      LEFT JOIN language l ON l.langid = ANY(t.langid)
      WHERE t.del = false
      GROUP BY t.teacherid, t.userid, t.langid, t.examid, t.subjectid, t.euserid, t.edate
      ORDER BY t.teacherid DESC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('GET teachers error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userid, langid, examid, subjectid, euserid } = body;

    // Validation
    if (!userid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userid, euserid' },
        { status: 400 }
      );
    }

    // Ensure arrays
    const langidArray = Array.isArray(langid) ? langid : [langid];
    const examidArray = Array.isArray(examid) ? examid : [examid];
    const subjectidArray = Array.isArray(subjectid) ? subjectid : [subjectid];

    if (langidArray.length === 0 || examidArray.length === 0 || subjectidArray.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Arrays cannot be empty' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO eteacher (userid, langid, examid, subjectid, euserid, edate, del)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, false)
       RETURNING *`,
      [userid, langidArray, examidArray, subjectidArray, euserid]
    );

    return NextResponse.json({
      success: true,
      message: 'Teacher assigned successfully',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('POST teacher error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherid, userid, langid, examid, subjectid, euserid } = body;

    if (!teacherid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing teacherid or euserid' },
        { status: 400 }
      );
    }

    // Ensure arrays
    const langidArray = Array.isArray(langid) ? langid : [langid];
    const examidArray = Array.isArray(examid) ? examid : [examid];
    const subjectidArray = Array.isArray(subjectid) ? subjectid : [subjectid];

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
      [userid, langidArray, examidArray, subjectidArray, euserid, teacherid]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher updated successfully',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('PUT teacher error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const teacherid = params.get('teacherid');
    const euserid = params.get('euserid');

    if (!teacherid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing teacherid or euserid' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE eteacher
       SET del = true, euserid = $1, edate = CURRENT_DATE
       WHERE teacherid = $2
       RETURNING teacherid`,
      [euserid, teacherid]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE teacher error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}