import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');
  const adminToken = process.env.ADMIN_TOKEN || 'admin-token';
  return NextResponse.json({ isAdmin: !!token && token === adminToken });
}
