import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT l.*, e.exam AS exam_name, s.subject AS subject_name
      FROM elearner l
      LEFT JOIN exam e ON e.examid = l.examid
      LEFT JOIN esubject s ON s.subjectid = l.subjectid
      WHERE l.del = false
      ORDER BY l.learnerid DESC
    `);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userid, langid, examid, subjectid, euserid } = body;

    if (!userid || !langid || !examid || !subjectid || !euserid)
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });

    await query(
      `INSERT INTO elearner (userid, langid, examid, subjectid, euserid)
       VALUES ($1, $2, $3, $4, $5)`,
      [userid, langid, examid, subjectid, euserid]
    );

    return NextResponse.json({ success: true, message: 'Learner created' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { learnerid, userid, langid, examid, subjectid, euserid } = body;

    if (!learnerid || !euserid)
      return NextResponse.json({ success: false, error: 'Missing learnerid or euserid' }, { status: 400 });

    await query(
      `UPDATE elearner
       SET userid=$1, langid=$2, examid=$3, subjectid=$4, euserid=$5, edate=CURRENT_DATE
       WHERE learnerid=$6 AND del=false`,
      [userid, langid, examid, subjectid, euserid, learnerid]
    );

    return NextResponse.json({ success: true, message: 'Learner updated' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const learnerid = sp.get('learnerid');
  const euserid = sp.get('euserid');

  if (!learnerid || !euserid)
    return NextResponse.json({ success: false, error: 'Missing params' }, { status: 400 });

  await query(
    `UPDATE elearner SET del=true, euserid=$1, edate=CURRENT_DATE WHERE learnerid=$2`,
    [euserid, learnerid]
  );

  return NextResponse.json({ success: true, message: 'Learner deleted' });
}
