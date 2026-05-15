# OZ Externship — 커뮤니티 게시판 (Team 2)

OZ 코딩스쿨 외부 실습 프로젝트의 커뮤니티 게시판 프론트엔드입니다.  
게시글 작성·수정·삭제·조회, 댓글(무한 스크롤), 좋아요(낙관적 업데이트), @멘션 파싱 등 커뮤니티 핵심 기능을 React 19 기반으로 구현했습니다.

---

## 목차

1. [주요 기능](#주요-기능)
2. [기술 스택](#기술-스택)
3. [핵심 구현 내용](#핵심-구현-내용)
4. [폴더 구조](#폴더-구조)
5. [실행 방법](#실행-방법)
6. [환경 변수](#환경-변수)
7. [API 연동 정보](#api-연동-정보)
8. [향후 개선 사항](#향후-개선-사항)

---

## 주요 기능

### 게시글

| 기능      | 설명                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------- |
| 목록 조회 | 카테고리 탭 필터, 제목·내용·작성자·제목+내용 복합 검색, 최신순·조회순·좋아요순·댓글순 정렬, 페이지네이션 |
| 상세 조회 | 제목·본문·작성자·조회수·좋아요 수 표시, 마크다운+HTML 렌더링                                             |
| 작성      | 마크다운 에디터(`@uiw/react-md-editor`), 카테고리 선택, 이미지 업로드(presigned URL)                     |
| 수정      | 기존 내용 불러와 수정, 작성자 본인만 접근                                                                |
| 삭제      | 확인 모달 후 삭제, 성공 시 토스트 표시 → 목록 페이지로 이동                                              |

### 댓글

| 기능             | 설명                                                                          |
| ---------------- | ----------------------------------------------------------------------------- |
| 무한 스크롤 조회 | 10개씩 페이지 로드, IntersectionObserver로 하단 도달 시 자동 다음 페이지 요청 |
| 작성             | 로그인 사용자만 입력창 노출, 빈 문자열 유효성 검사                            |
| 삭제             | 본인 댓글 삭제, 확인 모달                                                     |
| 정렬             | 최신순 / 오래된순 전환                                                        |
| @멘션 파싱       | `@닉네임` 패턴을 `tagged_users`와 매칭하여 보라색 볼드 하이라이트 표시        |

### 좋아요

- 토글 방식 (POST / DELETE)
- **낙관적 업데이트**: UI를 즉시 갱신한 뒤 서버 응답으로 확정, 실패 시 롤백

### 인증 / 사용자

- JWT 토큰 localStorage 저장, Axios 인터셉터로 자동 헤더 주입
- 401 응답 시 리프레시 토큰으로 자동 재발급 후 원본 요청 재시도
- 로그인 여부에 따른 UI 조건부 렌더링 (글쓰기 버튼, 댓글 입력창, 작성자 전용 수정/삭제)

### 라우트 구조

| 경로                      | 페이지      | 설명                         |
| ------------------------- | ----------- | ---------------------------- |
| `/community`              | 게시글 목록 | 검색·필터·정렬, 페이지네이션 |
| `/community/write`        | 게시글 작성 | 로그인 사용자만 이용 가능    |
| `/community/:postId`      | 게시글 상세 | 댓글·좋아요 포함             |
| `/community/:postId/edit` | 게시글 수정 | 작성자 본인만 접근           |

---

## 기술 스택

| 분류            | 기술                                                                                    |
| --------------- | --------------------------------------------------------------------------------------- |
| UI 프레임워크   | React 19 + TypeScript 5.9                                                               |
| 빌드            | Vite 8 + **React Compiler** (`babel-plugin-react-compiler`)                             |
| 스타일          | Tailwind CSS v4 + CSS 변수 기반 디자인 토큰 (`@theme {}`)                               |
| 라우팅          | React Router v7                                                                         |
| 서버 상태       | TanStack Query v5 (`useQuery`, `useSuspenseQuery`, `useInfiniteQuery`, `useMutation`)   |
| 클라이언트 상태 | Zustand v5 (`devtools` 미들웨어)                                                        |
| HTTP 클라이언트 | Axios v1.13 (인터셉터, 자동 토큰 갱신)                                                  |
| API 목업        | MSW v2 (브라우저 서비스 워커)                                                           |
| 마크다운        | `@uiw/react-md-editor`, `react-markdown`, `remark-gfm`, `rehype-raw`, `rehype-sanitize` |
| XSS 방어        | `DOMPurify`                                                                             |
| 아이콘          | `lucide-react`                                                                          |
| 테스트          | Playwright v1.58 (E2E + 비주얼 회귀)                                                    |
| 코드 품질       | ESLint + Prettier + Husky (pre-commit, commit-msg, pre-push)                            |

---

## 핵심 구현 내용

### 1. Feature 모듈 패턴

도메인별로 `types.ts / queries.ts / handler.ts / index.ts` 4파일을 한 폴더에 모아 API 연동을 캡슐화했습니다.

```
src/features/posts/like/
├── types.ts      # 요청·응답 타입
├── queries.ts    # TanStack Query 훅
├── handler.ts    # MSW 핸들러
└── index.ts      # barrel export
```

### 2. 낙관적 업데이트 (좋아요)

서버 응답 전에 캐시를 미리 갱신하고, 실패 시 스냅샷으로 롤백합니다.

```ts
// src/features/posts/like/queries.ts
onMutate: async (isCurrentlyLiked) => {
  await queryClient.cancelQueries({ queryKey })
  const previous = queryClient.getQueryData(queryKey)
  queryClient.setQueryData(queryKey, (prev) => ({
    ...prev,
    is_liked: !isCurrentlyLiked,
    like_count: isCurrentlyLiked ? prev.like_count - 1 : prev.like_count + 1,
  }))
  return { previous }
},
onError: (_err, _vars, context) => {
  queryClient.setQueryData(queryKey, context.previous)
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey })
},
```

### 3. 댓글 무한 스크롤

`useInfiniteQuery`로 페이지를 누적하고, `IntersectionObserver`로 목록 하단 도달 시 `fetchNextPage`를 호출합니다. `next` 필드가 `null`이면 더 이상 요청하지 않습니다.

```ts
// src/features/posts/comments/queries.ts
getNextPageParam: (lastPage) => {
  if (!lastPage.next) return undefined
  const url = new URL(lastPage.next)
  return Number(url.searchParams.get('page'))
},
```

### 4. @멘션 파싱

`DOMPurify`로 XSS를 먼저 제거한 뒤, `@(\S+)` 정규식으로 닉네임을 추출하고 `tagged_users` 배열과 매칭하여 하이라이트를 렌더링합니다.

```ts
// src/components/community/CommentItem/CommentItem.tsx
function parseContent(content: string, taggedUsers: TaggedUser[]): ReactNode[] {
  const clean = DOMPurify.sanitize(content)
  const mentionRegex = /@(\S+)/g
  // ... @닉네임 매칭 시 보라색 볼드 span으로 렌더링
}
```

### 5. 삭제 후 화면 전환 (useRef + Toast onClose)

`useSuspenseQuery`를 사용하는 상세 페이지는 삭제 직후 캐시를 유지합니다. `removeQueries`를 호출하면 즉시 리페치가 발생해 ErrorBoundary로 전환되기 때문입니다. 대신 삭제 성공 시 이동 경로를 `useRef`에 저장하고, 토스트가 닫힐 때 이동합니다.

```ts
const pendingNavigate = useRef<string | null>(null)

// 삭제 성공
pendingNavigate.current = '/community'
showToast('게시글이 삭제되었습니다.', 'success')

// Toast onClose
onClose={() => {
  setToast((prev) => ({ ...prev, visible: false }))
  if (pendingNavigate.current) {
    navigate(pendingNavigate.current)
    pendingNavigate.current = null
  }
}}
```

### 6. Axios 인터셉터 — 토큰 자동 갱신

401 응답 시 `/api/v1/accounts/me/refresh`를 호출해 새 토큰을 받아 저장하고, 원본 요청을 재시도합니다. 갱신 실패 시 로컬 스토리지를 비우고 로그인 페이지로 이동합니다.

### 7. MSW + 실제 API 혼용

개발 환경에서 MSW가 대부분의 요청을 인터셉트하고, 핸들러가 등록되지 않은 요청은 `onUnhandledRequest: 'bypass'`로 실제 백엔드에 통과시킵니다. Vite dev server의 `/api` 프록시가 실제 API 서버로 요청을 포워딩합니다.

---

## 폴더 구조

```
src/
├── api/
│   ├── instance.ts          # Axios 인스턴스 (baseURL, timeout, withCredentials)
│   └── interceptors.ts      # 토큰 주입·갱신 인터셉터
├── components/
│   ├── common/              # Avatar, Button, Input, Modal, Toast, Spinner 등 25+개
│   ├── community/           # PostCard, PostHeader, PostBody, PostActions,
│   │                        # CommentItem, CommentInput, CommunityComments 등 20+개
│   └── layout/              # DefaultLayout, AuthLayout, Header, Footer
├── constants/
│   └── routes.ts            # 라우트 경로 상수
├── features/
│   ├── accounts/
│   │   ├── logout/
│   │   ├── me/              # GET /api/v1/accounts/me
│   │   └── user-search/     # GET /api/v1/accounts/user/search
│   └── posts/
│       ├── categories/      # GET /api/v1/posts/categories
│       ├── comments/        # GET·POST·DELETE /api/v1/posts/:id/comments
│       ├── delete/          # DELETE /api/v1/posts/:id
│       ├── detail/          # GET /api/v1/posts/:id
│       ├── edit/            # PUT /api/v1/posts/:id
│       ├── like/            # POST·DELETE /api/v1/posts/:id/like
│       ├── list/            # GET /api/v1/posts/
│       ├── write/           # POST /api/v1/posts/
│       └── mockStore.ts     # MSW 런타임 인메모리 데이터 저장소
├── hooks/
│   └── useInitAuth.ts       # 앱 초기화 시 토큰→유저 정보 로드
├── mocks/
│   ├── browser.ts           # MSW 브라우저 워커 설정
│   ├── handlers.ts          # 전체 핸들러 등록
│   └── url.ts               # apiUrl 헬퍼
├── pages/
│   └── community/
│       ├── CommunityListPage.tsx
│       ├── CommunityDetailPage.tsx
│       ├── CommunityWritePage.tsx
│       └── CommunityEditPage.tsx
├── providers/
│   ├── QueryProvider.tsx    # TanStack Query 클라이언트 (staleTime: 60s, retry: 1)
│   └── RouterProvider.tsx   # 라우트 정의
├── stores/
│   └── authStore.ts         # Zustand 인증 상태 (isAuthenticated, user, isInitialized)
├── App.css                  # @theme {} 디자인 토큰 (색상, 간격, 타이포, 그림자)
└── main.tsx                 # MSW enableMocking() 후 React 렌더
```

---

## 실행 방법

### 사전 요구사항

- Node.js 18 이상
- npm 9 이상

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

### 테스트

```bash
# E2E 테스트 (Playwright)
npm run test:e2e

# E2E 테스트 UI 모드
npm run test:e2e:ui

# 비주얼 회귀 테스트 (Figma 기반)
npm run test:visual

# Figma 베이스라인 스크린샷 갱신
npm run test:visual:update-baseline
```

### Git Hooks (Husky)

| 훅           | 실행 내용                                             |
| ------------ | ----------------------------------------------------- |
| `pre-commit` | ESLint --fix + Prettier (staged 파일 대상)            |
| `commit-msg` | `<type>: <설명>` 형식 검증 (feat, fix, refactor, ...) |
| `pre-push`   | `npm run build` — 빌드 실패 시 push 차단              |

---

## 환경 변수

`.env` 파일을 프로젝트 루트에 생성합니다.

```env
# 백엔드 API 기본 URL
VITE_API_BASE_URL=https://api.ozcodingschool.site

# Figma 비주얼 회귀 테스트용 (선택)
FIGMA_TOKEN=your_figma_token_here
```

> `VITE_` 접두사가 있는 변수만 클라이언트 번들에 포함됩니다.

---

## API 연동 정보

| 기능          | 메서드 | 엔드포인트                                                                  |
| ------------- | ------ | --------------------------------------------------------------------------- |
| 카테고리 목록 | GET    | `/api/v1/posts/categories`                                                  |
| 게시글 목록   | GET    | `/api/v1/posts/?page=1&page_size=10&sort=latest&search=...&category_id=...` |
| 게시글 작성   | POST   | `/api/v1/posts/`                                                            |
| 게시글 상세   | GET    | `/api/v1/posts/{post_id}`                                                   |
| 게시글 수정   | PUT    | `/api/v1/posts/{post_id}`                                                   |
| 게시글 삭제   | DELETE | `/api/v1/posts/{post_id}`                                                   |
| 좋아요 추가   | POST   | `/api/v1/posts/{post_id}/like`                                              |
| 좋아요 취소   | DELETE | `/api/v1/posts/{post_id}/like`                                              |
| 댓글 목록     | GET    | `/api/v1/posts/{post_id}/comments?page=1&page_size=10`                      |
| 댓글 작성     | POST   | `/api/v1/posts/{post_id}/comments`                                          |
| 댓글 삭제     | DELETE | `/api/v1/posts/{post_id}/comments/{comment_id}`                             |
| 현재 사용자   | GET    | `/api/v1/accounts/me`                                                       |
| 사용자 검색   | GET    | `/api/v1/accounts/user/search?q=닉네임`                                     |

### 응답 예시 — 게시글 목록

```json
{
  "count": 42,
  "next": "https://.../api/v1/posts/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "게시글 제목",
      "content": "본문 내용",
      "category": 1,
      "author": { "id": 10, "nickname": "홍길동", "profile_img_url": null },
      "created_at": "2025-10-01T09:00:00+09:00",
      "view_count": 100,
      "like_count": 5,
      "comment_count": 3
    }
  ]
}
```

### 응답 예시 — 댓글 목록

```json
{
  "count": 25,
  "next": "https://.../api/v1/posts/1/comments?page=2&page_size=10",
  "previous": null,
  "results": [
    {
      "id": 1,
      "author": { "id": 2, "nickname": "유저A", "profile_img_url": null },
      "tagged_users": [{ "id": 3, "nickname": "유저B" }],
      "content": "@유저B 댓글 내용입니다.",
      "created_at": "2025-10-02T10:00:00+09:00",
      "updated_at": "2025-10-02T10:00:00+09:00"
    }
  ]
}
```

---

## 향후 개선 사항

| 항목                      | 내용                                                       |
| ------------------------- | ---------------------------------------------------------- |
| 댓글 수정                 | 인라인 편집 UI 구현 (현재 삭제만 가능)                     |
| 페이지네이션 → 무한스크롤 | 게시글 목록도 무한 스크롤로 전환 고려                      |
| 스켈레톤 UI               | 로딩 중 레이아웃 시프트 방지를 위한 Skeleton 컴포넌트 도입 |
| 이미지 업로드 개선        | presigned URL 업로드 완료 후 미리보기 표시                 |
| 접근성                    | ARIA 레이블, 키보드 네비게이션 강화                        |
| 번들 사이즈 최적화        | 현재 번들 ~2MB, 동적 import로 코드 스플리팅 적용           |
