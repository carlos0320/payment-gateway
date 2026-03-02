import axios from 'axios'
const baseURL = import.meta.env.DEV
  ? '/api' // uses Vite proxy to localhost:3000
  : import.meta.env.VI<TE_API_BASE_URL // API Gateway in production

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})