import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, NoticeRequest } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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

    const newRequest: NoticeRequest = {
      id,
      team,
      leader_name,
      title,
      content,
      scheduled_date,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    db.requests.push(newRequest);

    const files = formData.getAll('files') as File[];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileId = uuidv4();
      const fileName = `${fileId}-${file.name}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      db.files.push({
        id: fileId,
        request_id: id,
        file_name: file.name,
        file_path: `/uploads/${fileName}`,
        file_type: file.type,
        file_size: buffer.length,
        created_at: now,
      });
    }

    saveDb(db);

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

    const adminToken = process.env.ADMIN_TOKEN || 'admin-token';
    const isAdmin = token === adminToken;

    const db = getDb();
    let rows = db.requests;

    if (status && isAdmin) {
      rows = rows.filter(r => r.status === status);
    }

    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ data: rows, isAdmin });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: '요청 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
