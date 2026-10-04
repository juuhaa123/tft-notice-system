'use client';

import { useState, useRef } from 'react';

const TEAMS = [
  '무대운영팀',
  '기획운영팀',
  '본부팀',
  '지원팀',
  '데코팀',
  '디자인팀',
  '미디어팀',
];

const fieldClass =
  'w-full rounded-[14px] border border-line bg-canvas px-4 py-3.5 text-base text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function Label({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-body">
      {children}
      {required && <span className="ml-1 text-primary">*</span>}
      {optional && <span className="ml-1 font-normal text-muted">(선택)</span>}
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

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 4 * 1024 * 1024) {
      setMessage('첨부파일은 총 4MB 이하만 올릴 수 있어요. 큰 파일은 링크로 공유해 주세요.');
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
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto max-w-xl px-5 pb-16 pt-12">
        <header className="mb-10">
          <p className="mb-3 inline-block rounded-lg bg-weak px-3 py-1 text-sm font-semibold text-weak-fg">
            TFT 공지 요청
          </p>
          <h1 className="text-4xl font-bold leading-[1.5] text-foreground">
            전하고 싶은 공지를
            <br />
            남겨주세요
          </h1>
          <p className="mt-3 text-base text-body">확인 후 HISNet에 게시해 드려요.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label required>팀 선택</Label>
            <select name="team" value={formData.team} onChange={handleChange} className={fieldClass}>
              <option value="">팀을 선택하세요</option>
              {TEAMS.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div>
            <Label required>팀장명</Label>
            <input
              type="text"
              name="leader_name"
              value={formData.leader_name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              className={fieldClass}
            />
          </div>

          <div>
            <Label required>공지 제목</Label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="공지 제목을 입력하세요"
              className={fieldClass}
            />
          </div>

          <div>
            <Label required>공지 내용</Label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="공지 내용을 입력하세요"
              rows={6}
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div>
            <Label required>게시 희망 일자</Label>
            <input
              type="datetime-local"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>

          <div>
            <Label optional>파일 첨부</Label>
            <div
              className="cursor-pointer rounded-[14px] bg-surface p-6 text-center transition hover:bg-line"
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="font-semibold text-foreground">파일 선택하기</p>
              <p className="mt-1 text-sm text-muted">포스터, 이미지, PDF, 문서 파일</p>
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
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between rounded-[14px] bg-surface px-4 py-3">
                    <span className="truncate text-sm text-body">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-3 text-sm font-semibold text-muted hover:text-danger"
                      aria-label="파일 삭제"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {message && (
            <div
              role="status"
              className={`rounded-[14px] px-4 py-3.5 text-center text-sm font-semibold ${
                message.includes('성공') ? 'bg-weak text-weak-fg' : 'bg-surface text-danger'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-primary px-5 text-[17px] font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? '등록 중...' : '공지 요청하기'}
          </button>
        </form>

        <div className="mt-12 border-t border-line pt-6 text-center">
          <a href="/admin" className="text-sm font-semibold text-muted hover:text-body">
            관리자 대시보드
          </a>
        </div>
      </main>
    </div>
  );
}
