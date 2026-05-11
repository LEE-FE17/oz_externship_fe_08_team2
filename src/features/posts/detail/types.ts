export interface PostDetailAuthor {
  id: number
  nickname: string
  profile_img_url: string | null
}

export interface PostDetailResponse {
  id: number
  title: string
  author: PostDetailAuthor
  category_id: number
  category_name: string
  content: string
  view_count: number
  like_count: number
  created_at: string
  updated_at: string
  is_liked: boolean
  comment_count: number
}
