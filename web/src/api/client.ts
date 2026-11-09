import axios, { isAxiosError } from 'axios'
import i18n from '@/i18n'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
})

let csrfReady = false

/** Sanctum SPA auth: the CSRF cookie, once, before the first write. */
export async function ensureCsrf() {
  if (csrfReady) return
  await axios.get(`${API_URL}/sanctum/csrf-cookie`, { withCredentials: true })
  csrfReady = true
}

api.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toLowerCase()
  if (method !== 'get' && method !== 'head') await ensureCsrf()
  config.headers['Accept-Language'] = i18n.language?.startsWith('en') ? 'en' : 'es'
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 419) csrfReady = false
    return Promise.reject(error)
  },
)

/** The server's own message, or a generic one. */
export function errorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    if (message) return message
  }
  return fallback
}

/** The machine code a 402/409 carries ("offer_locked", "insufficient_credits"…). */
export function errorCode(error: unknown): string | null {
  if (isAxiosError(error)) return ((error.response?.data as { code?: string } | undefined)?.code) ?? null
  return null
}

/** Laravel's 422: field → first message. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (isAxiosError(error) && error.response?.status === 422) {
    const errors = (error.response.data as { errors?: Record<string, string[]> }).errors ?? {}
    return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v[0]]))
  }
  return {}
}
