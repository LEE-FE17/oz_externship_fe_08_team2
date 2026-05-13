import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios'
import { useAuthStore } from '@/stores/authStore'
import axios from 'axios'

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
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
          const { data } = await axios.post(
            '/api/v1/accounts/me/refresh',
            {},
            {
              baseURL: import.meta.env.VITE_API_BASE_URL,
              withCredentials: true,
            }
          )

          const newToken = data.access_token
          localStorage.setItem('accessToken', newToken)

          if (originalConfig.headers) {
            originalConfig.headers.Authorization = `Bearer ${newToken}`
          }
          return instance(originalConfig)
        } catch (refreshError) {
          useAuthStore.getState().logout()
          localStorage.removeItem('accessToken')
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    }
  )
}
