import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Create a connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,  // You can adjust the connection limit as needed
  queueLimit: 0,
});

export async function GET(req: NextRequest) {
  try {
    // Query to fetch vans with specific statuses
    const [rows] = await pool.query(`
      SELECT 
        v.plate_number AS van_plate,
        CONCAT(o.firstname, ' ', o.lastname) AS operator_name,
        a.status
      FROM 
        assignments a
      JOIN 
        vans v ON a.van_id = v.id
      JOIN 
        operators o ON a.operator_id = o.id
      WHERE 
        a.status IN ('queued', 'waiting', 'departed', 'coming')
    `);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching vans with status:', error.message);
    return NextResponse.json({ message: 'Error fetching vans with status', error: error.message }, { status: 500 });
  }
}
