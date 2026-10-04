'use client';

import { useEffect, useState } from 'react';

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

const STATUS_COLORS: Record<Status, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

export default function AdminDashboard() {
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
        }
      } else {
        alert('토큰이 잘못되었습니다');
      }
    } catch (error) {
      alert('연결 오류가 발생했습니다');
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
          prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req)
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

  const filteredRequests = selectedStatus === 'all'
    ? requests
    : requests.filter(req => req.status === selectedStatus);

  if (showTokenModal && !isAuthorized) {
    return (
      <div className="min-h-screen bg-mint flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-text-primary mb-6">관리자 로그인</h1>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div>
              <label className="block text-text-primary font-bold mb-2">
                관리자 토큰
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="토큰을 입력하세요"
                className="w-full px-4 py-3 border-2 border-bg-secondary rounded-md focus:outline-none focus:border-mint"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-mint text-white font-bold py-3 rounded-md hover:bg-mint-dark transition"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <header className="bg-mint text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">📋 공지 요청 관리</h1>
          <p className="text-mint-light mt-2">총 {requests.length}개의 요청</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request List */}
          <div className="lg:col-span-2">
            {/* Status Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {(['all', 'pending', 'approved', 'completed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-md font-bold whitespace-nowrap transition ${
                    selectedStatus === status
                      ? 'bg-mint text-white'
                      : 'bg-white text-text-primary hover:bg-bg-secondary'
                  }`}
                >
                  {status === 'all' ? '전체' : STATUS_LABELS[status as Status]}
                </button>
              ))}
            </div>

            {/* Request Cards */}
            <div className="space-y-3">
              {filteredRequests.map(request => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg p-4 border-l-4 border-mint shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => handleViewDetails(request.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[request.status]}`}>
                          {STATUS_LABELS[request.status]}
                        </span>
                        <span className="text-sm text-text-secondary">{request.team}</span>
                      </div>
                      <h3 className="text-lg font-bold text-text-primary">{request.title}</h3>
                      <p className="text-sm text-text-secondary mt-1">팀장: {request.leader_name}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {new Date(request.created_at).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {filteredRequests.length === 0 && (
                <div className="bg-white rounded-lg p-8 text-center text-text-secondary">
                  요청이 없습니다
                </div>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            {selectedRequest ? (
              <div className="bg-white rounded-lg p-6 shadow-lg sticky top-4">
                <h2 className="text-xl font-bold text-text-primary mb-4">상세 정보</h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-text-secondary font-bold">팀</p>
                    <p className="text-text-primary">{selectedRequest.team}</p>
                  </div>

                  <div>
                    <p className="text-sm text-text-secondary font-bold">팀장</p>
                    <p className="text-text-primary">{selectedRequest.leader_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-text-secondary font-bold">상태</p>
                    <select
                      value={selectedRequest.status}
                      onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value as Status)}
                      className="w-full mt-1 px-3 py-2 border-2 border-bg-secondary rounded-md focus:outline-none focus:border-mint"
                    >
                      <option value="pending">대기중</option>
                      <option value="approved">승인됨</option>
                      <option value="completed">완료됨</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-sm text-text-secondary font-bold">게시 희망 일자</p>
                    <p className="text-text-primary text-sm">
                      {new Date(selectedRequest.scheduled_date).toLocaleString('ko-KR')}
                    </p>
                  </div>

                  {selectedRequest.files && selectedRequest.files.length > 0 && (
                    <div>
                      <p className="text-sm text-text-secondary font-bold mb-2">첨부파일</p>
                      <div className="space-y-2">
                        {selectedRequest.files.map(file => (
                          <a
                            key={file.id}
                            href={file.file_path}
                            download
                            className="block text-sm text-mint hover:text-mint-dark break-all"
                          >
                            📄 {file.file_name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-text-secondary font-bold mb-2">공지 내용</p>
                    <p className="text-sm text-text-primary bg-bg-secondary p-3 rounded-md whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {selectedRequest.content}
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-bg-secondary">
                    <button
                      onClick={() => handleDelete(selectedRequest.id)}
                      className="w-full bg-red-500 text-white font-bold py-2 rounded-md hover:bg-red-600 transition"
                    >
                      삭제
                    </button>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="w-full bg-bg-secondary text-text-primary font-bold py-2 rounded-md hover:bg-bg-tertiary transition"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 text-center text-text-secondary">
                요청을 선택하세요
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
