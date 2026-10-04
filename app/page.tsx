'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Status = 'pending' | 'approved' | 'completed';

type NoticeRequest = {
  id: string;
  team: string;
  leader_name: string;
  title: string;
  content: string;
  title_en?: string;
  content_en?: string;
  scheduled_date: string;
  status: Status;
  created_at: string;
};

type FileRecord = {
  id: string;
  file_name: string;
  file_path: string;
};

const TEAMS = ['무대운영팀', '기획운영팀', '본부팀', '지원팀', '데코팀', '디자인팀', '미디어팀'];
const TITLE_PREFIX = '[2026 창문축제 TFT]';
const TOKEN_KEY = 'tft_admin_token';

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

function formatDay(value: string) {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[2])}월 ${Number(m[3])}일` : value;
}

function formatDate(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function RequestForm({
  onClose,
  onSaved,
  initial,
}: {
  onClose: () => void;
  onSaved: () => void;
  initial?: NoticeRequest;
}) {
  const isEdit = !!initial;
  const [formData, setFormData] = useState({
    team: initial?.team ?? '',
    leader_name: initial?.leader_name ?? '',
    title: initial ? initial.title.replace(/^\[2026 창문축제 TFT\]\s*/, '') : '',
    content: initial?.content ?? '',
    title_en: initial?.title_en ?? '',
    content_en: initial?.content_en ?? '',
    scheduled_date: initial ? initial.scheduled_date.slice(0, 10) : '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.team || !formData.leader_name || !formData.title.trim() || !formData.content || !formData.scheduled_date) {
      setMessage('모든 필수 항목을 입력해주세요');
      return;
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 4 * 1024 * 1024) {
      setMessage('첨부파일은 총 4MB 이하만 올릴 수 있어요. 큰 파일은 링크로 공유해 주세요.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        const response = await fetch(`/api/requests/${initial!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            title: `${TITLE_PREFIX} ${formData.title.trim()}`,
          }),
        });
        if (response.ok) {
          onSaved();
        } else {
          const error = await response.json().catch(() => null);
          setMessage(error?.error || '수정 중 오류가 발생했습니다');
        }
        return;
      }

      const form = new FormData();
      form.append('team', formData.team);
      form.append('leader_name', formData.leader_name);
      form.append('title', `${TITLE_PREFIX} ${formData.title.trim()}`);
      form.append('content', formData.content);
      form.append('title_en', formData.title_en);
      form.append('content_en', formData.content_en);
      form.append('scheduled_date', formData.scheduled_date);
      files.forEach(file => form.append('files', file));

      const response = await fetch('/api/requests', { method: 'POST', body: form });

      if (response.ok) {
        onSaved();
      } else {
        const error = await response.json().catch(() => null);
        setMessage(error?.error || '요청 처리 중 오류가 발생했습니다');
      }
    } catch {
      setMessage('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-canvas p-6 sm:rounded-3xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={isEdit ? '공지 의뢰 수정' : '공지 의뢰 추가'}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">{isEdit ? '공지 의뢰 수정' : '공지 의뢰 추가'}</h2>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-muted hover:text-body">
            닫기
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <Label required>의뢰자명</Label>
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
            <div className="flex items-center rounded-[14px] border border-line bg-canvas focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span className="shrink-0 select-none whitespace-nowrap pl-4 text-base font-semibold text-primary">{TITLE_PREFIX}</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="제목을 입력하세요"
                className="w-full bg-transparent px-2 py-3.5 text-base text-foreground placeholder:text-muted focus:outline-none"
              />
            </div>
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
            <p className="mt-2 text-xs leading-5 text-muted">
              인사말, 마지막 성경 구절, 시그니처는 고정으로 들어가요. 본문 내용만 적어주세요.
            </p>
          </div>

          <div>
            <Label optional>영문 공지 제목</Label>
            <input
              type="text"
              name="title_en"
              value={formData.title_en}
              onChange={handleChange}
              placeholder="English title"
              className={fieldClass}
            />
          </div>

          <div>
            <Label optional>영문 공지 내용</Label>
            <textarea
              name="content_en"
              value={formData.content_en}
              onChange={handleChange}
              placeholder="English content"
              rows={5}
              className={`${fieldClass} resize-none`}
            />
            <p className="mt-2 text-xs leading-5 text-muted">
              영문 공지가 필요할 때만 적어주세요. 인사말, 성경 구절, 시그니처는 여기도 고정으로 들어가요.
            </p>
          </div>

          <div>
            <Label required>게시 희망 일자</Label>
            <input
              type="date"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>

          {isEdit ? (
            <p className="rounded-[14px] bg-surface px-4 py-3 text-sm text-body">
              첨부파일은 수정할 수 없어요. 파일을 바꾸려면 관리자에게 알려주세요.
            </p>
          ) : (
          <div>
            <Label optional>파일 첨부</Label>
            <div
              className="cursor-pointer rounded-[14px] bg-surface p-5 text-center transition hover:bg-line"
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="font-semibold text-foreground">파일 선택하기</p>
              <p className="mt-1 text-sm text-muted">포스터, 이미지, PDF, 문서 파일 (총 4MB까지)</p>
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
                      onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
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
          )}

          {message && (
            <div role="status" className="rounded-[14px] bg-surface px-4 py-3.5 text-center text-sm font-semibold text-danger">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-primary px-5 text-[17px] font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (isEdit ? '저장 중...' : '등록 중...') : isEdit ? '수정하기' : '의뢰하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const [requests, setRequests] = useState<NoticeRequest[]>([]);
  const [filesById, setFilesById] = useState<Record<string, FileRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NoticeRequest | null>(null);
  const [tab, setTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [toast, setToast] = useState('');
  const [token, setToken] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/requests', { cache: 'no-store' });
      const json = await res.json();
      const list: NoticeRequest[] = json.data || [];
      setRequests(list);

      const details = await Promise.all(
        list.map(r =>
          fetch(`/api/requests/${r.id}`, { cache: 'no-store' })
            .then(x => x.json())
            .then(x => [r.id, (x.data?.files || []) as FileRecord[]] as const)
            .catch(() => [r.id, [] as FileRecord[]] as const)
        )
      );
      setFilesById(Object.fromEntries(details));
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyToken = useCallback(async (candidate: string) => {
    const res = await fetch(`/api/requests?token=${encodeURIComponent(candidate)}`, { cache: 'no-store' });
    const json = await res.json();
    return !!json.isAdmin;
  }, []);

  useEffect(() => {
    loadRequests();

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const stored = (() => {
      try {
        return localStorage.getItem(TOKEN_KEY) || '';
      } catch {
        return '';
      }
    })();
    const candidate = urlToken || stored;
    if (!candidate) return;

    verifyToken(candidate).then(ok => {
      if (ok) {
        setToken(candidate);
        try {
          localStorage.setItem(TOKEN_KEY, candidate);
        } catch {}
        if (urlToken) window.history.replaceState(null, '', '/');
      } else {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {}
      }
    });
  }, [loadRequests, verifyToken]);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAdminLogin = async () => {
    const input = window.prompt('관리자 토큰을 입력하세요');
    if (!input) return;
    if (await verifyToken(input)) {
      setToken(input);
      try {
        localStorage.setItem(TOKEN_KEY, input);
      } catch {}
      showToast('관리자 모드로 전환했어요');
    } else {
      alert('토큰이 올바르지 않습니다');
    }
  };

  const handleAdminLogout = () => {
    setToken('');
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  };

  const handleStatusChange = async (id: string, status: Status) => {
    const res = await fetch(`/api/requests/${id}?token=${encodeURIComponent(token)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRequests(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    } else {
      alert('상태를 바꾸지 못했어요. 관리자 모드를 다시 확인해주세요.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 의뢰를 삭제할까요?')) return;
    const res = await fetch(`/api/requests/${id}?token=${encodeURIComponent(token)}`, { method: 'DELETE' });
    if (res.ok) setRequests(prev => prev.filter(r => r.id !== id));
  };

  const isAdmin = !!token;
  const pendingCount = requests.filter(r => r.status !== 'completed').length;
  const completedCount = requests.length - pendingCount;
  const visibleRequests =
    tab === 'all'
      ? requests
      : requests.filter(r => (tab === 'completed' ? r.status === 'completed' : r.status !== 'completed'));
  const tabs: { key: 'all' | 'pending' | 'completed'; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: requests.length },
    { key: 'pending', label: '대기중', count: pendingCount },
    { key: 'completed', label: '완료', count: completedCount },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto max-w-2xl px-5 pb-32 pt-12">
        <header className="mb-8">
          <p className="mb-3 inline-block rounded-lg bg-weak px-3 py-1 text-sm font-semibold text-weak-fg">
            창문축제 TFT
          </p>
          <h1 className="text-4xl font-bold leading-[1.5] text-foreground">히즈넷 공지 의뢰 목록</h1>
          <p className="mt-2 text-base text-body">
            전체 {requests.length}건 · 게시 대기 <span className="font-semibold text-primary">{pendingCount}</span>건
          </p>
          <div className="mt-5 rounded-[14px] bg-surface p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">포스터를 본문 속에 넣고 싶다면</p>
            <ol className="list-inside list-decimal space-y-1 text-sm leading-6 text-body">
              <li>포스터를 PNG와 PDF로 함께 첨부해주세요.</li>
              <li>공지 내용에서 포스터가 들어갈 자리에 (포스터)라고 적어주세요.</li>
            </ol>
          </div>
          {isAdmin && (
            <div className="mt-4 flex items-center justify-between rounded-[14px] bg-weak px-4 py-3 text-sm font-semibold text-weak-fg">
              <span>관리자 모드 · 게시 후 완료로 표시해 주세요</span>
              <button onClick={handleAdminLogout} className="underline">나가기</button>
            </div>
          )}
          <div className="mt-5 flex gap-2" role="tablist">
            {tabs.map(t => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`h-10 rounded-[10px] px-4 text-[15px] font-semibold transition ${
                  tab === t.key ? 'bg-foreground text-white' : 'bg-surface text-body hover:bg-line'
                }`}
              >
                {t.label} <span className={tab === t.key ? 'text-white/70' : 'text-muted'}>{t.count}</span>
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <p className="py-16 text-center text-muted">불러오는 중...</p>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl bg-surface p-12 text-center text-body">
            아직 의뢰가 없어요.
            <br />
            오른쪽 아래 + 버튼으로 첫 의뢰를 추가해 보세요.
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="rounded-2xl bg-surface p-12 text-center text-body">
            {tab === 'pending' ? '대기중인 의뢰가 없어요.' : '완료된 의뢰가 없어요.'}
          </div>
        ) : (
          <ul className="space-y-3">
            {visibleRequests.map(request => {
              const files = filesById[request.id] || [];
              const isOpen = expanded === request.id;
              const done = request.status === 'completed';
              return (
                <li key={request.id} className={`rounded-2xl border p-5 ${done ? 'border-line bg-surface' : 'border-line bg-canvas'}`}>
                  <div className="mb-2 flex items-center gap-2 text-sm text-muted">
                    <span className="font-semibold text-body">{request.team}</span>
                    <span>·</span>
                    <span>{request.leader_name}</span>
                  </div>
                  <h2 className={`text-lg font-semibold ${done ? 'text-muted' : 'text-foreground'}`}>{request.title}</h2>
                  <p className="mt-1 text-sm text-body">게시 희망 {formatDay(request.scheduled_date)}</p>

                  <p
                    className={`mt-3 whitespace-pre-wrap text-sm leading-6 text-body ${isOpen ? '' : 'line-clamp-3'}`}
                  >
                    {request.content}
                  </p>
                  {(request.content.length > 80 || (request.content_en?.length ?? 0) > 80) && (
                    <button
                      onClick={() => setExpanded(isOpen ? null : request.id)}
                      className="mt-1 text-sm font-semibold text-primary"
                    >
                      {isOpen ? '접기' : '더보기'}
                    </button>
                  )}

                  {(request.title_en || request.content_en) && (
                    <div className="mt-4 rounded-[14px] bg-surface p-4">
                      <p className="mb-1 text-xs font-semibold text-primary">English</p>
                      {request.title_en && (
                        <p className="text-sm font-semibold text-foreground">{request.title_en}</p>
                      )}
                      {request.content_en && (
                        <p
                          className={`mt-1 whitespace-pre-wrap text-sm leading-6 text-body ${isOpen ? '' : 'line-clamp-3'}`}
                        >
                          {request.content_en}
                        </p>
                      )}
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {files.map(file => (
                        <a
                          key={file.id}
                          href={`/api/files?path=${encodeURIComponent(file.file_path)}&name=${encodeURIComponent(file.file_name)}`}
                          className="max-w-full truncate rounded-lg bg-weak px-3 py-1.5 text-sm font-semibold text-weak-fg hover:bg-line"
                        >
                          {file.file_name}
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                    <span className="text-xs text-muted">{formatDate(request.created_at)} 등록</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditing(request)}
                        className="h-10 rounded-[10px] px-3 text-sm font-semibold text-muted hover:text-primary"
                      >
                        수정
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(request.id)}
                          className="h-10 rounded-[10px] px-3 text-sm font-semibold text-muted hover:text-danger"
                        >
                          삭제
                        </button>
                      )}
                      <select
                        value={request.status === 'approved' ? 'pending' : request.status}
                        onChange={e => handleStatusChange(request.id, e.target.value as Status)}
                        disabled={!isAdmin}
                        aria-label="게시 상태"
                        className={`h-10 rounded-[10px] border px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-default ${
                          done
                            ? 'border-primary bg-primary text-white'
                            : 'border-line bg-surface text-body'
                        }`}
                      >
                        <option value="pending">대기중</option>
                        <option value="completed">완료</option>
                      </select>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-12 border-t border-line pt-6 text-center">
          {!isAdmin && (
            <button onClick={handleAdminLogin} className="text-sm font-semibold text-muted hover:text-body">
              관리자 로그인
            </button>
          )}
        </div>
      </main>

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-2 rounded-full bg-primary pl-5 pr-6 text-[17px] font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="의뢰 추가"
      >
        <span className="text-2xl leading-none">+</span> 의뢰 추가
      </button>

      {showForm && (
        <RequestForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            showToast('공지 의뢰가 등록되었어요!');
            loadRequests();
          }}
        />
      )}

      {editing && (
        <RequestForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            showToast('공지 의뢰를 수정했어요!');
            loadRequests();
          }}
        />
      )}

      {toast && (
        <div role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white">
          {toast}
        </div>
      )}
    </div>
  );
}
