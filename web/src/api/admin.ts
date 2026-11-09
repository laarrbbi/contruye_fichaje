import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Order, OwnJob, OwnProject, Paginated, User } from './types'

export interface AdminStats {
  users: Record<string, number>
  jobs_live: number
  jobs_unlocked: number
  applications: number
  applications_month: number
  projects_open: number
  project_unlocks: number
  revenue_c: number
  revenue_month_c: number
  revenue_by_product: { product: string; c: number; n: number }[]
}

export const useAdminStats = () =>
  useQuery<AdminStats>({ queryKey: ['admin', 'stats'], queryFn: async () => (await api.get('/admin/stats')).data.data })

export const useAdminUsers = (filters: { q?: string; role?: string; page?: number }) =>
  useQuery<Paginated<User & { blocked: boolean; created_at: string }>>({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => (await api.get('/admin/users', { params: filters })).data,
    placeholderData: keepPreviousData,
  })

export const useAdminOrders = (page: number) =>
  useQuery<Paginated<Order & { user: { id: number; name: string; email: string; role: string } }>>({
    queryKey: ['admin', 'orders', page],
    queryFn: async () => (await api.get('/admin/orders', { params: { page } })).data,
    placeholderData: keepPreviousData,
  })

export const useAdminJobs = (page: number) =>
  useQuery<Paginated<OwnJob>>({
    queryKey: ['admin', 'jobs', page],
    queryFn: async () => (await api.get('/admin/jobs', { params: { page } })).data,
    placeholderData: keepPreviousData,
  })

export const useAdminProjects = (page: number) =>
  useQuery<Paginated<OwnProject & { client: { id: number; name: string; email: string } }>>({
    queryKey: ['admin', 'projects', page],
    queryFn: async () => (await api.get('/admin/projects', { params: { page } })).data,
    placeholderData: keepPreviousData,
  })

export function useAdminAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ path, body }: { path: string; body?: object }) => (await api.post(`/admin/${path}`, body)).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}
