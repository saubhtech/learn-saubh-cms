import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subjectid = searchParams.get('subjectid');
    const unitid = searchParams.get('unitid');

    let sql = `
      SELECT l.*, 
        s.subject AS subject_name,
        u.unit AS unit_name,
        e.exam AS exam_name
      FROM elesson l
      LEFT JOIN esubject s ON l.subjectid = s.subjectid
      LEFT JOIN eunit u ON l.unitid = u.unitid
      LEFT JOIN exam e ON s.examid = e.examid
      WHERE l.del = false
    `;
    
    const params: any[] = [];

    if (subjectid) {
      sql += ` AND l.subjectid = $1`;
      params.push(subjectid);
    }

    if (unitid) {
      sql += params.length === 0 ? ` AND l.unitid = $1` : ` AND l.unitid = $2`;
      params.push(unitid);
    }

    sql += ` ORDER BY l.lessonid DESC`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      langid, subjectid, unitid, lesson, content,
      topicid, lesson_doc, lesson_audio, lesson_video,
      marks_total, euserid 
    } = body;

    if (!langid || !subjectid || !lesson || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO elesson (
        langid, subjectid, unitid, lesson, content,
        topicid, lesson_doc, lesson_audio, lesson_video,
        marks_total, euserid, edate, del
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,CURRENT_DATE,false)
      RETURNING *`,
      [
        langid, subjectid, unitid || null, lesson, content || null,
        topicid || null, lesson_doc || null, lesson_audio || null, lesson_video || null,
        marks_total || null, euserid
      ]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Lesson created successfully',
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      lessonid, langid, subjectid, unitid, lesson, content,
      topicid, lesson_doc, lesson_audio, lesson_video,
      marks_total, euserid 
    } = body;

    if (!lessonid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing lessonid or euserid' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE elesson SET
        langid = COALESCE($1, langid),
        subjectid = COALESCE($2, subjectid),
        unitid = COALESCE($3, unitid),
        lesson = COALESCE($4, lesson),
        content = COALESCE($5, content),
        topicid = COALESCE($6, topicid),
        lesson_doc = COALESCE($7, lesson_doc),
        lesson_audio = COALESCE($8, lesson_audio),
        lesson_video = COALESCE($9, lesson_video),
        marks_total = COALESCE($10, marks_total),
        euserid = $11,
        edate = CURRENT_DATE
      WHERE lessonid = $12 AND del = false
      RETURNING *`,
      [
        langid, subjectid, unitid, lesson, content,
        topicid, lesson_doc, lesson_audio, lesson_video,
        marks_total, euserid, lessonid
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Lesson updated successfully',
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lessonid = searchParams.get('lessonid');
    const euserid = searchParams.get('euserid');

    if (!lessonid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing lessonid or euserid' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE elesson SET del = true, euserid = $1, edate = CURRENT_DATE
      WHERE lessonid = $2 RETURNING lessonid`,
      [euserid, lessonid]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully',
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
