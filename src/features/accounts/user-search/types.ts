export interface UserSearchResult {
  id: number
  nickname: string
  profile_img_url: string | null
}

export interface UserSearchResponse {
  results: UserSearchResult[]
}
