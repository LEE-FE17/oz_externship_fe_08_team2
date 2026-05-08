import axios from 'axios'
import { setupInterceptors } from './interceptors'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc4MzAyMDAzLCJpYXQiOjE3NzgyMTU2MDMsImp0aSI6ImIwMDhmN2YzOTA4YzRhN2FhMTdmMTAxMTJhN2U2ZmQ4IiwidXNlcl9pZCI6M30.GOonfK-ientjyd7eTIThTIFwHU0avaIXtqiOWaUkM-Y`,
  },
  withCredentials: true,
})

setupInterceptors(api)

export default api
