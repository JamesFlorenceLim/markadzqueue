import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Create a connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,  // Adjust as needed
  queueLimit: 0,
});

export async function POST(req: NextRequest) {
  try {
    // Destructure the request body
    const { id, status } = await req.json();

    // Update the assignment status
    await pool.query('UPDATE assignments SET status = ? WHERE id = ?', [status, id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating assignment status:', error.message);
    return NextResponse.json({ message: 'Error updating assignment status', error: error.message }, { status: 500 });
  }
}
