import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Fetch from the view created in the schema
    const result = await query(`
      SELECT 
        learnerid,
        userid,
        exam_name,
        subject_name,
        total_tests,
        avg_score_percentage,
        completed_tests
      FROM v_learner_progress 
      ORDER BY learnerid DESC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('GET Tests error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}