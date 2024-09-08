import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });


  
  export async function GET(request: Request) {
    const url = new URL(request.url);
    const terminal = url.searchParams.get('terminal');
  
    if (!terminal) {
      return NextResponse.json({ error: 'Terminal parameter is required' }, { status: 400 });
    }
  
    try {
      const [rows] = await pool.query('SELECT * FROM assignments WHERE terminal = ?', [terminal]);
      return NextResponse.json(rows);
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
  }
  
  export async function PUT(request: Request) {
    const body = await request.json();
    const { id, status, terminal } = body;
  
    if (!id || !status || !terminal) {
      return NextResponse.json({ error: 'ID, status, and terminal are required' }, { status: 400 });
    }
  
    try {
      let newTerminal = terminal;
  
      if (status === 'arrived') {
        newTerminal = terminal === 'terminal1' ? 'terminal2' : 'terminal1';
      }
  
      await pool.query(
        'UPDATE assignments SET status = ?, terminal = ? WHERE id = ?',
        [status, newTerminal, id]
      );
  
      return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
    }
  }