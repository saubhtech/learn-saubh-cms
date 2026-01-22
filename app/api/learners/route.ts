import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        l.learnerid,
        l.userid,
        l.langid,
        l.examid,
        l.subjectid,
        l.euserid,
        l.edate,
        e.exam AS exam_name,
        s.subject AS subject_name,
        ln.lang_name
      FROM elearner l
      LEFT JOIN exam e ON e.examid = l.examid
      LEFT JOIN esubject s ON s.subjectid = l.subjectid
      LEFT JOIN language ln ON ln.langid = l.langid
      WHERE l.del = false
      ORDER BY l.learnerid DESC
    `);

    return NextResponse.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (err: any) {
    console.error('GET learners error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userid, langid, examid, subjectid, euserid } = body;

    // Validation
    if (!userid || !langid || !examid || !subjectid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userid, langid, examid, subjectid, euserid' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO elearner (userid, langid, examid, subjectid, euserid, edate, del)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, false)
       RETURNING *`,
      [userid, langid, examid, subjectid, euserid]
    );

    return NextResponse.json({
      success: true,
      message: 'Learner enrolled successfully',
      data: result.rows[0]
    });
  } catch (err: any) {
    console.error('POST learner error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { learnerid, userid, langid, examid, subjectid, euserid } = body;

    if (!learnerid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing learnerid or euserid' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE elearner
       SET userid = COALESCE($1, userid),
           langid = COALESCE($2, langid),
           examid = COALESCE($3, examid),
           subjectid = COALESCE($4, subjectid),
           euserid = $5,
           edate = CURRENT_DATE
       WHERE learnerid = $6 AND del = false
       RETURNING *`,
      [userid, langid, examid, subjectid, euserid, learnerid]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Learner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Learner updated successfully',
      data: result.rows[0]
    });
  } catch (err: any) {
    console.error('PUT learner error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const learnerid = sp.get('learnerid');
    const euserid = sp.get('euserid');

    if (!learnerid || !euserid) {
      return NextResponse.json(
        { success: false, error: 'Missing learnerid or euserid' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE elearner 
       SET del = true, euserid = $1, edate = CURRENT_DATE 
       WHERE learnerid = $2
       RETURNING learnerid`,
      [euserid, learnerid]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Learner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Learner deleted successfully'
    });
  } catch (err: any) {
    console.error('DELETE learner error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}