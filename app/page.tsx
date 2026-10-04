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
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-mint text-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-h1 font-bold mb-2">🎉 TFT 공지 요청</h1>
          <p className="text-lg">축제 공지를 간편하게 신청하세요</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Selection */}
            <div>
              <label className="block text-text-primary font-bold mb-2">
                팀 선택 <span className="text-mint">*</span>
              </label>
              <select
                name="team"
                value={formData.team}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-bg-secondary rounded-md focus:outline-none focus:border-mint bg-bg-primary"
              >
                <option value="">팀을 선택하세요</option>
                {TEAMS.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            {/* Leader Name */}
            <div>
              <label className="block text-text-primary font-bold mb-2">
                팀장명 <span className="text-mint">*</span>
              </label>
              <input
                type="text"
                name="leader_name"
                value={formData.leader_name}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
                className="w-full px-4 py-3 border-2 border-bg-secondary rounded-md focus:outline-none focus:border-mint"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-text-primary font-bold mb-2">
                공지 제목 <span className="text-mint">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="공지 제목을 입력하세요"
                className="w-full px-4 py-3 border-2 border-bg-secondary rounded-md focus:outline-none focus:border-mint"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-text-primary font-bold mb-2">
                공지 내용 <span className="text-mint">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="공지 내용을 입력하세요"
                rows={6}
                className="w-full px-4 py-3 border-2 border-bg-secondary rounded-md focus:outline-none focus:border-mint resize-none"
              />
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-text-primary font-bold mb-2">
                게시 희망 일자 <span className="text-mint">*</span>
              </label>
              <input
                type="datetime-local"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-bg-secondary rounded-md focus:outline-none focus:border-mint"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-text-primary font-bold mb-2">
                파일 첨부 <span className="text-gray-400">(선택사항)</span>
              </label>
              <div
                className="border-2 border-dashed border-mint rounded-md p-6 text-center cursor-pointer hover:bg-bg-secondary transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-text-primary font-semibold">📁 클릭하여 파일 선택</p>
                <p className="text-text-secondary text-sm mt-1">또는 파일을 드래그하여 놓으세요</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-bg-secondary p-3 rounded-md">
                      <span className="text-sm text-text-primary truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-mint hover:text-mint-dark font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-md text-center ${message.includes('성공') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mint text-white font-bold py-3 px-4 rounded-md hover:bg-mint-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '등록 중...' : '공지 요청하기'}
            </button>
          </form>

          {/* Link to Dashboard */}
          <div className="mt-8 pt-8 border-t border-bg-secondary text-center">
            <p className="text-text-secondary mb-3">관리자이신가요?</p>
            <a
              href="/admin"
              className="inline-block bg-text-primary text-white font-bold py-2 px-6 rounded-md hover:bg-text-primary/90 transition"
            >
              관리 대시보드
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
