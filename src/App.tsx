import { useEffect } from 'react'
import { RouterProvider } from '@/providers/RouterProvider'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUser } from '@/features/accounts/me'

function AuthInitializer() {
  const login = useAuthStore((state) => state.login)
  const setInitialized = useAuthStore((state) => state.setInitialized)
  const { data, isError } = useCurrentUser()

  useEffect(() => {
    if (data) {
      login({
        id: data.id,
        nickname: data.nickname,
        email: data.email,
        profileImage: data.profile_img_url ?? null,
      })
    } else if (isError) {
      setInitialized()
    }
  }, [data, login, isError, setInitialized])

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
