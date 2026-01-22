import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      `SELECT langid, lang_name 
       FROM language 
       WHERE is_active = true 
       ORDER BY lang_name ASC;`
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
