import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const sql = `
      SELECT e.*, l.lang_name as language
      FROM exam e
      LEFT JOIN language l ON e.langid = l.langid
      WHERE e.del = false
      ORDER BY e.examid DESC
    `;

    const result = await query(sql);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error("GET exams error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { langid, exam, syllabus, exam_doc, marks_total, euserid } = body;

    if (!langid || !exam || !euserid) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await query(
      `INSERT INTO exam (langid, exam, syllabus, exam_doc, marks_total, euserid, edate, del)
       VALUES ($1,$2,$3,$4,$5,$6,CURRENT_DATE,false)
       RETURNING *`,
      [langid, exam, syllabus, exam_doc, marks_total, euserid],
    );

    return NextResponse.json({
      success: true,
      message: "Exam created successfully",
    });
  } catch (error: any) {
    console.error("POST exam error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { examid, langid, exam, syllabus, exam_doc, marks_total, euserid } =
      body;

    if (!examid || !euserid) {
      return NextResponse.json(
        { success: false, error: "Missing examid or euserid" },
        { status: 400 },
      );
    }

    const result = await query(
      `UPDATE exam SET
        langid = COALESCE($1, langid),
        exam = COALESCE($2, exam),
        syllabus = COALESCE($3, syllabus),
        exam_doc = COALESCE($4, exam_doc),
        marks_total = COALESCE($5, marks_total),
        euserid = $6,
        edate = CURRENT_DATE
      WHERE examid = $7 AND del = false
      RETURNING *`,
      [langid, exam, syllabus, exam_doc, marks_total, euserid, examid],
    );

    return NextResponse.json({
      success: true,
      message: "Exam updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const examid = searchParams.get("examid");
    const euserid = searchParams.get("euserid");

    if (!examid || !euserid) {
      return NextResponse.json(
        { success: false, error: "Missing examid or euserid" },
        { status: 400 },
      );
    }

    const result = await query(
      `UPDATE exam SET del = true, euserid = $1, edate = CURRENT_DATE WHERE examid = $2`,
      [euserid, examid],
    );

    return NextResponse.json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
