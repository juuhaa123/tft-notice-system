import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();

    const request_stmt = db.prepare('SELECT * FROM requests WHERE id = ?');
    const request_data = request_stmt.get(params.id) as any;

    if (!request_data) {
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const files_stmt = db.prepare('SELECT * FROM files WHERE request_id = ?');
    const files = files_stmt.all(params.id) as any[];

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = new URL(request.url).searchParams.get('token');
    const adminToken = process.env.ADMIN_TOKEN || 'admin-token';

    if (token !== adminToken) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!['pending', 'approved', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: '잘못된 상태입니다' },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE requests
      SET status = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(status, now, params.id);

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
  { params }: { params: { id: string } }
) {
  try {
    const token = new URL(request.url).searchParams.get('token');
    const adminToken = process.env.ADMIN_TOKEN || 'admin-token';

    if (token !== adminToken) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    const db = getDb();

    const stmt = db.prepare('DELETE FROM requests WHERE id = ?');
    stmt.run(params.id);

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
