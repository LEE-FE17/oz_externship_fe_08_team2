import { useEffect } from 'react'
import api from '@/api/instance'
import { RouterProvider } from '@/providers/RouterProvider'
import { useAuthStore } from '@/stores/authStore'

function AuthInitializer() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)

  useEffect(() => {
    if (isAuthenticated) return
    api
      .get('/api/v1/accounts/me/')
      .then(({ data }) => {
        login({
          id: data.id,
          nickname: data.nickname,
          email: data.email,
          profileImage: data.profile_img_url ?? null,
        })
      })
      .catch(() => {})
  }, [isAuthenticated, login])

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
