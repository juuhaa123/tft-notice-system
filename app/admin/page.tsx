'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DreamersLogo from '@/components/DreamersLogo';

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
  pending: 'bg-dream-yellow text-black',
  approved: 'bg-dream-purple text-black',
  completed: 'bg-dream-green text-black',
};

const STATUS_BORDER: Record<Status, string> = {
  pending: 'border-l-dream-yellow',
  approved: 'border-l-dream-purple',
  completed: 'border-l-dream-green',
};

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
      const response = await fetch(`/api/requests/${requestId}`);
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
      <div className="flex min-h-screen items-center justify-center bg-ground p-5">
        <div className="w-full max-w-md">
          <DreamersLogo className="mx-auto mb-6 w-64" />
          <div className="rounded-[2rem] bg-paper p-8 text-black">
            <h1 className="mb-6 font-display text-2xl">관리자 로그인</h1>
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block font-bold">관리자 토큰</label>
                <input
                  type="password"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="토큰을 입력하세요"
                  className="w-full rounded-2xl border-2 border-black/10 bg-white px-4 py-3 focus:border-dream-pink focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-black py-3 font-bold text-dream-yellow transition hover:bg-dream-pink hover:text-black"
              >
                로그인
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <div className="min-h-screen bg-ground" />;
  }

  return (
    <div className="min-h-screen bg-ground">
      <header className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-5 pb-4 pt-8">
        <div>
          <DreamersLogo className="w-52" />
          <h1 className="mt-2 font-display text-3xl text-paper">
            공지 요청 관리<span className="text-dream-yellow">.</span>
          </h1>
        </div>
        <p className="rounded-full bg-paper px-4 py-2 font-bold text-black">총 {requests.length}개의 요청</p>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-12 pt-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-5 flex gap-2 overflow-x-auto">
              {(['all', 'pending', 'approved', 'completed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`whitespace-nowrap rounded-full px-5 py-2 font-bold transition ${
                    selectedStatus === status
                      ? 'bg-dream-pink text-black'
                      : 'bg-white/10 text-paper hover:bg-white/20'
                  }`}
                >
                  {status === 'all' ? '전체' : STATUS_LABELS[status]}
                </button>
              ))}
            </div>

            {loading && <p className="mb-3 text-paper/60">불러오는 중...</p>}

            <div className="space-y-3">
              {filteredRequests.map(request => (
                <div
                  key={request.id}
                  className={`cursor-pointer rounded-2xl border-l-8 bg-white/5 p-4 transition hover:bg-white/10 ${STATUS_BORDER[request.status]} ${
                    selectedRequest?.id === request.id ? 'bg-white/10 ring-2 ring-dream-yellow' : ''
                  }`}
                  onClick={() => handleViewDetails(request.id)}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[request.status]}`}>
                      {STATUS_LABELS[request.status]}
                    </span>
                    <span className="text-sm text-paper/70">{request.team}</span>
                  </div>
                  <h3 className="text-lg font-bold text-paper">{request.title}</h3>
                  <p className="mt-1 text-sm text-paper/70">팀장: {request.leader_name}</p>
                  <p className="mt-1 text-xs text-paper/50">
                    {new Date(request.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              ))}

              {filteredRequests.length === 0 && (
                <div className="rounded-2xl bg-white/5 p-8 text-center text-paper/60">요청이 없습니다</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {selectedRequest ? (
              <div className="sticky top-4 rounded-[2rem] bg-paper p-6 text-black">
                <h2 className="mb-4 font-display text-xl">상세 정보</h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-bold text-black/50">팀</p>
                    <p>{selectedRequest.team}</p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-black/50">팀장</p>
                    <p>{selectedRequest.leader_name}</p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-black/50">상태</p>
                    <select
                      value={selectedRequest.status}
                      onChange={e => handleStatusChange(selectedRequest.id, e.target.value as Status)}
                      className="mt-1 w-full rounded-2xl border-2 border-black/10 bg-white px-3 py-2 focus:border-dream-pink focus:outline-none"
                    >
                      <option value="pending">대기중</option>
                      <option value="approved">승인됨</option>
                      <option value="completed">완료됨</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-black/50">게시 희망 일자</p>
                    <p className="text-sm">{new Date(selectedRequest.scheduled_date).toLocaleString('ko-KR')}</p>
                  </div>

                  {selectedRequest.files && selectedRequest.files.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-bold text-black/50">첨부파일</p>
                      <div className="space-y-2">
                        {selectedRequest.files.map(file => (
                          <a
                            key={file.id}
                            href={file.file_path}
                            download
                            className="block break-all rounded-2xl bg-white px-3 py-2 text-sm font-bold underline decoration-dream-pink decoration-2 underline-offset-4 hover:bg-dream-yellow"
                          >
                            {file.file_name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-sm font-bold text-black/50">공지 내용</p>
                    <p className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-white p-3 text-sm">
                      {selectedRequest.content}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-black/10 pt-4">
                    <button
                      onClick={() => handleDelete(selectedRequest.id)}
                      className="w-full rounded-full bg-dream-pink py-2 font-bold text-black transition hover:bg-black hover:text-dream-pink"
                    >
                      삭제
                    </button>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="w-full rounded-full bg-black py-2 font-bold text-paper transition hover:bg-black/80"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[2rem] bg-white/5 p-8 text-center text-paper/60">요청을 선택하세요</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ground" />}>
      <AdminDashboard />
    </Suspense>
  );
}
