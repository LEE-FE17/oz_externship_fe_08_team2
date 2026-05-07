# 커뮤니티 게시글 작성 페이지 작업 진행 내용

> **담당자**: LEE-FE17
> **브랜치**: `feat/community-write-page` → `fix/communityWritePage`
> **관련 이슈**: #5 · #6 · #7 · #8 · #9
> **대상 파일**: `src/pages/community/CommunityWritePage.tsx`

---

## 작업 개요

커뮤니티 게시글 작성 페이지(`/community/write`) 구현.
마크다운 에디터(`@uiw/react-md-editor`)를 기반으로 커스텀 툴바와 실시간 split-view 미리보기를 적용.
`PostForm` 공통 컴포넌트를 통해 수정 페이지(`CommunityEditPage`)와 UI를 공유.

---

## 구현 파일 목록

| 파일                                                         | 설명                                    | 상태    |
| ------------------------------------------------------------ | --------------------------------------- | ------- |
| `src/pages/community/CommunityWritePage.tsx`                 | 글작성 페이지 컴포넌트                  | ✅ 완료 |
| `src/pages/community/CommunityEditPage.tsx`                  | 글수정 페이지 (PostForm 공유)           | ✅ 완료 |
| `src/components/community/PostForm/PostForm.tsx`             | 공통 폼 + MDEditor + 커스텀 툴바        | ✅ 완료 |
| `src/components/community/MarkdownEditor/MarkdownEditor.tsx` | MDEditor 래퍼 + 커스텀 커맨드 전체 정의 | ✅ 완료 |
| `src/components/community/MarkdownEditor/MarkdownEditor.css` | MDEditor CSS 오버라이드                 | ✅ 완료 |
| `src/components/community/PageHeader/PageHeader.tsx`         | 페이지 제목 컴포넌트 (32px)             | ✅ 완료 |
| `src/features/posts/write/types.ts`                          | 게시글 작성 / 이미지 업로드 타입 정의   | ✅ 완료 |
| `src/features/posts/write/queries.ts`                        | useCreatePost, usePresignedUrl 훅       | ✅ 완료 |
| `src/features/posts/write/handler.ts`                        | MSW 핸들러 (게시글 작성, presigned-url) | ✅ 완료 |
| `src/features/posts/edit/queries.ts`                         | useUpdatePost 훅                        | ✅ 완료 |
| `src/features/posts/edit/handler.ts`                         | MSW 핸들러 (게시글 수정)                | ✅ 완료 |
| `src/features/posts/categories/`                             | 카테고리 목록 조회 모듈                 | ✅ 완료 |

---

## API 명세

### 게시글 작성 (POST)

- **Method**: `POST`
- **Endpoint**: `/api/v1/posts`
- **Request Body**: `{ title, content, category_id }`
- **성공 응답 (201)**: `{ detail: "게시글이 성공적으로 등록되었습니다.", pk: number }`
- **실패 응답 (400)**: `{ error_detail: { title/content: [...] } }`

### 게시글 수정 (PUT)

- **Method**: `PUT`
- **Endpoint**: `/api/v1/posts/:postId`
- **Request Body**: `{ title, content, category_id }`
- **성공 응답 (200)**: `{ id, title, content, category }`
- **실패 응답 (400)**: `{ error_detail: { title: [...] } }`

### 카테고리 목록 (GET)

- **Method**: `GET`
- **Endpoint**: `/api/v1/categories`
- **응답**: 카테고리 배열 ("전체 게시판"은 클라이언트에서 필터링하여 제외)

### 이미지 업로드 (presigned URL)

- **Step 1**: `POST /api/v1/posts/presigned-url` → `{ presigned_url, img_url, key }`
- **Step 2**: `PUT {presigned_url}` (파일 바이너리 업로드)
- **Step 3**: 에디터에 `URL.createObjectURL(file)` 삽입 (미리보기용), 업로드 완료 후 `img_url`로 즉시 치환

---

## 주요 구현 내용

### MDEditor 커스텀 툴바 (2열 구성)

**1열 (commands)**

| 버튼                | 기능                                         |
| ------------------- | -------------------------------------------- |
| 실행 취소 ↩         | 커스텀 undoStack — 내용이 없으면 비활성      |
| 다시 실행 ↪         | 커스텀 redoStack — 이후 내용이 없으면 비활성 |
| 기본서체 (드롭다운) | `<span style="font-family:...">` 삽입        |
| 16 (드롭다운)       | `<span style="font-size:...">` 삽입          |
| B / I / U / S       | bold, italic, underline, strikethrough       |
| 배경색 (드롭다운)   | `<mark style="background-color:...">` 삽입   |
| 글자색 (드롭다운)   | `<span style="color:...">` 삽입 (흰색 포함)  |
| 링크                | MDEditor 기본 링크 삽입                      |
| 이미지              | presigned URL 기반 이미지 업로드             |

**2열 (extraCommands)**

목록(글머리/번호/체크) · 정렬(좌/중/우/양쪽) · 줄 간격 · 내어쓰기/들여쓰기 · 서식 제거

### 실행 취소 / 다시 실행

- `document.execCommand` 제거 → `useState` 기반 커스텀 히스토리 스택
- 스택 비어있을 때: `data-inactive="true"` + `pointer-events: none`으로 hover/click 차단
- 이미지 업로드(서버 URL 치환 포함)도 undo 스택에 정상 기록됨

### 이미지 업로드 동작 흐름

```
파일 선택
  → object URL 생성 → 에디터에 즉시 삽입 (미리보기 표시)
  → POST /api/v1/posts/presigned-url → { presigned_url, img_url }
  → PUT {presigned_url} (실제 파일 업로드)
  → 에디터 내 object URL을 img_url로 치환 (handleChange 경유 → undo 스택 기록)
  → URL.revokeObjectURL (메모리 해제)
```

### 카테고리 필터링

- `GET /api/v1/categories` 응답에서 `"전체 게시판"`을 클라이언트에서 제외
- 작성 페이지(`CommunityWritePage`)와 수정 페이지(`CommunityEditPage`) 양쪽 동일하게 적용

### PostForm 공통 컴포넌트 props

| prop            | 설명                                                    |
| --------------- | ------------------------------------------------------- |
| `mode`          | `"write"` \| `"edit"` — 제출 버튼 레이블 분기           |
| `showCancel`    | 취소 버튼 조건부 표시 (글작성: `false`, 글수정: `true`) |
| `defaultValues` | 수정 시 기존 데이터 초기값 주입                         |
| `isPending`     | 제출 중 버튼 비활성화                                   |

---

## 버그 수정 내역 (fix/communityWritePage)

### 1. 마크다운 미리보기 목록 스타일 미표시

- **원인**: Tailwind CSS v4의 preflight가 `ul`/`ol`의 `list-style`을 전역 초기화(`none`)
- **수정**: `MarkdownEditor.css`에 `.wmde-markdown` 내 목록 스타일 명시적 복원
  - `ul` → `disc`, `ul ul` → `circle`, `ul ul ul` → `square`
  - `ol` → `decimal`, `ol ol` → `lower-alpha`, `ol ol ol` → `lower-roman`
  - `li` → `display: list-item`

### 2. 글자색 팔레트 흰색 누락

- **원인**: `PALETTE_COLORS`에 흰색(`#ffffff`) 미포함. 배경색 팔레트와 배열 공유 불가
- **수정**: `TEXT_PALETTE_COLORS = ['#ffffff', ...PALETTE_COLORS]` 별도 배열 생성.
  흰색 스와치는 배경과 구분되도록 회색 테두리(`#d1d5db`) 적용

### 3. 게시글 수정 후 상세 페이지에 이전 내용 표시

- **원인**: `useUpdatePost`가 성공 후 TanStack Query의 `postDetail` 캐시를 무효화하지 않음.
  `staleTime: 60s` 동안 수정 전 데이터가 그대로 반환됨
- **수정**: `useUpdatePost.onSuccess`에 `invalidateQueries({ queryKey: ['posts', 'detail', postId] })` 추가
- **동작 흐름**:
  ```
  PUT /api/v1/posts/:id 성공
    → onSuccess 실행
    → invalidateQueries(['posts', 'detail', postId])
    → 상세 페이지 진입 시 캐시 만료 → 새로 fetch → 최신 데이터 표시
  ```

### 4. 게시글 작성 후 상세 페이지에 mock 데이터 표시

- **원인 1 (캐시)**: 이전에 같은 postId(`1001`)를 방문한 경우 mock 데이터가 60초간 캐시됨.
  새로 작성된 게시글로 이동해도 캐시된 mock 데이터가 반환됨
- **수정 1**: `useCreatePost.onSuccess`에서 `removeQueries({ queryKey: ['posts', 'detail', data.pk] })`로
  해당 캐시 엔트리를 완전 제거 → 상세 진입 시 반드시 새로 fetch
- **원인 2 (MSW)**: edit MSW 핸들러가 수정 내용을 `postMockStore`에 반영하지 않음.
  캐시 invalidate 후 재요청해도 이전 데이터를 반환
- **수정 2**: `edit/handler.ts`에서 수정 성공 시 `postMockStore.posts.set(postId, {...})` 업데이트
- **동작 흐름**:
  ```
  POST /api/v1/posts 성공 (pk: 1001)
    → removeQueries(['posts', 'detail', 1001])  ← 기존 캐시 제거
    → invalidateQueries(['posts', 'list'])
    → navigate('/community/1001')
    → 상세 페이지: 캐시 없음 → GET /api/v1/posts/1001
    → MSW: postMockStore.get(1001) 반환 → 실제 작성 데이터 표시
  ```

### 5. 수정 페이지 카테고리 드롭다운에 "전체 게시판" 노출

- **원인**: `CommunityEditPage`에서 카테고리 필터 누락 (`CommunityWritePage`와 불일치)
- **수정**: `rawCategories.filter((c) => c.name !== '전체 게시판')` 동일하게 적용

### 6. 이미지 업로드 시 undo 스택 우회

- **원인**: 이미지 서버 URL 치환 시 `onChange`를 직접 호출하여 undo 히스토리에 기록되지 않음
- **수정**: `handleChange`로 교체 → 이미지 업로드 완료도 undo/redo 스택에 정상 기록
- **동작 흐름**:
  ```
  이미지 업로드 완료
    → handleChange(objectUrl → serverUrl 치환된 값)
    → undoStack에 이전 값 push
    → redo 스택 초기화
    → onChange(부모 콜백) 호출
  ```

### 7. 작성 완료 후 navigate 타이머 미정리

- **원인**: 등록 성공 시 `setTimeout(navigate, 800)`을 사용하는데, 800ms 안에
  사용자가 다른 페이지로 이동하면 컴포넌트가 unmount된 후에도 타이머가 발동됨
- **수정**: `navTimerRef`로 타이머 ID 보관 → `useEffect` cleanup에서 `clearTimeout` 처리
  ```ts
  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current)
    }
  }, [])
  ```

---

## 구현 요구사항 체크리스트

- [x] 카테고리 선택 드롭다운 ("전체 게시판" 제외) — 작성/수정 페이지 동일 적용
- [x] 제목 입력 (최대 100자)
- [x] MDEditor split-view 미리보기 (`preview="live"`)
- [x] 커스텀 툴바 2열 구성 (Figma 기준)
- [x] 실행 취소 / 다시 실행 (커스텀 히스토리 스택, 비활성 처리, 이미지 업로드 포함)
- [x] 이미지 업로드 (presigned URL → 실제 이미지 삽입 → undo 스택 기록)
- [x] 목록 스타일 복원 (글머리/번호 다단계 중첩 포함)
- [x] 글자색 팔레트 흰색 포함
- [x] 내용 최대 2000자 유효성 검사
- [x] 게시글 등록 성공 → 토스트 후 상세 페이지 이동 (타이머 cleanup 포함)
- [x] 에러 시 토스트 메시지 표시
- [x] 수정 페이지에 PostForm 공유 (showCancel, defaultValues)
- [x] 수정 성공 후 상세 페이지 최신 데이터 표시 (캐시 invalidate)

---

## 커밋 이력

| 커밋 메시지                                                                 | 내용                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `feat: 커뮤니티 게시글 작성/수정 페이지 구현`                               | CommunityWritePage, CommunityEditPage, PostForm 초기 구현             |
| `style: 커뮤니티 글작성 페이지 제목 수정 및 컨테이너 너비 조정`             | max-width 944px, 페이지 제목 조정                                     |
| `feat: 글작성 페이지 카테고리에서 전체 게시판 제외`                         | rawCategories 필터링 적용                                             |
| `feat: 커뮤니티 글작성 에디터 툴바 커스텀 및 반응형 레이아웃 적용`          | 툴바 2열 구성, 커스텀 커맨드 전체 적용                                |
| `fix: 글작성 페이지 레이아웃 및 에디터 툴바 개선`                           | CSS 오버라이드, 카드 border/radius, 미리보기 패널 배경                |
| `style: 글작성 페이지 제목 구분선 제거 및 미리보기 h1/h2 하단 선 제거`      | 스타일 정리                                                           |
| `fix: 마크다운 미리보기 헤딩 스타일 복원`                                   | Tailwind preflight 초기화 대응 (h1~h6 CSS 재선언)                     |
| `feat: PostForm 실행 취소/다시 실행 커스텀 히스토리 스택 구현 및 버그 수정` | undo/redo 스택, 이미지 업로드 수정, 드롭다운·모서리 버그 수정         |
| `style: PageHeader 제목 폰트 크기 Figma 기준 32px 적용`                     | text-2xl → text-[32px]                                                |
| `feat: 게시글 수정 페이지 취소 버튼 조건부 표시 적용`                       | showCancel={true} 추가                                                |
| `style: 커뮤니티 수정 페이지 및 관련 모듈 코드 포맷팅 정리`                 | CommunityEditPage 미사용 import/변수 제거, 후행 쉼표 정리             |
| `fix: 마크다운 에디터 글머리/번호 목록 스타일 복원`                         | Tailwind preflight 초기화로 사라진 ul/ol list-style 재선언            |
| `fix: 번호 목록 중첩 시 하위 단계 스타일 적용`                              | ol ol → lower-alpha, ol ol ol → lower-roman 중첩 스타일 추가          |
| `fix: 글자색 팔레트에 흰색 추가`                                            | TEXT_PALETTE_COLORS 분리, 흰색 스와치 테두리 처리                     |
| `fix: 게시글 수정 후 상세 페이지에 이전 내용이 표시되는 문제 수정`          | useUpdatePost onSuccess에 postDetail 캐시 invalidate 추가             |
| `fix: 게시글 작성/수정 후 상세 페이지에 mock 데이터가 표시되는 문제 수정`   | create 시 detail 캐시 remove, edit MSW 핸들러 postMockStore 업데이트  |
| `fix: 수정 페이지 카테고리 드롭다운에서 전체 게시판 제외`                   | CommunityEditPage 누락된 카테고리 필터 추가 (작성 페이지와 동일)      |
| `fix: 이미지 업로드 undo 우회 및 작성 페이지 타이머 cleanup`                | 이미지 URL 교체 시 handleChange 사용, unmount 시 navigate 타이머 정리 |
