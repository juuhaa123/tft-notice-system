import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, saveUpload, NoticeRequest } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const team = formData.get('team') as string;
    const leader_name = formData.get('leader_name') as string;
    const rawTitle = ((formData.get('title') as string) || '').trim();
    const content = formData.get('content') as string;
    const scheduled_date = formData.get('scheduled_date') as string;
    const title_en = ((formData.get('title_en') as string) || '').trim();
    const content_en = ((formData.get('content_en') as string) || '').trim();
    const contact_role = ((formData.get('contact_role') as string) || '').trim();
    const contact_name = ((formData.get('contact_name') as string) || '').trim();
    const contact_email = ((formData.get('contact_email') as string) || '').trim();

    const titleBody = rawTitle.replace(/^(\[2026 창문축제 TFT\]|\[창문축제\])\s*/, '').trim();
    const title = `[2026 창문축제 TFT] ${titleBody}`;

    if (!team || !leader_name || !titleBody || !content || !scheduled_date) {
      return NextResponse.json(
        { error: '필수 필드를 입력해주세요' },
        { status: 400 }
      );
    }
    if (!contact_role || !contact_name || !contact_email) {
      return NextResponse.json(
        { error: '문의 직책, 이름, 이메일을 입력해주세요' },
        { status: 400 }
      );
    }
    if (!/^\S+@\S+\.\S+$/.test(contact_email)) {
      return NextResponse.json(
        { error: '이메일 형식을 확인해주세요' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const newRequest: NoticeRequest = {
      id,
      team,
      leader_name,
      title,
      content,
      ...(title_en && { title_en }),
      ...(content_en && { content_en }),
      contact_role,
      contact_name,
      contact_email,
      scheduled_date,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    db.requests.push(newRequest);

    // 파일 처리
    const files = formData.getAll('files') as File[];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileId = uuidv4();
      const storedPath = await saveUpload(fileId, file.name, buffer, file.type);

      db.files.push({
        id: fileId,
        request_id: id,
        file_name: file.name,
        file_path: storedPath,
        file_type: file.type,
        file_size: buffer.length,
        created_at: now,
      });
    }

    await saveDb(db);

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

    const db = await getDb();
    let rows = [...db.requests];

    if (status) {
      rows = rows.filter(r => r.status === status);
    }

    rows.sort(
      (a, b) =>
        Number(!!b.pinned) - Number(!!a.pinned) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const data = rows.map(r => ({ ...r, files: db.files.filter(f => f.request_id === r.id) }));

    return NextResponse.json({ data, isAdmin });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: '요청 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
