# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

- **개발 서버:** `npm run dev` (Vite, http://localhost:5173)
- **빌드:** `npm run build` (`tsc -b && vite build`)
- **린트:** `npm run lint` (ESLint, `*.{ts,tsx}` 대상)
- **포맷팅:** `npx prettier --write <파일>`
- **E2E 테스트:** `npx playwright test --project=chromium` (기능 테스트, `*.visual.*` 제외)
- **단일 E2E 테스트:** `npx playwright test <테스트파일> --project=chromium`
- **비주얼 회귀 테스트:** `npm run test:visual` (`*.visual.spec.ts` 대상, 1920×1080 뷰포트)
- **Figma 베이스라인 갱신:** `npm run test:visual:update-baseline` (Figma에서 스크린샷 다운로드)

## Git Hooks (Husky)

- **pre-commit:** `lint-staged` 실행 — staged된 `*.{ts,tsx}`에 ESLint --fix + Prettier, `*.{json,css,md}`에 Prettier 적용
- **commit-msg:** 커밋 메시지 형식 검증 — `<type>: <설명>` 형식 필수. 허용 타입: feat, fix, refactor, style, docs, test, chore, build, ci, perf. 예시: `feat: 로그인 기능 추가 (#12)`
- **pre-push:** `npm run build` 실행 — 빌드 실패 시 push 차단

## 아키텍처

- **기술 스택:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + TanStack Query + Zustand + MSW
- **React Compiler:** `babel-plugin-react-compiler` + `@rolldown/plugin-babel`로 활성화
- **경로 별칭:** `@/` → `src/` (vite.config.ts, tsconfig.app.json 양쪽에 설정됨)
- **API 클라이언트:** `src/api/instance.ts` — axios 인스턴스. JWT를 localStorage에 저장하고 요청 헤더에 자동 주입. 401 시 `/api/v1/accounts/me/refresh`로 토큰 갱신 후 재시도, 갱신 실패 시 로그인 페이지로 리다이렉트
- **MSW:** DEV 모드에서 `main.tsx`의 `enableMocking()`이 서비스 워커를 활성화. `onUnhandledRequest: 'bypass'` 설정

### 라우팅 구조

`src/providers/RouterProvider.tsx`에서 전체 라우트 정의. 두 가지 레이아웃 사용:

- `AuthLayout` — 헤더만 (로그인, 회원가입)
- `DefaultLayout` — 헤더 + 푸터 (나머지 전체)

### Feature 모듈 패턴

`src/features/{도메인}/{액션}/` 구조. 각 모듈은 4개 파일로 구성:

- `types.ts` — 요청/응답 타입 정의
- `queries.ts` — TanStack Query 훅 (useQuery, useMutation)
- `handler.ts` — MSW 핸들러 (해당 API 모킹)
- `index.ts` — barrel export

도메인 예시: `accounts`, `posts`, `qna`, `course`, `chatbot`, `exams`

### Playwright 테스트 구조

`playwright.config.ts`에 두 개의 프로젝트가 정의됨:

- **chromium** — 기능 E2E 테스트. `e2e/` 하위의 `*.spec.ts` (`*.visual.*` 제외)
- **visual** — 비주얼 회귀 테스트. `e2e/visual/*.visual.spec.ts`. Figma 스크린샷을 베이스라인으로 사용하며 `e2e/__screenshots__/`에 저장. `maxDiffPixelRatio: 0.1`

## 참조 문서

| 문서                                   | 용도                                  |
| -------------------------------------- | ------------------------------------- |
| `docs/convention/CONVENTION.md`        | 코딩 컨벤션 (존재 시 반드시 준수)     |
| `docs/convention/COMPONENTS.md`        | 컴포넌트 컨벤션 (존재 시 반드시 준수) |
| `docs/convention/DESIGN_TOKENS.md`     | 디자인 시스템 참고                    |
| `docs/convention/STATE_MANAGEMENT.md`  | 상태관리 참고                         |
| `docs/convention/PROJECT_STRUCTURE.md` | 프로젝트 구조 참고                    |
| `docs/convention/FEATURES.md`          | 기능 개발 참고                        |
| `docs/convention/PAGES.md`             | 페이지 구현 참고                      |
| `docs/convention/ROUTING.md`           | 라우트, 페이지별 API, 컴포넌트명      |
| `.github/PULL_REQUEST_TEMPLATE.md`     | PR 작성 시 반드시 사용                |

### 주요 디렉토리

**참고 문서 : `docs/convention/PROJECT_STRUCTURE.md`**

- `src/components/` — 공통 UI 컴포넌트. `src/components/index.ts`에서 barrel export. 각 컴포넌트는 `컴포넌트명/컴포넌트명.tsx` + `index.ts` 구조
- `src/features/` — 도메인별 API 연동 모듈 (types, queries, handler, index)
- `src/stores/` — Zustand 스토어 (`devtools` 미들웨어 사용, 예: `authStore.ts`)
- `src/providers/` — `QueryProvider` (TanStack Query) + `RouterProvider` (라우트 정의)
- `src/mocks/` — MSW 브라우저 워커 설정. 실제 핸들러는 `src/features/*/handler.ts`에 위치
- `src/constants/` — 앱 전역 상수 (예: `routes.ts`의 라우트 경로)
- `src/pages/` — 페이지 단위 컴포넌트
- `e2e/` — Playwright 테스트. `e2e/visual/`은 비주얼 회귀, 나머지는 기능 E2E

### 디자인 토큰

**참고 문서 : `docs/convention/DESIGN_TOKENS.md`**

모든 디자인 토큰(색상, 간격, 타이포그래피, 라운드, 그림자)은 `src/App.css`의 `@theme {}` 블록에 Tailwind v4 CSS 테마 변수로 정의되어 있으며, Figma에서 추출한 값 기반. Tailwind 유틸리티 클래스로 사용 (예: `text-primary`, `bg-gray-100`, `rounded-lg`).

### 상태 관리 패턴

**참고 문서 : `docs/convention/STATE_MANAGEMENT.md`**

- **서버 상태:** TanStack Query (기본 staleTime: 60초, retry: 1, refetchOnWindowFocus: false)
- **클라이언트 상태:** Zustand 스토어 + devtools 미들웨어

<aside>

### 1. 기본 정보

</aside>

- **페이지/기능명**: 댓글 목록 조회
- **담당자**: 최민제
- **우선순위**: 높음 / 중간 / 낮음

---

<aside>

### 2. 페이지 한 줄 설명

이 페이지는 무엇을 위한 페이지인지, 사용자는 여기서 무엇을 할 수 있는지 한 문장으로 작성합니다.

</aside>

<aside>

커뮤니티 게시글로 들어가면 댓글 목록을 볼 수 있습니다.

</aside>

---

<aside>

### 3. 사용자 시나리오

사용자가 실제로 이 페이지에서 어떤 흐름으로 행동하는지 순서대로 작성합니다.

</aside>

**기본 흐름 (작성)**

사용자가 게시글 페이지에서 댓글 목록을 볼 수 있다.

**성공 시 흐름 (작성 성공)**

1. 사용자 게시물에 들어가면 하단부분 댓글창 (10개씩이 보임)
2. 댓글창 위에는 댓글을 적을수있는 칸과 옆에 작성버튼이 보임 (로그인 시에만)
3. 스크롤을 하면 10개씩 이전에 적었던 댓글 11~20 21~30번째 추가되면서 보입니다.
4. 스크롤 로딩중에는 밑에 … 렌더링 표시

**실패 시 흐름**

1. 게시물이 만약에 사라진경우 토스트 메세지를 남기고 게시글 목록창으로 자동 이동 (404 에러대신)
2. 잘못된 url접근을 한 경우는 404에러(해당 페이지가 없습니다.)

---

<aside>

### 4. 요구사항 정리

기획서/피그마/회의 내용을 바탕으로 실제 구현해야 하는 요구사항만 적습니다.

</aside>

**필수 요구사항**

- [ ] 댓글 창(목록)기능 구현
- [ ] 댓글 목록은 무한스크롤을 적용하여 한번에 10개 씩 가져오도록 합니다. + 로딩표시 구현
- [ ] 유저 닉네임 + 프로필이 표시 되는가
- [ ] 내용 중 `@닉네임` 으로 유저를 태그하는 부분을 파싱하고, 디자인을 추가하여 댓글 내용 텍스트와 구분가능하게 합니다.
- [ ] 작성일시가 보이게 합니다.

### 댓글 목록 조회 (GET)

사용자가 페이지에 접속했을 때 기존에 저장된 댓글들을 불러와 화면에 뿌려주는 기능입니다.

- **Method:** `GET`
- **Endpoint : api/v1/posts/{post_id}/comments**
- **응답 내용:** 댓글 작성자, 내용, 작성 시간, 프로필 이미지 등을 포함한 배열(Array) 형태.

**상태 처리 요구사항**

- [ ] 페이지 로딩 상태 : …으로 렌더링 표시

---

<aside>

### 5. 화면 구성 요소

</aside>

페이지 안에 들어가는 주요 UI를 나열합니다.

| 영역 | 컴포넌트명    | 설명                                                                    | 필수 여부 |
| ---- | ------------- | ----------------------------------------------------------------------- | --------- |
| 하단 | CommentsArea  | 댓글목록이 보입니다. 배열형태로 댓글들이 저장됩니다.                    | 필수      |
| 하단 | CommentScroll | 댓글 스크롤기능 + 스크롤하는동안 로딩표시 구현, 10개씩 보이게           | 필수      |
| 하단 | MentorInfo    | 댓글 단 사람들의 프로필과 아이디등을 나타내는 컴포넌트                  | 필수      |
| 하단 | TagSign       | 자동완성으로 아이디들 표시, 태그한 부분은 색깔(볼드 처리등)로 분리표시  | 필수      |
| 하단 | IsMentorLogin | 로그인을 한 사용자는 댓글 다는 창이 보이고 비로그인 사용자는 보이지않게 | 필수      |

---

<aside>

### 6. API 연동 정리

가장 중요한 영역입니다. AI가 구현하려면 **어떤 API를 언제 왜 호출하는지**가 명확해야 합니다.

</aside>

**API 목록**

| 기능           | 메서드 | 엔드포인트                          | 호출 시점             | 설명                    |
| -------------- | ------ | ----------------------------------- | --------------------- | ----------------------- |
| 댓글 목록 조회 | GET    | **api/v1/posts/{post_id}/comments** | 게시물 페이지 진입 시 | 댓글 목록을 볼 수 있다. |

**API 상세 명세**

<aside>

- **API 템플릿**
  - **기능**: 댓글 조회
  - **메서드**: GET
  - **엔드포인트**: /**api/v1/posts/{post_id}/comments**
  - **인증 필요 여부**: 불필요
  - **쿼리 파라미터**:?page=2&page_size=10 (`page=2`: 전체 댓글 중 **2번째 페이지**를 보여달라.
  - `page_size=10`: 한 페이지에 댓글을 **10개씩** 끊어서 보여달라.)
  - **성공 응답 예시**:

  ```json
  "200: {
      "count": 100,
      "next": "http://api.ozcoding.site/api/v1/posts/1/comments?page=2&page_size=10"
      "previous": "http://api.ozcoding.site/api/v1/posts/1/comments?page=1&page_size=10",
      "results": [
          {
              "id": 1,
              "author": {
                  "id": 1,
                  "nickname": "testuser",
                  "profile_img_url": "https://example.com/uploads/images/users/profiles/image.png"
              },
              "tagged_users": [
                  {
                      "id": 2,
                      "nickname": "testuser2",
                  }
              ],
              "content": "@testuser2 이 게시글에 유저 태그해서 댓글 달기",
              "created_at": "2025-10-30T14:01:57.505250+09:00",
              "updated_at": "2025-10-30T14:01:57.505250+09:00"
          }
      ]
  }"
  ```

  - **실패 응답 예시**:

  ```json
  "404: {
      "error_detail": "해당 게시글을 찾을 수 없습니다."
  }"

  ```

</aside>

---

<aside>

### 7. 프론트엔드 동작 명세

API를 받아서 화면에서 어떻게 동작해야 하는지 적습니다.

</aside>

**사용자 액션**

- 초기 진입 시: `post_id`에 해당하는 게시물 페이지 로드 시, 첫 번째 페이지(`page=1`)의 댓글 목록 API를 호출합니다.
- 스크롤 시: 무한스크롤로 구현하기 때문에 페이지가 화면에 보이지 않고 스크롤 해야 그 다음 댓글들이 api 호출이 되서 보여진다. 스크롤 하고 다음댓글이 나온다는 로딩표시로 …이 나옴. 그 이후 댓글 페이지가 달라지고 다른 댓글들이 10개씩 추가되서 보입니다. 다음 페이지가 없으면 api를 받을때 api의 next 뒤에 값이 null로 온다. next뒤에 값이 없기 때문에 댓글이 더이상 없고 스크롤도 더이상 되지 않습니다.

**유효성 검사**

- 필수 입력값: API 응답의 `results`가 비어있을 경우, "등록된 댓글이 없습니다."라는 안내 문구를 화면에 표시합니다.
- **태그 파싱:** `content` 내의 `@닉네임` 문자열을 `tagged_users` 정보와 매칭하여 디자인(색상 변경, 볼드 처리 등)을 적용합니다.

<aside>

- 예시 - 닉네임은 2자 이상 10자 이하 - 공백만 입력할 수 없음 - 저장 버튼은 변경사항이 있을 때만 활성화
</aside>

---

<aside>

### 8. 예외 상황 정리

유저의 경험을 높이기 위해 필수로 작성합니다.

</aside>

| 상황                 | 원인                 | 프론트 처리                                                                     |
| -------------------- | -------------------- | ------------------------------------------------------------------------------- |
| 잘못된 페이지 접근   | url오타              | 해당 페이지는 없습니다(그냥 페이지에 크게 나타나게 알림이나 메시지가 아닌 형태) |
| 게시물이 사라진 경우 | 사용자가 게시물 삭제 | 토스트 메세지(해당 게시물은 없습니다)를 남기고 게시글 목록창으로 자동 이동      |

---

---

<aside>

### 10. 완료 기준

이 섹션이 있어야 “어디까지 하면 끝인지”가 명확해집니다.

</aside>

**기능 완료 기준**

- [ ] 댓글창 목록 만들기
- [ ] 사라진 게시물에 접근시 토스트 메세지로 해당 게시물은 없습니다 표시 후 게시글 목록 페이지로 이동한다
- [ ] 잘못된 url 접근시 해당 페이지는 없습니다 404 에러표시
- [ ] 스크롤시 댓글이 10개씩 추가되서 보이는가
- [ ] 댓글 단 사람의 아이디랑 프로필 등이 보이는가

**코드 완료 기준**

- [ ] 프로필, 아이디, 로그인 시 댓글다는 창 보이고 비로그인 시 안보이게 구현을 했는가
- [ ] 에러 상태, 로딩 상태, 성공 상태가 모두 처리되어 있다

---
