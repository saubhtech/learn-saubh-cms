import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all exams
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const langid = searchParams.get('langid');
    
    let sql = 'SELECT * FROM exam WHERE del = false';
    const params: any[] = [];
    
    if (langid) {
      sql += ' AND langid = $1';
      params.push(langid);
    }
    
    sql += ' ORDER BY examid DESC';
    
    const result = await query(sql, params);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('GET exams error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST new exam
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { langid, exam, syllabus, exam_doc, marks_total, euserid } = body;

    if (!langid || !exam || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO exam (langid, exam, syllabus, exam_doc, marks_total, euserid, edate, del)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, false)
       RETURNING *`,
      [langid, exam, syllabus, exam_doc, marks_total, euserid]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Exam created successfully',
    });
  } catch (error: any) {
    console.error('POST exam error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT update exam
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { examid, langid, exam, syllabus, exam_doc, marks_total, euserid } = body;

    if (!examid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing examid or euserid' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE exam 
       SET langid = COALESCE($1, langid),
           exam = COALESCE($2, exam),
           syllabus = COALESCE($3, syllabus),
           exam_doc = COALESCE($4, exam_doc),
           marks_total = COALESCE($5, marks_total),
           euserid = $6,
           edate = CURRENT_DATE
       WHERE examid = $7 AND del = false
       RETURNING *`,
      [langid, exam, syllabus, exam_doc, marks_total, euserid, examid]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Exam updated successfully',
    });
  } catch (error: any) {
    console.error('PUT exam error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE exam (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const examid = searchParams.get('examid');
    const euserid = searchParams.get('euserid');

    if (!examid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing examid or euserid' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE exam 
       SET del = true, euserid = $1, edate = CURRENT_DATE
       WHERE examid = $2
       RETURNING examid`,
      [euserid, examid]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE exam error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
