# CommentTag — 유저 태그 기능

- **기능명**: 댓글 유저 태깅 (`@멘션`)
- **담당자**: 최민제
- **브랜치**: `feature/commentTag`

---

## 기능 설명

댓글 입력 중 `@` 문자를 입력하면 닉네임 검색 드롭다운이 나타나고, 유저를 선택해 태그할 수 있습니다.
태그된 유저는 입력창과 댓글 목록 양쪽에서 **보라색 볼드 + 연보라 배경**으로 시각적으로 구분됩니다.

---

## 사용자 흐름

1. 댓글 입력창에서 `@` 입력
2. 닉네임 자동완성 드롭다운 노출
3. 드롭다운에서 유저 선택 → `@닉네임 ` 이 입력창에 삽입됨
4. 선택된 `@닉네임` 은 보라색 볼드 + 연보라 배경으로 하이라이트 표시
5. `Escape` 또는 포커스 해제 시 드롭다운 닫힘
6. 댓글 제출 시 `content` 문자열에 `@닉네임` 포함하여 전송
7. 등록된 댓글 목록에서도 태그된 유저는 동일한 스타일로 표시

---

## API

### 유저 검색 (태그 자동완성)

- **Method:** `GET`
- **Endpoint:** `/api/v1/users/search?nickname={query}`
- **인증:** 필요 (`Bearer Token`)
- **호출 시점:** `@` 입력 후 닉네임 쿼리가 변경될 때마다 (`enabled: query.length > 0`)

**성공 응답 (200)**

```json
{
  "results": [
    {
      "id": 2,
      "nickname": "testuser2",
      "profile_img_url": "https://example.com"
    },
    {
      "id": 3,
      "nickname": "testuser3",
      "profile_img_url": "https://example.com"
    }
  ]
}
```

**실패 응답**

```json
{ "error_detail": "자격 인증 데이터가 제공되지 않았습니다" }
```

---

## 구현 내역

### 신규 파일

| 파일                                                   | 설명                                          |
| ------------------------------------------------------ | --------------------------------------------- |
| `src/features/accounts/user-search/types.ts`           | `UserSearchResult`, `UserSearchResponse` 타입 |
| `src/features/accounts/user-search/queries.ts`         | `useUserSearch(query)` — TanStack Query 훅    |
| `src/features/accounts/user-search/handler.ts`         | MSW 핸들러 — 닉네임 부분 일치 검색            |
| `src/features/accounts/user-search/index.ts`           | barrel export                                 |
| `src/components/community/UserTagList/UserTagList.tsx` | 유저 검색 드롭다운 컴포넌트                   |
| `src/components/community/UserTagList/index.ts`        | barrel export                                 |

### 수정 파일

| 파일                                                     | 변경 내용                                                               |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/components/community/CommentInput/CommentInput.tsx` | `@` 감지 → 드롭다운 연결, 선택 시 삽입, 미러 오버레이로 하이라이트 구현 |
| `src/components/community/CommentItem/CommentItem.tsx`   | `tagged_users` 기반 하이라이트 — 연보라 배경 + 보라색 볼드 추가         |
| `src/features/posts/comments/handler.ts`                 | POST 시 content에서 `@멘션` 파싱해 `tagged_users` 자동 반영             |
| `src/mocks/handlers.ts`                                  | `userSearchHandlers` 등록                                               |

---

## 핵심 구현 포인트

### `@` 감지 로직 (CommentInput)

커서 위치 기준으로 직전 `@단어` 패턴을 실시간으로 감지합니다.

```ts
function getMentionQuery(text: string, cursorPos: number): string | null {
  const textBeforeCursor = text.slice(0, cursorPos)
  const match = textBeforeCursor.match(/@(\S*)$/)
  return match ? match[1] : null
}
```

### 하이라이트 오버레이 (CommentInput)

textarea는 내부 텍스트 스타일링이 불가능하므로 **미러 div 오버레이** 방식을 사용합니다.

- **미러 div**: textarea 뒤에 겹쳐서 동일한 패딩/폰트로 렌더링. 드롭다운에서 선택된 `@닉네임`만 `<mark>`로 감싸 하이라이트
- **textarea**: `color: transparent` + `caretColor: #121212` → 커서는 보이고 텍스트는 투명
- **스크롤 동기화**: `onScroll`에서 미러 div의 `scrollTop`을 textarea에 맞춤

### 하이라이트 조건

- 입력창: 드롭다운에서 **실제 선택**한 닉네임만 하이라이트 (`taggedNicknames: Set<string>` 로 관리)
- 댓글 목록: 서버 응답의 `tagged_users` 배열에 포함된 닉네임만 하이라이트

---

## 컴포넌트

| 컴포넌트명     | 위치                     | 설명                                                       |
| -------------- | ------------------------ | ---------------------------------------------------------- |
| `UserTagList`  | `community/UserTagList`  | `@` 입력 시 나타나는 유저 검색 드롭다운. 호버 시 회색 배경 |
| `CommentInput` | `community/CommentInput` | 태그 감지 + 미러 오버레이 하이라이트 포함                  |
| `CommentItem`  | `community/CommentItem`  | `tagged_users` 기반 태그 하이라이트 렌더링                 |

---

## 완료 기준

- [x] `@` 입력 시 유저 태깅 드롭다운 정상 노출
- [x] 드롭다운에서 유저 선택 시 `@닉네임 ` 삽입 + 커서 이동
- [x] 드롭다운 호버 시 회색 배경 하이라이트
- [x] 선택된 `@닉네임` 입력창에서 보라색 볼드 + 연보라 배경 표시
- [x] 댓글 목록에서도 태그된 유저 동일 스타일 표시
- [x] 임의 입력한 `@단어` 는 하이라이트 안됨 (드롭다운 선택만 적용)
- [x] `Escape` / blur 시 드롭다운 닫힘
- [x] 댓글 제출 시 `content`에 `@닉네임` 포함 전송
- [x] 등록 버튼 정상 작동 (z-index 충돌 수정)
