import axios from 'axios'
import { setupInterceptors } from './interceptors'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc4ODM0MjM1LCJpYXQiOjE3Nzg3NDc4MzUsImp0aSI6IjE3NTcwMzU2NDY0NDRiZTViYzJhYTkwMTBjYmZjN2FmIiwidXNlcl9pZCI6Mjl9.c7uVVm0RNpHmCyX7z7uQ2np4D-1PKGAZbJ0qAcZHlnQ`,
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
