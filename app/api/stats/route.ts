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
        exams: parseInt(exams.rows[0].count),
        subjects: parseInt(subjects.rows[0].count),
        lessons: parseInt(lessons.rows[0].count),
        questions: parseInt(questions.rows[0].count),
        learners: parseInt(learners.rows[0].count),
        teachers: parseInt(teachers.rows[0].count),
      },
    });
  } catch (error: any) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
