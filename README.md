# TFT 공지 요청 관리 시스템

축제 공지를 효율적으로 관리하기 위한 웹 기반 요청 관리 시스템입니다.

## 🎯 주요 기능

- **공지 요청 폼**: 팀장들이 쉽게 공지를 요청할 수 있는 간편한 폼
- **파일 업로드**: 포스터, 첨부파일 등 최대 50MB까지 업로드 가능
- **관리자 대시보드**: 토큰 인증 기반의 안전한 관리자 페이지
- **상태 추적**: 요청별 상태 관리 (대기중, 승인, 완료)
- **Baemin 디자인**: 따뜻하고 친근한 UI/UX

## 📋 지원 팀

- 무대운영팀
- 기획운영팀
- 본부팀
- 지원팀
- 데코팀
- 디자인팀
- 미디어팀

## 🚀 시작하기

### 설치

```bash
npm install
```

### 개발 모드 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 🔑 관리자 접근

관리자 대시보드는 `/admin`에서 접근할 수 있습니다.

**기본 토큰**: `tft-admin-2026-secure-key` (`.env.local`에서 변경 가능)

## 📦 배포 (Vercel)

### 1단계: GitHub 저장소 생성

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tft-notice-system.git
git push -u origin main
```

### 2단계: Vercel 배포

1. https://vercel.com 에 접속하여 로그인
2. "New Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 이름 입력
5. Environment Variables 설정:
   - `ADMIN_TOKEN`: 관리자 토큰
6. "Deploy" 클릭

### 팀장들과 공유

- **공지 요청 폼**: `https://your-site.vercel.app/`
- **관리자 토큰 포함**: `https://your-site.vercel.app/admin?token=YOUR_TOKEN`

## 🎨 디자인 시스템

- **주요 색상**: 민트 `#0cefd3`
- **배경**: 흰색 `#ffffff`, `#f3f4f5`
- **텍스트**: `#232324` (주), `#6c6d6f` (보조)

## API 엔드포인트

### POST `/api/requests`
새로운 공지 요청 생성

### GET `/api/requests?token=ADMIN_TOKEN`
공지 요청 목록 조회

### PATCH `/api/requests/[id]?token=ADMIN_TOKEN`
요청 상태 변경

### DELETE `/api/requests/[id]?token=ADMIN_TOKEN`
요청 삭제
