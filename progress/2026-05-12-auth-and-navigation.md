# 2026-05-12 작업 내역

## 작업 브랜치

`feature/commentAPI`

---

## 1. 개발 서버 브라우저 자동 열기

**파일:** `vite.config.ts`

`pnpm dev` 실행 시 기본 브라우저에서 자동으로 열리도록 `open: true` 추가.

---

## 2. API 인증 오류 수정

### 2-1. 하드코딩된 만료 JWT 제거

**파일:** `src/api/instance.ts`

axios 인스턴스 기본 헤더에 박혀있던 만료된 JWT 토큰 제거.
인터셉터가 이미 localStorage에서 토큰을 읽어 헤더에 주입하므로 중복이자 오류 원인이었음.

### 2-2. DEV 환경 테스트유저 자동 로그인 폴백 제거

**파일:** `src/hooks/useInitAuth.ts`

`/me` API 실패 시 DEV 환경에서 테스트유저(id: 99)로 강제 로그인하던 폴백 제거.
이제 실패 시 `setInitialized()`만 호출하여 비로그인 상태로 올바르게 처리.

**오류 연쇄 원인 분석:**

```
만료된 하드코딩 JWT
  → 모든 API 요청 401
  → /me/refresh 시도 → 실패
  → useInitAuth catch → DEV 폴백으로 테스트유저 로그인 (임시방편)
```

### 2-3. interceptors.ts merge conflict 해결

**파일:** `src/api/interceptors.ts`

`feature/markdown-editor` 브랜치의 `baseApi 분리` 방식 적용.
refresh 요청 시 `api` 인스턴스 대신 `baseApi`(인터셉터 없는 별도 인스턴스)를 사용하여 무한 루프 방지.

---

## 3. my.ozcodingschool.site 연동 및 navigate → a href 전환

### 3-1. routes.ts 업데이트

**파일:** `src/constants/routes.ts`

빈 경로(`''`)를 실제 도메인 URL로 채움:

- `HOME`, `AUTH.LOGIN`, `SIGNUP`, `MYPAGE`, `QUIZ` → `https://my.ozcodingschool.site/...`
- `QNA.*` → `https://qna.ozcodingschool.site/...`
- `COMMUNITY.*` → 기존 내부 경로 유지 (`/community/...`)

### 3-2. Header 네비게이션 전환

**파일:** `src/components/layout/Header/Header.tsx`

| 항목     | 변경 전                                          | 변경 후                                                    |
| -------- | ------------------------------------------------ | ---------------------------------------------------------- |
| 로고     | `<button onClick={() => navigate(ROUTES.HOME)}>` | `<a href={ROUTES.HOME}>`                                   |
| 커뮤니티 | `<button onClick={() => navigate(...)}>`         | `<button onClick={() => navigate(...)}>` (SPA 내부라 유지) |
| 질의응답 | `<button onClick={() => navigate(...)}>`         | `<a href={ROUTES.QNA.LIST}>`                               |
| 로그인   | `<button onClick={() => navigate(...)}>`         | `<a href={ROUTES.AUTH.LOGIN}>`                             |
| 회원가입 | `<button onClick={() => navigate(...)}>`         | `<a href={ROUTES.SIGNUP.SELECT}>`                          |

### 3-3. ProfileDropdown 메뉴 전환

**파일:** `src/components/layout/Header/ProfileDropdown.tsx`

`onEnroll`, `onMypage` 콜백 props → `enrollHref`, `mypageHref` string props로 변경.
수강생 등록, 마이페이지 버튼을 `<a href>` 태그로 변경.

### 3-4. 외부 로그인 리다이렉트 처리

**파일들:** `CommunityListPage.tsx`, `CommunityWritePage.tsx`, `CommunityEditPage.tsx`, `CommunityComments.tsx`

`navigate(ROUTES.AUTH.LOGIN)` → `window.location.href = ROUTES.AUTH.LOGIN`

React Router의 `navigate()`는 외부 URL 이동 불가. `window.location.href` 사용으로 전환.

---

## 4. Merge Conflict 해결

### handler.ts 파일들

- `src/features/posts/delete/handler.ts` — dev 버전으로 resolve (404 mock 처리 포함)
- `src/features/posts/edit/handler.ts` — dev 버전으로 resolve (mockStore 업데이트 포함)

### MarkdownEditor 중복 선언 제거

**파일:** `src/components/community/MarkdownEditor/MarkdownEditor.tsx`

`boldCommand`, `italicCommand`가 동일 스코프에 두 번 선언되어 빌드 에러 발생.
두 번째 선언(단순 버전) 제거, 첫 번째 선언(`detectFormat` 활용 정교한 버전) 유지.

---

## 5. 미해결 이슈 (팀 협의 필요)

### 사이트 간 인증 토큰 공유 문제

**현상:** `my.ozcodingschool.site`에서 로그인해도 `localhost:5173`의 localStorage에는 토큰이 없음.
브라우저는 origin이 다르면 localStorage를 공유하지 않음.

**결과:** 우리 앱에서 `/api/v1/accounts/me/` 호출 시 404 → 로그인 상태로 인식 불가.

**해결 방안 (1팀과 협의):**

| 방법         | 설명                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| 쿠키 방식    | `.ozcodingschool.site` 도메인으로 httpOnly 쿠키 발급 → 서브도메인 간 자동 공유 |
| URL 파라미터 | 로그인 후 우리 사이트로 리다이렉트 시 토큰을 쿼리 파라미터로 전달              |

**임시 테스트 방법:**

1. `my.ozcodingschool.site` 로그인 후 Console에서 `localStorage.getItem('accessToken')` 복사
2. `localhost:5173` Console에서 `localStorage.setItem('accessToken', '복사한값')`
3. 새로고침
