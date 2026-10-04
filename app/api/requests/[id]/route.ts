import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const request_data = db.requests.find(r => r.id === params.id);

    if (!request_data) {
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const files = db.files.filter(f => f.request_id === params.id);

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
    
    const requestIndex = db.requests.findIndex(r => r.id === params.id);
    if (requestIndex === -1) {
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    db.requests[requestIndex].status = status as 'pending' | 'approved' | 'completed';
    db.requests[requestIndex].updated_at = now;
    saveDb(db);

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
    db.requests = db.requests.filter(r => r.id !== params.id);
    db.files = db.files.filter(f => f.request_id !== params.id);
    saveDb(db);

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
