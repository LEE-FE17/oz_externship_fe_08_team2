import type { PostDetailResponse } from './detail/types'
import type { PostListItem } from './list/types'

/** MSW 핸들러 간 공유 in-memory 상태 (like_count, is_liked) */
export const likeMockStore = {
  likeCountMap: new Map<number, number>(),
  isLikedMap: new Map<number, boolean>(),
  getLikeCount: (postId: number): number =>
    likeMockStore.likeCountMap.get(postId) ?? 3,
  getIsLiked: (postId: number): boolean =>
    likeMockStore.isLikedMap.get(postId) ?? false,
}

export const MOCK_CATEGORIES = [
  { id: 1, name: '전체 게시판' },
  { id: 2, name: '공지사항' },
  { id: 3, name: '자유 게시판' },
  { id: 4, name: '일상 공유' },
  { id: 5, name: '개발 지식 공유' },
  { id: 6, name: '취업 정보 공유' },
  { id: 7, name: '프로젝트 구인' },
]

let nextPostId = 1001

/** 새로 작성된 게시글을 핸들러 간 공유하기 위한 in-memory 스토어 */
export const postMockStore = {
  posts: new Map<number, PostDetailResponse>(),

  add(data: { title: string; content: string; category_id: number }): number {
    const id = nextPostId++
    const category = MOCK_CATEGORIES.find((c) => c.id === data.category_id)
    const now = new Date().toISOString()
    postMockStore.posts.set(id, {
      id,
      title: data.title,
      content: data.content,
      category_id: data.category_id,
      category_name: category?.name ?? '기타',
      author: { id: 99, nickname: '테스트유저', profile_img_url: null },
      view_count: 0,
      like_count: 0,
      created_at: now,
      updated_at: now,
      comment_count: 0,
      is_liked: false,
    })
    return id
  },

  get(id: number): PostDetailResponse | undefined {
    return postMockStore.posts.get(id)
  },

  /** PostListItem 형식으로 전체 목록 반환 (최신순) */
  getAll(): PostListItem[] {
    return Array.from(postMockStore.posts.values())
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        thumbnail: null,
        category: { id: p.category_id, name: p.category_name },
        author: {
          id: p.author.id,
          nickname: p.author.nickname,
          profile_image: p.author.profile_img_url,
        },
        created_at: p.created_at,
        view_count: p.view_count,
        like_count: p.like_count,
        comment_count: p.comment_count ?? 0,
      }))
  },
}
