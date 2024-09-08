import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

interface Assignment {
  id: number;
  van_id: number;
  operator_id: number;
  assigned_at: string;
  status: string;
  queued_at?: string;
}

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM assignments');
    const assignments = rows as Assignment[];
    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching vans:', error);
    return new Response('Error fetching vans', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { van_id, action, queued_at } = await request.json();
    console.log('Received POST request:', { van_id, action, queued_at });

    if (!van_id || !action) {
      return new Response('Missing van_id or action', { status: 400 });
    }

    let query = '';
    let params = [];
    
    if (action === 'queue') {
      if (!queued_at) {
        return new Response('Missing queued_at for queue action', { status: 400 });
      }
      query = 'UPDATE assignments SET status = "queued", queued_at = ? WHERE van_id = ?';
      params = [queued_at, van_id];
    } else if (['waiting', 'departed', 'arrived'].includes(action)) {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT status FROM assignments WHERE van_id = ?', [van_id]);
      const currentStatus = (rows as Assignment[])[0]?.status;

      console.log('Current status:', currentStatus);

      const validTransitions: { [key: string]: string[] } = {
        'queued': ['waiting'],
        'waiting': ['departed'],
        'departed': ['arrived'],
        'arrived': []
      };

      if (validTransitions[currentStatus]?.includes(action)) {
        query = 'UPDATE assignments SET status = ? WHERE van_id = ?';
        params = [action, van_id];
      } else {
        console.log(`Invalid transition attempt from ${currentStatus} to ${action}`);
        return new Response(`Invalid status transition from ${currentStatus} to ${action}`, { status: 400 });
      }
    } else {
      return new Response('Invalid action', { status: 400 });
    }

    await pool.query(query, params);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating van status:', error);
    return new Response('Error updating van status', { status: 500 });
  }
}
