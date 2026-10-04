'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Status = 'pending' | 'approved' | 'completed';

type NoticeRequest = {
  id: string;
  team: string;
  leader_name: string;
  title: string;
  content: string;
  scheduled_date: string;
  status: Status;
  created_at: string;
  updated_at: string;
};

type FileRecord = {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
};

const STATUS_LABELS: Record<Status, string> = {
  pending: '대기중',
  approved: '승인됨',
  completed: '완료됨',
};

const STATUS_BADGE: Record<Status, string> = {
  pending: 'bg-surface text-body',
  approved: 'bg-weak text-weak-fg',
  completed: 'bg-primary text-white',
};

const fieldClass =
  'w-full rounded-[14px] border border-line bg-canvas px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function AdminDashboard() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(true);
  const [requests, setRequests] = useState<NoticeRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<(NoticeRequest & { files: FileRecord[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      setShowTokenModal(false);
      verifyAndLoadData(urlToken);
    }
  }, [searchParams]);

  const verifyAndLoadData = async (adminToken: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/requests?token=${adminToken}`);
      if (response.ok) {
        const data = await response.json();
        if (data.isAdmin) {
          setIsAuthorized(true);
          setRequests(data.data);
        } else {
          alert('관리자 권한이 없습니다');
          setShowTokenModal(true);
        }
      } else {
        alert('토큰이 잘못되었습니다');
        setShowTokenModal(true);
      }
    } catch (error) {
      alert('연결 오류가 발생했습니다');
      setShowTokenModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      setShowTokenModal(false);
      verifyAndLoadData(token);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: Status) => {
    try {
      const response = await fetch(`/api/requests/${requestId}?token=${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setRequests(prev =>
          prev.map(req => (req.id === requestId ? { ...req, status: newStatus } : req))
        );
        if (selectedRequest?.id === requestId) {
          setSelectedRequest({ ...selectedRequest, status: newStatus });
        }
      }
    } catch (error) {
      alert('상태 변경 중 오류가 발생했습니다');
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('정말로 이 요청을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/requests/${requestId}?token=${token}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRequests(prev => prev.filter(req => req.id !== requestId));
        setSelectedRequest(null);
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다');
    }
  };

  const handleViewDetails = async (requestId: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}?token=${token}`);
      const data = await response.json();
      setSelectedRequest(data.data);
    } catch (error) {
      alert('상세 정보를 불러올 수 없습니다');
    }
  };

  const filteredRequests =
    selectedStatus === 'all' ? requests : requests.filter(req => req.status === selectedStatus);

  if (showTokenModal && !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-5">
        <div className="w-full max-w-md">
          <h1 className="mb-8 text-3xl font-bold leading-[1.5] text-foreground">
            관리자 확인을
            <br />
            해주세요
          </h1>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-body">관리자 토큰</label>
              <input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="토큰을 입력하세요"
                className={fieldClass}
              />
            </div>
            <button
              type="submit"
              className="h-14 w-full rounded-2xl bg-primary px-5 text-[17px] font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <div className="min-h-screen bg-canvas" />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3 px-5 pb-6 pt-10">
        <div>
          <p className="mb-2 inline-block rounded-lg bg-weak px-3 py-1 text-sm font-semibold text-weak-fg">
            관리자
          </p>
          <h1 className="text-4xl font-bold leading-[1.5] text-foreground">공지 요청 관리</h1>
        </div>
        <p className="text-base text-body">
          총 <span className="font-semibold text-primary">{requests.length}</span>개의 요청
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-5 flex gap-2 overflow-x-auto">
              {(['all', 'pending', 'approved', 'completed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`h-10 whitespace-nowrap rounded-[10px] px-4 text-[15px] font-semibold transition ${
                    selectedStatus === status
                      ? 'bg-foreground text-white'
                      : 'bg-surface text-body hover:bg-line'
                  }`}
                >
                  {status === 'all' ? '전체' : STATUS_LABELS[status]}
                </button>
              ))}
            </div>

            {loading && <p className="mb-3 text-sm text-muted">불러오는 중...</p>}

            <div className="space-y-3">
              {filteredRequests.map(request => (
                <div
                  key={request.id}
                  className={`cursor-pointer rounded-2xl border p-5 transition hover:bg-surface ${
                    selectedRequest?.id === request.id ? 'border-primary bg-weak/40' : 'border-line bg-canvas'
                  }`}
                  onClick={() => handleViewDetails(request.id)}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${STATUS_BADGE[request.status]}`}>
                      {STATUS_LABELS[request.status]}
                    </span>
                    <span className="text-sm text-muted">{request.team}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{request.title}</h3>
                  <p className="mt-1 text-sm text-body">팀장 {request.leader_name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(request.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              ))}

              {filteredRequests.length === 0 && (
                <div className="rounded-2xl bg-surface p-10 text-center text-body">요청이 없어요</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {selectedRequest ? (
              <div className="sticky top-4 rounded-2xl bg-surface p-6">
                <h2 className="mb-5 text-[22px] font-semibold leading-[1.5] text-foreground">상세 정보</h2>

                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-muted">팀</p>
                    <p className="text-foreground">{selectedRequest.team}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted">팀장</p>
                    <p className="text-foreground">{selectedRequest.leader_name}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-sm text-muted">상태</p>
                    <select
                      value={selectedRequest.status}
                      onChange={e => handleStatusChange(selectedRequest.id, e.target.value as Status)}
                      className={fieldClass}
                    >
                      <option value="pending">대기중</option>
                      <option value="approved">승인됨</option>
                      <option value="completed">완료됨</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-sm text-muted">게시 희망 일자</p>
                    <p className="text-sm text-foreground">
                      {new Date(selectedRequest.scheduled_date).toLocaleString('ko-KR')}
                    </p>
                  </div>

                  {selectedRequest.files && selectedRequest.files.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm text-muted">첨부파일</p>
                      <div className="space-y-2">
                        {selectedRequest.files.map(file => (
                          <a
                            key={file.id}
                            href={`/api/files?path=${encodeURIComponent(file.file_path)}&name=${encodeURIComponent(file.file_name)}&token=${encodeURIComponent(token)}`}
                            className="block break-all rounded-[10px] bg-weak px-3 py-2.5 text-sm font-semibold text-weak-fg hover:bg-canvas"
                          >
                            {file.file_name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-sm text-muted">공지 내용</p>
                    <p className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-[14px] bg-canvas p-4 text-sm leading-6 text-body">
                      {selectedRequest.content}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleDelete(selectedRequest.id)}
                      className="h-12 flex-1 rounded-[14px] bg-canvas text-base font-semibold text-danger transition hover:bg-line"
                    >
                      삭제
                    </button>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="h-12 flex-1 rounded-[14px] bg-primary text-base font-semibold text-white transition hover:bg-primary-hover"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-surface p-10 text-center text-body">요청을 선택해주세요</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <AdminDashboard />
    </Suspense>
  );
}
