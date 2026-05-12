import axios from 'axios'
import { setupInterceptors } from './interceptors'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc4NjY0NjQ0LCJpYXQiOjE3Nzg1NzgyNDQsImp0aSI6IjU3ZDRlZGU2MmY5YzRlYjFiMGRjYmQzMTQ3MWRkOTc5IiwidXNlcl9pZCI6Mn0.l8U1DPbqsFkMXikbe4Hh0s9nKe-ddnBijKtm6MTB8fY`,
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
