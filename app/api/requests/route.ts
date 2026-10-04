import { NextRequest, NextResponse } from 'next/server';
import { getDb, NoticeRequest } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import formidable from 'formidable';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const team = formData.get('team') as string;
    const leader_name = formData.get('leader_name') as string;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const scheduled_date = formData.get('scheduled_date') as string;

    if (!team || !leader_name || !title || !content || !scheduled_date) {
      return NextResponse.json(
        { error: '필수 필드를 입력해주세요' },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO requests (id, team, leader_name, title, content, scheduled_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `);

    stmt.run(id, team, leader_name, title, content, scheduled_date, now, now);

    // 파일 처리
    const files = formData.getAll('files') as File[];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileStmt = db.prepare(`
      INSERT INTO files (id, request_id, file_name, file_path, file_type, file_size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileId = uuidv4();
      const fileName = `${fileId}-${file.name}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      fileStmt.run(
        fileId,
        id,
        file.name,
        `/uploads/${fileName}`,
        file.type,
        buffer.length,
        now
      );
    }

    return NextResponse.json(
      { id, message: '공지 요청이 등록되었습니다' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: '요청 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as string | null;
    const token = searchParams.get('token') as string | null;

    // 관리자 토큰 확인 (환경 변수에서 읽음)
    const adminToken = process.env.ADMIN_TOKEN || 'admin-token';
    const isAdmin = token === adminToken;

    const db = getDb();
    let query = 'SELECT * FROM requests';
    const params: any[] = [];

    if (status && isAdmin) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as NoticeRequest[];

    return NextResponse.json({ data: rows, isAdmin });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: '요청 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
