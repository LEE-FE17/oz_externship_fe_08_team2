import axios from 'axios'
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/stores/authStore'

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export async function refreshAccessToken(): Promise<string> {
  const { data } = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/api/v1/accounts/me/refresh`,
    {},
    { withCredentials: true }
  )
  const newToken: string = data.access_token
  localStorage.setItem('accessToken', newToken)
  return newToken
}

const redirectToLogin = () => {
  useAuthStore.getState().logout()
  localStorage.removeItem('accessToken')

  if (window.location.pathname !== ROUTES.AUTH.LOGIN) {
    window.location.href = ROUTES.AUTH.LOGIN
  }
}

export function setupInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalConfig = error.config as RetryConfig

      if (!error.response || !originalConfig) {
        return Promise.reject(error)
      }

      if (error.response.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true

        try {
          const newToken = await refreshAccessToken()
          originalConfig.headers.Authorization = `Bearer ${newToken}`
          return instance(originalConfig)
        } catch (refreshError) {
          redirectToLogin()
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    }
  )
}
