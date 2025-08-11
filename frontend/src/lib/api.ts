import axios from 'axios'

// Centralized Axios instance with base URL and credentials
export const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000',
  withCredentials: true,
})
