import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Lead, OwnProject, Paginated, ProviderCard, ProviderProfile, User } from './types'

const clean = <T extends object>(params: T) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null))

export function useCompanies(filters: { category?: string; province?: string; page?: number }) {
  return useQuery<Paginated<ProviderCard>>({
    queryKey: ['companies', filters],
    queryFn: async () => (await api.get('/obras/companies', { params: clean(filters) })).data,
    placeholderData: keepPreviousData,
  })
}

// ── Clients ───────────────────────────────────────────────────────────────
export function useOwnProjects() {
  return useQuery<OwnProject[]>({
    queryKey: ['own-projects'],
    queryFn: async () => (await api.get('/client/projects')).data.data,
  })
}

export function useOwnProject(id: number | undefined) {
  return useQuery<OwnProject>({
    queryKey: ['own-project', id],
    queryFn: async () => (await api.get(`/client/projects/${id}`)).data.data,
    enabled: !!id,
    refetchInterval: 60_000,
  })
}

export type ProjectPayload = Pick<OwnProject, 'title' | 'category' | 'description' | 'province' | 'city' | 'postal_code' | 'property_type' | 'budget' | 'timing'>

export function useSaveProject(id?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ProjectPayload) =>
      (id ? await api.put(`/client/projects/${id}`, payload) : await api.post('/client/projects', payload)).data.data as OwnProject,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['own-projects'] }),
  })
}

export function useCloseProject(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post(`/client/projects/${id}/close`)).data.data as OwnProject,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['own-project', id] })
      void qc.invalidateQueries({ queryKey: ['own-projects'] })
    },
  })
}

// ── Providers ─────────────────────────────────────────────────────────────
export function useSaveProviderProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ProviderProfile) => (await api.put('/provider/profile', payload)).data.data as User,
    onSuccess: (user) => qc.setQueryData(['user'], user),
  })
}

export function useLeads(filters: { category?: string; province?: string; matching?: boolean; page?: number }) {
  return useQuery<Paginated<Lead>>({
    queryKey: ['leads', filters],
    queryFn: async () => (await api.get('/provider/leads', { params: clean({ ...filters, matching: filters.matching ? 1 : undefined }) })).data,
    placeholderData: keepPreviousData,
  })
}

export function useLead(id: number | undefined) {
  return useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: async () => (await api.get(`/provider/leads/${id}`)).data.data,
    enabled: !!id,
  })
}

export function useUnlockLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => (await api.post(`/provider/leads/${id}/unlock`)).data.data as Lead,
    onSuccess: (lead) => {
      qc.setQueryData(['lead', lead.id], lead)
      void qc.invalidateQueries({ queryKey: ['leads'] })
      void qc.invalidateQueries({ queryKey: ['unlocked-leads'] })
      void qc.invalidateQueries({ queryKey: ['summary'] })
      void qc.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useUnlockedLeads() {
  return useQuery<Lead[]>({
    queryKey: ['unlocked-leads'],
    queryFn: async () => (await api.get('/provider/unlocked')).data.data,
  })
}
