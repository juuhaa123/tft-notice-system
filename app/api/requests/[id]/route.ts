import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, saveUpload, deleteUpload } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const request_data = db.requests.find(r => r.id === id);

    if (!request_data) {
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const files = db.files.filter(f => f.request_id === id);

    return NextResponse.json({
      data: { ...request_data, files }
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    return NextResponse.json(
      { error: '요청 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.formData();
    const field = (name: string) => String(body.get(name) || '').trim();

    const team = field('team');
    const leader_name = field('leader_name');
    const titleBody = field('title')
      .replace(/^(\[2026 창문축제 TFT\]|\[창문축제\])\s*/, '')
      .trim();
    const content = field('content');
    const scheduled_date = field('scheduled_date');
    const titleEnBody = field('title_en').replace(/^\[Changmun Festival\]\s*/i, '').trim();
    const title_en = titleEnBody ? `[Changmun Festival] ${titleEnBody}` : '';
    const content_en = field('content_en');
    const contact_role = field('contact_role');
    const contact_name = field('contact_name');
    const contact_email = field('contact_email');
    const contact_role_en = field('contact_role_en');
    const contact_name_en = field('contact_name_en');
    const contact_email_en = field('contact_email_en');

    let removeIds: string[] = [];
    try {
      const parsed = JSON.parse(field('remove_file_ids') || '[]');
      if (Array.isArray(parsed)) removeIds = parsed.map(String);
    } catch {}
    const newFiles = body.getAll('files') as File[];

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
    if (!/^\S+@\S+\.\S+$/.test(contact_email) || (contact_email_en && !/^\S+@\S+\.\S+$/.test(contact_email_en))) {
      return NextResponse.json(
        { error: '이메일 형식을 확인해주세요' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const index = db.requests.findIndex(r => r.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const current = db.requests[index];
    const updated = {
      ...current,
      team,
      leader_name,
      title: `[2026 창문축제 TFT] ${titleBody}`,
      content,
      contact_role,
      contact_name,
      contact_email,
      scheduled_date,
      updated_at: new Date().toISOString(),
    };
    delete updated.title_en;
    delete updated.content_en;
    delete updated.contact_role_en;
    delete updated.contact_name_en;
    delete updated.contact_email_en;
    if (contact_role_en) updated.contact_role_en = contact_role_en;
    if (contact_name_en) updated.contact_name_en = contact_name_en;
    if (contact_email_en) updated.contact_email_en = contact_email_en;
    if (title_en) updated.title_en = title_en;
    if (content_en) updated.content_en = content_en;

    db.requests[index] = updated;

    const removed = db.files.filter(f => f.request_id === id && removeIds.includes(f.id));
    db.files = db.files.filter(f => !removed.includes(f));

    const now = new Date().toISOString();
    for (const file of newFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
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
    await Promise.all(removed.map(f => deleteUpload(f.file_path)));

    return NextResponse.json({ message: '요청이 수정되었습니다' });
  } catch (error) {
    console.error('Error editing request:', error);
    return NextResponse.json(
      { error: '요청 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = new URL(request.url).searchParams.get('token');
    const adminToken = process.env.ADMIN_TOKEN || 'admin-token';

    if (token !== adminToken) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, pinned } = body;

    if (status === undefined && pinned === undefined) {
      return NextResponse.json(
        { error: '변경할 내용이 없습니다' },
        { status: 400 }
      );
    }
    if (status !== undefined && !['pending', 'approved', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: '잘못된 상태입니다' },
        { status: 400 }
      );
    }
    if (pinned !== undefined && typeof pinned !== 'boolean') {
      return NextResponse.json(
        { error: '잘못된 고정 값입니다' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date().toISOString();

    const requestIndex = db.requests.findIndex(r => r.id === id);
    if (requestIndex === -1) {
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (status !== undefined) {
      db.requests[requestIndex].status = status as 'pending' | 'approved' | 'completed';
    }
    if (pinned !== undefined) {
      if (pinned) db.requests[requestIndex].pinned = true;
      else delete db.requests[requestIndex].pinned;
    }
    db.requests[requestIndex].updated_at = now;
    await saveDb(db);

    return NextResponse.json({
      message: '요청이 업데이트되었습니다'
    });
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json(
      { error: '요청 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = new URL(request.url).searchParams.get('token');
    const adminToken = process.env.ADMIN_TOKEN || 'admin-token';

    if (token !== adminToken) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    const db = await getDb();
    const orphaned = db.files.filter(f => f.request_id === id);
    db.requests = db.requests.filter(r => r.id !== id);
    db.files = db.files.filter(f => f.request_id !== id);
    await saveDb(db);
    await Promise.all(orphaned.map(f => deleteUpload(f.file_path)));

    return NextResponse.json({
      message: '요청이 삭제되었습니다'
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { error: '요청 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
