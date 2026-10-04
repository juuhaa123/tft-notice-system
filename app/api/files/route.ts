import { NextRequest, NextResponse } from 'next/server';
import { readUpload } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const pathname = searchParams.get('path');
  const name = searchParams.get('name') || 'file';

  const adminToken = process.env.ADMIN_TOKEN || 'admin-token';
  if (token !== adminToken) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }
  if (!pathname) {
    return NextResponse.json({ error: '파일 경로가 필요합니다' }, { status: 400 });
  }

  const file = await readUpload(pathname);
  if (!file) {
    return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 });
  }

  const body = file.body instanceof ReadableStream ? file.body : new Uint8Array(file.body);
  return new NextResponse(body, {
    headers: {
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
    },
  });
}
