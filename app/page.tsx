'use client';

import { useState, useRef } from 'react';
import DreamersLogo from '@/components/DreamersLogo';

const TEAMS = [
  '무대운영팀',
  '기획운영팀',
  '본부팀',
  '지원팀',
  '데코팀',
  '디자인팀',
  '미디어팀',
];

const DOTS = ['bg-dream-green', 'bg-dream-yellow', 'bg-dream-purple', 'bg-dream-pink', 'bg-dream-green', 'bg-dream-yellow'];

const inputClass =
  'w-full rounded-2xl border-2 border-black/10 bg-white px-4 py-3 text-black placeholder:text-black/35 focus:border-dream-pink focus:outline-none';

function Label({ index, children, optional }: { index: number; children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="mb-2 flex items-center gap-2 font-bold text-black">
      <span className={`inline-block h-3 w-3 rounded-full ${DOTS[index % DOTS.length]}`} />
      {children}
      {optional && <span className="text-sm font-normal text-black/45">(선택)</span>}
    </label>
  );
}

export default function Home() {
  const [formData, setFormData] = useState({
    team: '',
    leader_name: '',
    title: '',
    content: '',
    scheduled_date: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.team || !formData.leader_name || !formData.title || !formData.content || !formData.scheduled_date) {
      setMessage('모든 필수 필드를 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('team', formData.team);
      form.append('leader_name', formData.leader_name);
      form.append('title', formData.title);
      form.append('content', formData.content);
      form.append('scheduled_date', formData.scheduled_date);

      files.forEach(file => {
        form.append('files', file);
      });

      const response = await fetch('/api/requests', {
        method: 'POST',
        body: form,
      });

      if (response.ok) {
        setMessage('공지 요청이 성공적으로 등록되었습니다!');
        setFormData({ team: '', leader_name: '', title: '', content: '', scheduled_date: '' });
        setFiles([]);
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.error || '요청 처리 중 오류가 발생했습니다');
      }
    } catch (error) {
      setMessage('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ground">
      <div aria-hidden className="pointer-events-none absolute -right-16 top-40 h-56 w-56 rounded-full bg-dream-purple/20" />
      <div aria-hidden className="pointer-events-none absolute -left-10 top-[34rem] h-28 w-28 rounded-full bg-dream-green/20" />

      <header className="relative mx-auto max-w-2xl px-5 pb-6 pt-10">
        <DreamersLogo className="w-72 max-w-full sm:w-80" />
        <h1 className="mt-4 font-display text-4xl text-paper sm:text-5xl">
          공지 요청<span className="text-dream-yellow">.</span>
        </h1>
        <p className="mt-3 text-paper/70">
          꿈꾸는 우리의 이야기를 공지로 전해 보세요. 내용을 남겨주시면 확인 후 HISNet에 게시해 드려요.
        </p>
      </header>

      <main className="relative mx-auto max-w-2xl px-5 pb-16">
        <div className="rounded-[2rem] bg-paper p-6 text-black sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label index={0}>
                팀 선택 <span className="text-dream-pink">*</span>
              </Label>
              <select name="team" value={formData.team} onChange={handleChange} className={inputClass}>
                <option value="">팀을 선택하세요</option>
                {TEAMS.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            <div>
              <Label index={1}>
                팀장명 <span className="text-dream-pink">*</span>
              </Label>
              <input
                type="text"
                name="leader_name"
                value={formData.leader_name}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
                className={inputClass}
              />
            </div>

            <div>
              <Label index={2}>
                공지 제목 <span className="text-dream-pink">*</span>
              </Label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="공지 제목을 입력하세요"
                className={inputClass}
              />
            </div>

            <div>
              <Label index={3}>
                공지 내용 <span className="text-dream-pink">*</span>
              </Label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="공지 내용을 입력하세요"
                rows={6}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <Label index={4}>
                게시 희망 일자 <span className="text-dream-pink">*</span>
              </Label>
              <input
                type="datetime-local"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <Label index={5} optional>파일 첨부</Label>
              <div
                className="cursor-pointer rounded-2xl border-2 border-dashed border-black/30 bg-white/50 p-6 text-center transition hover:border-dream-pink hover:bg-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="font-bold">클릭하여 파일 선택</p>
                <p className="mt-1 text-sm text-black/50">포스터, 이미지, PDF, 문서 파일</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between rounded-2xl bg-white px-4 py-2">
                      <span className="truncate text-sm">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-3 font-bold text-dream-pink hover:text-black"
                        aria-label="파일 삭제"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message && (
              <div
                className={`rounded-2xl p-4 text-center font-bold text-black ${
                  message.includes('성공') ? 'bg-dream-green' : 'bg-dream-pink'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-black py-4 text-lg font-bold text-dream-yellow transition hover:bg-dream-pink hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '등록 중...' : '공지 요청하기'}
            </button>
          </form>
        </div>

        <footer className="mt-10 text-center text-sm text-paper/60">
          <a href="/admin" className="inline-block rounded-full border border-paper/30 px-5 py-2 transition hover:border-dream-yellow hover:text-dream-yellow">
            관리자 대시보드
          </a>
          <p className="mt-6 tracking-widest">HANDONG GLOBAL UNIVERSITY · Festival · 2026.10.04-06</p>
          <p className="mt-1">Matthew 28:19-20</p>
        </footer>
      </main>
    </div>
  );
}
