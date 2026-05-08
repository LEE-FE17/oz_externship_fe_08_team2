# 게시글 좋아요 상태·캐시 불일치 해결

> **담당자**: 정선영
> **브랜치**: `fix/post-like-cache`
> **관련 이슈**: `#52`
> **PR**: `#55` (`fix/post-like-cache` → `dev`)
> **작업 일자**: 2026-05-04

---

## 문제 개요

좋아요 토글 직후 `invalidateQueries`가 detail API를 재조회하면서 두 가지 문제가 발생.

1. **캐시 롤백**: `like/handler.ts`에서 업데이트한 `like_count`를 `detail/handler.ts`가 알지 못해, 재조회 시 초기값(3)으로 복원됨
2. **데이터 소스 분리**: `like/handler.ts`는 로컬 `likeCountMap`을, `detail/handler.ts`는 하드코딩 값을 사용 → 두 핸들러가 같은 상태를 공유하지 않음

---

## 변경 파일 목록

| 파일                                   | 변경 내용                                                       | 상태    |
| -------------------------------------- | --------------------------------------------------------------- | ------- |
| `src/features/posts/mockStore.ts`      | 공유 in-memory store 신규 생성                                  | ✅ 완료 |
| `src/features/posts/like/queries.ts`   | `invalidateQueries` 제거, `setQueryData` 적용                   | ✅ 완료 |
| `src/features/posts/like/handler.ts`   | 로컬 `likeCountMap` 제거, `likeMockStore` 사용                  | ✅ 완료 |
| `src/features/posts/detail/handler.ts` | 하드코딩 제거, `likeMockStore`에서 `like_count`·`is_liked` 읽기 | ✅ 완료 |

---

## 컴포넌트별 주요 변경 사항

### mockStore.ts (신규)

```ts
export const likeMockStore = {
  likeCountMap: new Map<number, number>(),
  isLikedMap: new Map<number, boolean>(),
  getLikeCount: (postId: number): number =>
    likeMockStore.likeCountMap.get(postId) ?? 3,
  getIsLiked: (postId: number): boolean =>
    likeMockStore.isLikedMap.get(postId) ?? false,
}
```

두 MSW 핸들러가 공유하는 단일 in-memory 상태. 초기값은 기존 더미 데이터와 동일(like_count: 3, is_liked: false).

### useTogglePostLike — invalidateQueries → setQueryData

```ts
// 변경 전
onSuccess: () => {
  void queryClient.invalidateQueries({ queryKey: ['posts', 'detail', postId] })
}

// 변경 후
onSuccess: (data) => {
  queryClient.setQueryData<PostDetailResponse>(
    ['posts', 'detail', postId],
    (prev) => {
      if (!prev) return prev
      return { ...prev, is_liked: data.is_liked, like_count: data.like_count }
    }
  )
}
```

재조회 없이 캐시를 직접 패치. 네트워크 요청 1회 절감, 롤백 현상 제거.

### like/handler.ts

```ts
// 변경 전: 로컬 Map
const likeCountMap = new Map<number, number>()
const getLikeCount = (postId: number) => likeCountMap.get(postId) ?? 3

// 변경 후: 공유 store
import { likeMockStore } from '../mockStore'
// likeMockStore.getLikeCount(), likeMockStore.likeCountMap.set(), likeMockStore.isLikedMap.set()
```

### detail/handler.ts

```ts
// 변경 전: 하드코딩
const dummyPostDetail = { like_count: 3, is_liked: false, ... }
return HttpResponse.json({ ...dummyPostDetail, id: postId })

// 변경 후: 공유 store에서 읽기
return HttpResponse.json({
  ...dummyPostBase,
  id: postId,
  like_count: likeMockStore.getLikeCount(postId),
  is_liked: likeMockStore.getIsLiked(postId),
})
```

---

## 구현 요구사항 체크리스트

- [x] `invalidateQueries` 제거
- [x] `setQueryData`로 detail 캐시 직접 업데이트
- [x] `likeMockStore` 공유 store 생성
- [x] `like/handler.ts` — 공유 store 사용
- [x] `detail/handler.ts` — 공유 store에서 `like_count`, `is_liked` 읽기
- [x] TypeScript 타입 에러 없음 (`tsc --noEmit`)
- [x] 빌드 성공 (`pnpm build`)

---

## 연결 구조

```
useTogglePostLike (queries.ts)
├── mutationFn: POST/DELETE /api/v1/posts/:id/like
│   └── MSW like/handler.ts → likeMockStore 업데이트
└── onSuccess: setQueryData(['posts', 'detail', postId])
    └── 캐시 직접 패치 (is_liked, like_count)

재조회 시 (detail/handler.ts)
└── likeMockStore.getLikeCount/getIsLiked → 최신 상태 반환
```

---

## 커밋 이력

| 커밋 메시지                                      | 내용                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `fix: 게시글 좋아요 상태·캐시 불일치 해결 (#52)` | mockStore 생성, invalidateQueries 제거, setQueryData 적용, 핸들러 공유 store 통합 |
