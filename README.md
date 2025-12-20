# 🎫 Ticketmon Frontend - 콘서트 티켓 예매 시스템

> React 기반 콘서트 티켓 예매 프론트엔드 애플리케이션

![콘서트티켓예매시스템](https://github.com/user-attachments/assets/a7be3b7c-896d-48f2-9c05-bec7fa2a3f75)

📺 [발표 영상](https://www.youtube.com/watch?v=FLgYcKAJM0o) | 📑 [Figma 발표자료](https://www.figma.com/slides/4RZvK5E6tnWw2bQsHqx6H9/Untitled?node-id=1-19&t=fKAZP0N9cTwcIzEB-1) | 🔗 [Backend Repository](https://github.com/AIBE-3Team/AIBE1_FinalProject_Team03_BE)

---

## 📌 프로젝트 소개

콘서트 티켓 예매 서비스의 프론트엔드 애플리케이션입니다. 사용자, 판매자, 관리자 역할에 따른 권한 기반 UI를 제공하며, 실시간 좌석 선택과 결제 연동을 지원합니다.

---

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | React 19, Vite 6 |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM |
| HTTP Client | Axios |
| Payment | Toss Payments SDK |
| Icons | Lucide React |

---

## ✨ 주요 기능

### 🎵 콘서트 탐색
- 콘서트 검색, 필터링, 정렬 기능
- 콘서트 상세 정보 조회
- 다크 테마 UI 적용

### ✍️ 리뷰 시스템
- 관람평/기대평 CRUD
- AI 요약 결과 표시

### 🏪 판매자 페이지
- 콘서트 등록/수정/삭제
- 포스터 이미지 업로드
- 공연 상태 관리
- AI 요약 수동 생성

### 🎯 예매 시스템
- 실시간 좌석 선택 UI
- Toss Payments 결제 연동
- 결제 성공/실패 처리

### 🔐 인증/권한
- JWT 기반 인증
- OAuth2 소셜 로그인 (Kakao, Google)
- 역할 기반 접근 제어 (USER, SELLER, ADMIN)

---

## 👤 담당 역할 (박유미)

### 콘서트 관리 시스템 (전체 담당)
- 콘서트 검색/필터/정렬 기능 구현
- 콘서트 상세 정보 페이지 개발
- 다크 테마 UI 적용 및 반응형 디자인

### 리뷰 시스템
- 관람평/기대평 CRUD 컴포넌트 구현
- 수정 기능 버그 수정 및 UX 개선

### 판매자 페이지
- 콘서트 등록/수정 폼 구현
- 포스터 이미지 업로드 및 미리보기
- AI 요약 관리 시스템 UI 구현
- 판매자 레이아웃 일관성 개선

### 결제 연동
- 결제 페이지 UI 개선
- 결제 성공 시 좌석 상태 즉시 반영

---

## 🔧 주요 기술적 챌린지

### 1. 결제 성공 후 좌석 상태 반영 지연
**문제**: 결제 완료 후에도 좌석이 여전히 "선택됨" 상태로 표시 (폴링 대기 최대 35초)
**해결**: 결제 성공 콜백에서 setSeatStatuses로 즉시 BOOKED 상태 반영, 선택 좌석 목록 초기화

### 2. 판매자 페이지 레이아웃 일관성
**문제**: Auth, Seller 페이지 간 헤더 중복 및 레이아웃 불일치  
**해결**: 공통 레이아웃 컴포넌트 분리 및 라우트 구조 개선

---

## 📁 프로젝트 구조

```
src/
├── pages/
│   ├── admin/           # 관리자 페이지
│   ├── auth/            # 인증 페이지
│   ├── booking/         # 예매 페이지
│   ├── concert/         # 콘서트 페이지 ⭐
│   ├── home/            # 홈 페이지
│   ├── mypage/          # 마이페이지
│   ├── payment/         # 결제 페이지 ⭐
│   └── seller/          # 판매자 페이지 ⭐
├── features/
│   ├── admin/           # 관리자 컴포넌트
│   ├── auth/            # 인증 컴포넌트
│   ├── booking/         # 예매 컴포넌트
│   ├── concert/         # 콘서트 컴포넌트 ⭐
│   ├── payment/         # 결제 컴포넌트
│   ├── seller/components/  # 판매자 컴포넌트 ⭐
│   └── user/            # 사용자 컴포넌트
└── shared/
    ├── components/      # 공통 컴포넌트
    ├── hooks/           # 커스텀 훅
    ├── services/        # API 서비스 ⭐
    ├── stores/          # 상태 관리
    ├── types/           # 타입 정의
    └── utils/           # 유틸리티
```

---

## 🚀 실행 방법

```bash
# 레포지토리 클론
git clone https://github.com/AIBE-3Team/AIBE1_FinalProject_Team03_FE.git
cd AIBE1_FinalProject_Team03_FE

# 의존성 설치
npm install

# 환경 변수 설정 (.env)
VITE_APP_API_URL=http://localhost:8080/api
VITE_APP_WS_URL=ws://localhost:8080/ws/waitqueue

# 개발 서버 실행
npm run dev
```

**참고**: 백엔드 서버가 실행 중이어야 정상 동작합니다.

---

## 📎 관련 링크

- [Backend Repository](https://github.com/AIBE-3Team/AIBE1_FinalProject_Team03_BE)
- [프론트엔드 폴더 구조 가이드](./ARCHITECTURE_GUIDE.md)
