import axios from 'axios'
import { setupInterceptors } from './interceptors'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc4ODIwMDI1LCJpYXQiOjE3Nzg3MzM2MjUsImp0aSI6IjM1NTdiMjY0NWY1ODRkMTJiODc1MTY5NDVmZGY4YWJiIiwidXNlcl9pZCI6M30.79Q-mzI3gcsG8B33MPTeqlSISTSAZf8iZ6_YsGQT7l0`,
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

setupInterceptors(api)

export default api
