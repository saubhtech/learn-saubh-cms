import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET QUESTIONS + JOINS
export async function GET(req: NextRequest) {
  try {
    const sql = `
      SELECT q.*, 
        json_agg(json_build_object(
          'lessonid', l.lessonid,
          'lesson', l.lesson,
          'subjectid', s.subjectid,
          'subject', s.subject,
          'examid', e.examid,
          'exam', e.exam
        )) AS lessons
      FROM equest q
      JOIN elesson l ON l.lessonid = ANY(q.lessonid)
      JOIN esubject s ON s.subjectid = l.subjectid
      JOIN exam e ON e.examid = s.examid
      WHERE q.del = false
      GROUP BY q.questid
      ORDER BY q.questid DESC;
    `;

    const result = await query(sql);
    return NextResponse.json({ success: true, data: result.rows });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST (CREATE)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { langid, lessonid, question, quest_doc, answer, answer_doc, explain, euserid } = body;

    if (!langid || !lessonid || !question || !answer || !euserid) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO equest (langid, lessonid, question, quest_doc, answer, answer_doc, explain, euserid, edate, del)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, false)
       RETURNING *`,
      [langid, lessonid, question, quest_doc, answer, answer_doc, explain, euserid]
    );

    return NextResponse.json({ success: true, data: result.rows[0], message: 'Question created successfully' });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT (UPDATE)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { questid, langid, lessonid, question, quest_doc, answer, answer_doc, explain, euserid } = body;

    if (!questid || !euserid) {
      return NextResponse.json({ success: false, error: 'Missing questid or euserid' }, { status: 400 });
    }

    const result = await query(
      `UPDATE equest SET
        langid = COALESCE($1, langid),
        lessonid = COALESCE($2, lessonid),
        question = COALESCE($3, question),
        quest_doc = COALESCE($4, quest_doc),
        answer = COALESCE($5, answer),
        answer_doc = COALESCE($6, answer_doc),
        explain = COALESCE($7, explain),
        euserid = $8,
        edate = CURRENT_DATE
      WHERE questid = $9 AND del = false
      RETURNING *`,
      [langid, lessonid, question, quest_doc, answer, answer_doc, explain, euserid, questid]
    );

    return NextResponse.json({ success: true, data: result.rows[0], message: 'Question updated successfully' });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE (SOFT)
export async function DELETE(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const questid = params.get('questid');
    const euserid = params.get('euserid');

    if (!questid || !euserid)
      return NextResponse.json({ success: false, error: 'Missing questid or euserid' }, { status: 400 });

    await query(
      `UPDATE equest SET del = true, euserid = $1, edate = CURRENT_DATE WHERE questid = $2`,
      [euserid, questid]
    );

    return NextResponse.json({ success: true, message: 'Question deleted successfully' });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
