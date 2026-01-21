import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [exams, subjects, lessons, questions, learners, teachers] = await Promise.all([
      query('SELECT COUNT(*) FROM exam WHERE del = false'),
      query('SELECT COUNT(*) FROM esubject WHERE del = false'),
      query('SELECT COUNT(*) FROM elesson WHERE del = false'),
      query('SELECT COUNT(*) FROM equest WHERE del = false'),
      query('SELECT COUNT(*) FROM elearner WHERE del = false'),
      query('SELECT COUNT(*) FROM eteacher WHERE del = false'),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        exams: +exams.rows[0].count,
        subjects: +subjects.rows[0].count,
        lessons: +lessons.rows[0].count,
        questions: +questions.rows[0].count,
        learners: +learners.rows[0].count,
        teachers: +teachers.rows[0].count,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
