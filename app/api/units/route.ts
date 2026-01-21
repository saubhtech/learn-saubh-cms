import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subjectid = searchParams.get('subjectid');
    
    let sql = `
      SELECT u.*, s.subject as subject_name, e.exam as exam_name
      FROM eunit u
      LEFT JOIN esubject s ON u.subjectid = s.subjectid
      LEFT JOIN exam e ON s.examid = e.examid
      WHERE u.del = false
    `;
    const params: any[] = [];
    
    if (subjectid) {
      sql += ' AND u.subjectid = $1';
      params.push(subjectid);
    }
    
    sql += ' ORDER BY u.unitid DESC';
    
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
    const { langid, subjectid, unit, chapter, unit_doc, marks_total, euserid } = body;

    if (!langid || !subjectid || !unit || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO eunit (langid, subjectid, unit, chapter, unit_doc, marks_total, euserid, edate, del)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, false)
       RETURNING *`,
      [langid, subjectid, unit, chapter, unit_doc, marks_total, euserid]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Unit created successfully',
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
    const { unitid, langid, subjectid, unit, chapter, unit_doc, marks_total, euserid } = body;

    if (!unitid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing unitid or euserid' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE eunit 
       SET langid = COALESCE($1, langid),
           subjectid = COALESCE($2, subjectid),
           unit = COALESCE($3, unit),
           chapter = COALESCE($4, chapter),
           unit_doc = COALESCE($5, unit_doc),
           marks_total = COALESCE($6, marks_total),
           euserid = $7,
           edate = CURRENT_DATE
       WHERE unitid = $8 AND del = false
       RETURNING *`,
      [langid, subjectid, unit, chapter, unit_doc, marks_total, euserid, unitid]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Unit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Unit updated successfully',
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
    const unitid = searchParams.get('unitid');
    const euserid = searchParams.get('euserid');

    if (!unitid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing unitid or euserid' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE eunit 
       SET del = true, euserid = $1, edate = CURRENT_DATE
       WHERE unitid = $2
       RETURNING unitid`,
      [euserid, unitid]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Unit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Unit deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
