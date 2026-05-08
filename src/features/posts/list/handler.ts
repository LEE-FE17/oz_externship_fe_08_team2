import { http, HttpResponse } from 'msw'
import type { PostListItem, PostListResponse, PostSortOption } from './types'
import { postMockStore } from '../mockStore'

const HOUR = 3_600_000

const CATEGORIES = [
  { id: 2, name: '공지사항' },
  { id: 3, name: '자유 게시판' },
  { id: 4, name: '일상 공유' },
  { id: 5, name: '개발 지식 공유' },
]

const AUTHORS = [
  { id: 1, nickname: '조회박', profile_image: null },
  { id: 2, nickname: '김하연', profile_image: null },
  { id: 3, nickname: 'HG', profile_image: null },
  { id: 4, nickname: '이민준', profile_image: null },
  { id: 5, nickname: '박수진', profile_image: null },
]

const now = Date.now()

const BASE_POSTS: PostListItem[] = [
  {
    id: 1,
    title: '데이터 분석 프로젝트 구합니다!',
    content:
      '저는 현재 기초전을 매우 앞서 프로젝트의 업도 섭보 게시하려고 합니다. 데이터 분석 경험 있으신 분들과 함께 사이드 프로젝트 진행하고 싶습니다.',
    thumbnail: null,
    category: { id: 7, name: '프로젝트 구인' },
    author: AUTHORS[0],
    created_at: new Date(now - 1 * HOUR).toISOString(),
    view_count: 60,
    like_count: 156,
    comment_count: 0,
  },
  {
    id: 2,
    title: '러닝 메이트 함께해요.',
    content:
      'https://www.codeit.kr/costudy/join/684e26b75155062e4621fe77힘께 공부해요. 매일 1시간씩 함께 공부할 러닝 메이트를 찾습니다.',
    thumbnail: null,
    category: { id: 7, name: '프로젝트 구인' },
    author: AUTHORS[1],
    created_at: new Date(now - 2 * HOUR).toISOString(),
    view_count: 60,
    like_count: 2,
    comment_count: 2,
  },
  {
    id: 3,
    title: '월요일 파이팅...',
    content:
      'https://www.codeit.kr/costudy/join/684e26b75155062e4621fe77 월요병 극복하는 법 공유해요. 다들 화이팅입니다!',
    thumbnail: 'https://picsum.photos/seed/monday/300/200',
    category: { id: 3, name: '자유 게시판' },
    author: AUTHORS[2],
    created_at: new Date(now - 3 * HOUR).toISOString(),
    view_count: 60,
    like_count: 2,
    comment_count: 2,
  },
]

const TITLES = [
  '리액트 공부 같이 하실 분 구해요',
  '취업 준비 스터디 모집합니다',
  '개발자 커리어 전환 후기 공유',
  '포트폴리오 피드백 부탁드립니다',
  '코딩 테스트 준비 어떻게 하세요?',
  'TypeScript 학습 로드맵 공유',
  '사이드 프로젝트 아이디어 있으신 분?',
  '개발 공부 루틴 공유해요',
  'CS 지식 공부 자료 추천해주세요',
  'Git 협업 방식 질문드립니다',
  '프론트엔드 면접 후기 공유',
  'Node.js 백엔드 스터디 모집',
  '알고리즘 스터디 같이 하실 분',
  '주니어 개발자 첫 취업 성공 후기',
  'VSCode 유용한 익스텐션 추천',
  'CSS 잘하는 방법 있을까요?',
  '오픈소스 기여 시작하는 방법',
  '클린코드 책 스터디 모집',
  'Docker 입문 자료 공유합니다',
  'AWS 자격증 취득 후기',
  '스타트업 vs 대기업 어디가 좋을까요',
  '재택근무 집중력 높이는 팁 공유',
  '개발자 사이드잡 경험 공유해요',
  'API 설계 베스트 프랙티스',
  '테스트 코드 작성 어떻게 시작할까요',
  '디자인 패턴 공부 자료 추천',
  '번아웃 극복 방법 공유해요',
  '프리랜서 개발자 경험담',
  '코드 리뷰 잘하는 방법',
  '신입 개발자 온보딩 경험 공유',
]

const CONTENTS = [
  '함께 공부하면서 서로 자극받고 성장할 수 있었으면 좋겠습니다. 관심 있으신 분은 댓글 달아주세요!',
  '혼자 공부하다 보면 동기부여가 떨어지더라고요. 같이 으쌰으쌰 해봐요.',
  '최근에 경험한 것들을 공유하고 싶어서 글 씁니다. 도움이 되셨으면 해요.',
  '여러분의 의견이 많이 도움이 됩니다. 피드백 환영합니다!',
  'https://github.com/example 참고해서 진행하고 있는데 더 좋은 방법 있을까요?',
  '정리한 내용을 공유합니다. 틀린 부분 있으면 댓글로 알려주세요.',
  '주말에 개인 프로젝트 진행 중인데 같이 하실 분 계신가요?',
  '매일 꾸준히 하는 게 중요한 것 같아요. 여러분만의 루틴은 어떻게 되시나요?',
]

const GENERATED_POSTS: PostListItem[] = Array.from({ length: 97 }, (_, i) => {
  const idx = i + 3
  const catIdx = idx % CATEGORIES.length
  const authorIdx = idx % AUTHORS.length
  const titleIdx = idx % TITLES.length
  const contentIdx = idx % CONTENTS.length
  const hasThumbnail = idx % 7 === 0

  return {
    id: idx + 1,
    title: TITLES[titleIdx],
    content: CONTENTS[contentIdx],
    thumbnail: hasThumbnail
      ? `https://picsum.photos/seed/${idx}/300/200`
      : null,
    category: CATEGORIES[catIdx],
    author: AUTHORS[authorIdx],
    created_at: new Date(now - (idx + 1) * HOUR).toISOString(),
    view_count: 10 + ((idx * 37) % 300),
    like_count: (idx * 13) % 80,
    comment_count: (idx * 7) % 30,
  }
})

const ALL_POSTS: PostListItem[] = [...BASE_POSTS, ...GENERATED_POSTS]

type SortFn = (a: PostListItem, b: PostListItem) => number

const SORT_FNS: Record<PostSortOption, SortFn> = {
  latest: (a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  oldest: (a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  most_views: (a, b) => b.view_count - a.view_count,
  most_likes: (a, b) => b.like_count - a.like_count,
  most_comments: (a, b) => b.comment_count - a.comment_count,
}

export const postListHandlers = [
  http.get('/api/v1/posts/', ({ request }) => {
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
    const pageSize = Math.max(
      1,
      Number(url.searchParams.get('page_size') ?? '10')
    )
    const sort = (url.searchParams.get('sort') ?? 'latest') as PostSortOption
    const categoryId = url.searchParams.get('category_id')
    const search = url.searchParams.get('search') ?? ''
    const searchFilter = url.searchParams.get('search_filter') ?? 'title'

    // 새로 작성된 게시글을 맨 앞에 합쳐서 처리
    let posts = [...postMockStore.getAll(), ...ALL_POSTS]

    // 카테고리 필터
    if (categoryId) {
      const catId = Number(categoryId)
      posts = posts.filter((p) => p.category.id === catId)
    }

    // 검색 필터
    if (search) {
      const q = search.toLowerCase()
      posts = posts.filter((p) => {
        if (searchFilter === 'title') return p.title.toLowerCase().includes(q)
        if (searchFilter === 'content')
          return p.content.toLowerCase().includes(q)
        if (searchFilter === 'author')
          return p.author.nickname.toLowerCase().includes(q)
        return (
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q)
        )
      })
    }

    // 정렬
    const sortFn = SORT_FNS[sort] ?? SORT_FNS.latest
    posts.sort(sortFn)

    // 페이지네이션
    const count = posts.length
    const start = (page - 1) * pageSize
    const results = posts.slice(start, start + pageSize)

    const response: PostListResponse = {
      count,
      next: start + pageSize < count ? `/api/v1/posts/?page=${page + 1}` : null,
      previous: page > 1 ? `/api/v1/posts/?page=${page - 1}` : null,
      results,
    }

    return HttpResponse.json(response)
  }),
]
