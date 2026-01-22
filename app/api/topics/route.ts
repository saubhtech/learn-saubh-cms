import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const lessonid = request.nextUrl.searchParams.get('lessonid');

    let sql = `
      SELECT t.*,
             l.lesson AS lesson_name,
             s.subject AS subject_name,
             e.exam AS exam_name,
             ln.lang_name AS language
      FROM etopic t
      JOIN elesson l ON t.lessonid = l.lessonid
      JOIN esubject s ON l.subjectid = s.subjectid
      JOIN exam e ON s.examid = e.examid
      LEFT JOIN language ln ON t.langid = ln.langid
      WHERE t.del = false
    `;

    const params: any[] = [];

    if (lessonid) {
      sql += ' AND t.lessonid = $1';
      params.push(lessonid);
    }

    sql += ' ORDER BY t.topicid DESC';

    const result = await query(sql, params);
    return NextResponse.json({ success: true, data: result.rows });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { langid, lessonid, topic, explain, topic_doc, topic_audio, topic_video, euserid } = body;

    if (!langid || !lessonid || !topic || !euserid) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO etopic
       (langid, lessonid, topic, explain, topic_doc, topic_audio, topic_video, euserid, edate, del)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_DATE,false)
       RETURNING *`,
      [langid, lessonid, topic, explain, topic_doc, topic_audio, topic_video, euserid]
    );

    return NextResponse.json({ success: true, data: res.rows[0], message: 'Topic created successfully' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicid, langid, lessonid, topic, explain, topic_doc, topic_audio, topic_video, euserid } = body;

    if (!topicid || !euserid) {
      return NextResponse.json({ success: false, error: 'Missing topicid or euserid' }, { status: 400 });
    }

    const res = await query(
      `UPDATE etopic
       SET langid = COALESCE($1, langid),
           lessonid = COALESCE($2, lessonid),
           topic = COALESCE($3, topic),
           explain = COALESCE($4, explain),
           topic_doc = COALESCE($5, topic_doc),
           topic_audio = COALESCE($6, topic_audio),
           topic_video = COALESCE($7, topic_video),
           euserid = $8,
           edate = CURRENT_DATE
       WHERE topicid = $9 AND del = false
       RETURNING *`,
      [langid, lessonid, topic, explain, topic_doc, topic_audio, topic_video, euserid, topicid]
    );

    return NextResponse.json({ success: true, data: res.rows[0], message: 'Topic updated successfully' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const topicid = request.nextUrl.searchParams.get('topicid');
    const euserid = request.nextUrl.searchParams.get('euserid');

    if (!topicid || !euserid) {
      return NextResponse.json({ success: false, error: 'Missing topicid or euserid' }, { status: 400 });
    }

    const r = await query(
      `UPDATE etopic
       SET del = true, euserid = $1, edate = CURRENT_DATE
       WHERE topicid = $2
       RETURNING topicid`,
      [euserid, topicid]
    );

    return NextResponse.json({ success: true, message: 'Topic deleted successfully' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
