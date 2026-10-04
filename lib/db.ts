import { get, put, del } from '@vercel/blob';
import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

const DB_PATHNAME = 'tft/data.json';
const UPLOAD_PREFIX = 'tft/uploads/';
const useBlob = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const localPath = (pathname: string) => path.join(process.cwd(), 'data', pathname);

export type NoticeRequest = {
  id: string;
  team: string;
  leader_name: string;
  title: string;
  content: string;
  title_en?: string;
  content_en?: string;
  pinned?: boolean;
  scheduled_date: string;
  status: 'pending' | 'approved' | 'completed';
  created_at: string;
  updated_at: string;
};

export type FileRecord = {
  id: string;
  request_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
};

export interface DbData {
  requests: NoticeRequest[];
  files: FileRecord[];
}

export async function getDb(): Promise<DbData> {
  if (useBlob()) {
    const result = await get(DB_PATHNAME, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200) return { requests: [], files: [] };
    return JSON.parse(await new Response(result.stream).text());
  }
  try {
    return JSON.parse(await readFile(localPath('data.json'), 'utf-8'));
  } catch {
    return { requests: [], files: [] };
  }
}

export async function saveDb(data: DbData) {
  const body = JSON.stringify(data, null, 2);
  if (useBlob()) {
    await put(DB_PATHNAME, body, {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    return;
  }
  await mkdir(path.dirname(localPath('data.json')), { recursive: true });
  await writeFile(localPath('data.json'), body, 'utf-8');
}

export async function saveUpload(id: string, fileName: string, buffer: Buffer, contentType: string) {
  const pathname = `${UPLOAD_PREFIX}${id}-${fileName}`;
  if (useBlob()) {
    await put(pathname, buffer, {
      access: 'private',
      addRandomSuffix: false,
      contentType: contentType || 'application/octet-stream',
    });
  } else {
    await mkdir(path.dirname(localPath(pathname)), { recursive: true });
    await writeFile(localPath(pathname), buffer);
  }
  return pathname;
}

export async function deleteUpload(pathname: string) {
  if (!pathname.startsWith(UPLOAD_PREFIX) || pathname.includes('..')) return;
  try {
    if (useBlob()) await del(pathname);
    else await unlink(localPath(pathname));
  } catch {}
}

export async function readUpload(pathname: string): Promise<{ body: ReadableStream<Uint8Array> | Buffer; contentType: string } | null> {
  if (!pathname.startsWith(UPLOAD_PREFIX) || pathname.includes('..')) return null;
  if (useBlob()) {
    const result = await get(pathname, { access: 'private' });
    if (!result || result.statusCode !== 200) return null;
    return { body: result.stream, contentType: result.blob.contentType };
  }
  try {
    return { body: await readFile(localPath(pathname)), contentType: 'application/octet-stream' };
  } catch {
    return null;
  }
}
