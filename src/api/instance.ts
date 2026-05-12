import axios from 'axios'
import { setupInterceptors } from './interceptors'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc4MzEzMTEwLCJpYXQiOjE3NzgyMjY3MTAsImp0aSI6IjY4MzA2ZTllMDM0YzQzZDVhZWE1ZTZhMjBiNzAzNzljIiwidXNlcl9pZCI6M30.iK0swBqaOi-8J1r-EbLtWEWC4XyCykuVnedKuQOtTrA`,
  },
  withCredentials: true,
})

export const baseApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

setupInterceptors(api, baseApi)

export default api
