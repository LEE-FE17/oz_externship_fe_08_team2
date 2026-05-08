import { useEffect } from 'react'
import axios from 'axios'
import { RouterProvider } from '@/providers/RouterProvider'
import { useAuthStore } from '@/stores/authStore'

function AuthInitializer() {
  const login = useAuthStore((state) => state.login)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    axios
      .get('/api/v1/accounts/me/', { headers })
      .then(({ data }) => {
        login({
          id: data.id,
          nickname: data.nickname,
          email: data.email,
          profileImage: data.profile_img_url ?? null,
        })
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

function App() {
  return (
    <>
      <AuthInitializer />
      <RouterProvider />
    </>
  )
}

export default App
