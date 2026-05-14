import axios from 'axios'
import { setupInterceptors } from './interceptors'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc4ODIwNTMzLCJpYXQiOjE3Nzg3MzQxMzMsImp0aSI6IjZiMDY2NjBlYzJkODQzODk5ZjQyYjAzNzQwNDJjYmYyIiwidXNlcl9pZCI6M30.XaD0d7vyDZ6czyK5x0bYbnp3L9HK_p8IbrXwPCiDcuY`,
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
