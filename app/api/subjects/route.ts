import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const examid = searchParams.get('examid');
    
    let sql = `
      SELECT s.*, e.exam as exam_name 
      FROM esubject s
      LEFT JOIN exam e ON s.examid = e.examid
      WHERE s.del = false
    `;
    const params: any[] = [];
    
    if (examid) {
      sql += ' AND s.examid = $1';
      params.push(examid);
    }
    
    sql += ' ORDER BY s.subjectid DESC';
    
    const result = await query(sql, params);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      langid, examid, subject, syllabus, subj_doc, 
      marks_total, marks_theory, marks_activity, marks_practicum,
      pass_total, pass_practicum, euserid 
    } = body;

    if (!langid || !examid || !subject || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO esubject (
        langid, examid, subject, syllabus, subj_doc, 
        marks_total, marks_theory, marks_activity, marks_practicum,
        pass_total, pass_practicum, euserid, edate, del
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_DATE, false)
      RETURNING *`,
      [
        langid, examid, subject, syllabus, subj_doc,
        marks_total, marks_theory, marks_activity, marks_practicum,
        pass_total, pass_practicum, euserid
      ]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Subject created successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      subjectid, langid, examid, subject, syllabus, subj_doc,
      marks_total, marks_theory, marks_activity, marks_practicum,
      pass_total, pass_practicum, euserid 
    } = body;

    if (!subjectid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing subjectid or euserid' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE esubject 
       SET langid = COALESCE($1, langid),
           examid = COALESCE($2, examid),
           subject = COALESCE($3, subject),
           syllabus = COALESCE($4, syllabus),
           subj_doc = COALESCE($5, subj_doc),
           marks_total = COALESCE($6, marks_total),
           marks_theory = COALESCE($7, marks_theory),
           marks_activity = COALESCE($8, marks_activity),
           marks_practicum = COALESCE($9, marks_practicum),
           pass_total = COALESCE($10, pass_total),
           pass_practicum = COALESCE($11, pass_practicum),
           euserid = $12,
           edate = CURRENT_DATE
       WHERE subjectid = $13 AND del = false
       RETURNING *`,
      [
        langid, examid, subject, syllabus, subj_doc,
        marks_total, marks_theory, marks_activity, marks_practicum,
        pass_total, pass_practicum, euserid, subjectid
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Subject updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subjectid = searchParams.get('subjectid');
    const euserid = searchParams.get('euserid');

    if (!subjectid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing subjectid or euserid' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE esubject 
       SET del = true, euserid = $1, edate = CURRENT_DATE
       WHERE subjectid = $2
       RETURNING subjectid`,
      [euserid, subjectid]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
