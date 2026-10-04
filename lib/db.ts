import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'data.json');

interface DbData {
  requests: NoticeRequest[];
  files: FileRecord[];
}

export function getDb(): DbData {
  try {
    if (existsSync(dbPath)) {
      const data = readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('DB file not found, creating new one');
  }
  
  return { requests: [], files: [] };
}

export function saveDb(data: DbData) {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

export type NoticeRequest = {
  id: string;
  team: string;
  leader_name: string;
  title: string;
  content: string;
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
