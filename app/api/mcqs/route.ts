import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET
export async function GET() {
  try {
    const sql = `
      SELECT m.*,
        json_agg(json_build_object(
          'lessonid', l.lessonid,
          'lesson', l.lesson
        )) AS lessons
      FROM emcq m
      JOIN elesson l ON l.lessonid = ANY(m.lessonid)
      WHERE m.del = false
      GROUP BY m.mcqid
      ORDER BY m.mcqid DESC;
    `;

    const result = await query(sql);
    return NextResponse.json({ success: true, data: result.rows });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { langid, lessonid, question, quest_doc, option1, option2, option3, option4, answer, answer_doc, explain, euserid } = body;

    if (!langid || !lessonid || !question || !answer || !euserid)
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });

    const sql = `
      INSERT INTO emcq (langid, lessonid, question, quest_doc, option1, option2, option3, option4, answer, answer_doc, explain, euserid, edate, del)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CURRENT_DATE,false)
      RETURNING *;
    `;

    const result = await query(sql, [langid, lessonid, question, quest_doc, option1, option2, option3, option4, answer, answer_doc, explain, euserid]);

    return NextResponse.json({ success: true, data: result.rows[0], message: 'MCQ created successfully' });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { mcqid, langid, lessonid, question, quest_doc, option1, option2, option3, option4, answer, answer_doc, explain, euserid } = body;

    if (!mcqid || !euserid)
      return NextResponse.json({ success: false, error: 'Missing mcqid or euserid' }, { status: 400 });

    const sql = `
      UPDATE emcq SET
        langid = COALESCE($1, langid),
        lessonid = COALESCE($2, lessonid),
        question = COALESCE($3, question),
        quest_doc = COALESCE($4, quest_doc),
        option1 = COALESCE($5, option1),
        option2 = COALESCE($6, option2),
        option3 = COALESCE($7, option3),
        option4 = COALESCE($8, option4),
        answer = COALESCE($9, answer),
        answer_doc = COALESCE($10, answer_doc),
        explain = COALESCE($11, explain),
        euserid = $12,
        edate = CURRENT_DATE
      WHERE mcqid = $13 AND del = false
      RETURNING *;
    `;

    const result = await query(sql, [langid, lessonid, question, quest_doc, option1, option2, option3, option4, answer, answer_doc, explain, euserid, mcqid]);

    return NextResponse.json({ success: true, data: result.rows[0], message: 'MCQ updated successfully' });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const mcqid = params.get('mcqid');
    const euserid = params.get('euserid');

    if (!mcqid || !euserid)
      return NextResponse.json({ success: false, error: 'Missing mcqid or euserid' }, { status: 400 });

    await query(`UPDATE emcq SET del = true, euserid = $1, edate = CURRENT_DATE WHERE mcqid = $2`, [euserid, mcqid]);

    return NextResponse.json({ success: true, message: 'MCQ deleted successfully' });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
