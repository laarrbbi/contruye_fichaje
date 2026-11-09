import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Role, User } from './types'

export interface RegisterPayload {
  role: Exclude<Role, 'admin'>
  name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
  province: string
  city?: string
  company_name?: string
  trade?: string
  categories?: string[]
  locale?: string
}

export function useUser() {
  return useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/me')
        return data.data as User
      } catch {
        return null
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => (await api.post('/login', payload)).data.data as User,
    onSuccess: (user) => qc.setQueryData(['user'], user),
  })
}

export function useRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => (await api.post('/register', payload)).data.data as User,
    onSuccess: (user) => qc.setQueryData(['user'], user),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post('/logout')
    },
    onSuccess: () => {
      qc.setQueryData(['user'], null)
      qc.clear()
    },
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Pick<User, 'name' | 'phone' | 'province' | 'city' | 'locale'>>) => (await api.patch('/me', payload)).data.data as User,
    onSuccess: (user) => qc.setQueryData(['user'], user),
  })
}

/** The header's badges: unread messages, new applicants, credits. */
export function useSummary(enabled: boolean) {
  return useQuery<{ unread: number; new_applications: number; credits: number; pass_until: string | null }>({
    queryKey: ['summary'],
    queryFn: async () => (await api.get('/me/summary')).data.data,
    enabled,
    refetchInterval: 30_000,
  })
}

/** Where each account lands after signing in. */
export function homeFor(role: Role | undefined): string {
  switch (role) {
    case 'worker':
      return '/trabajador'
    case 'employer':
      return '/empresa'
    case 'client':
      return '/cliente'
    case 'provider':
      return '/profesional'
    case 'admin':
      return '/admin'
    default:
      return '/'
  }
}
