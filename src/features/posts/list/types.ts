export type PostSortOption =
  | 'latest'
  | 'oldest'
  | 'most_views'
  | 'most_likes'
  | 'most_comments'

export type PostSearchFilter =
  | 'author'
  | 'title'
  | 'content'
  | 'title_or_content'

export interface PostListParams {
  page?: number
  page_size?: number
  search?: string
  search_filter?: PostSearchFilter
  category_id?: number
  sort?: PostSortOption
}

export interface PostListItem {
  id: number
  title: string
  content: string
  thumbnail_img_url?: string | null
  category: number
  author: {
    id: number
    nickname: string
    profile_img_url: string | null
  }
  created_at: string
  view_count: number
  like_count: number
  comment_count: number
}

export interface PostListResponse {
  count: number
  next: string | null
  previous: string | null
  results: PostListItem[]
}
