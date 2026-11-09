import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Applicant, Job, MyApplication, OwnJob, Paginated, User, WorkerCard, WorkerProfile, EmployerProfile } from './types'

export interface JobFilters {
  q?: string
  trade?: string
  province?: string
  contract_type?: string
  page?: number
}

const clean = <T extends object>(params: T) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null))

// ── Public board ──────────────────────────────────────────────────────────
export function useJobs(filters: JobFilters) {
  return useQuery<Paginated<Job>>({
    queryKey: ['jobs', filters],
    queryFn: async () => (await api.get('/jobs', { params: clean(filters) })).data,
    placeholderData: keepPreviousData,
  })
}

export function useJob(id: number | undefined) {
  return useQuery<Job>({
    queryKey: ['job', id],
    queryFn: async () => (await api.get(`/jobs/${id}`)).data.data,
    enabled: !!id,
  })
}

// ── Workers ───────────────────────────────────────────────────────────────
export function useApply(jobId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (message?: string) => (await api.post(`/jobs/${jobId}/apply`, { message })).data.data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['job', jobId] })
      void qc.invalidateQueries({ queryKey: ['jobs'] })
      void qc.invalidateQueries({ queryKey: ['my-applications'] })
    },
  })
}

export function useMyApplications(enabled = true) {
  return useQuery<MyApplication[]>({
    queryKey: ['my-applications'],
    queryFn: async () => (await api.get('/worker/applications')).data.data,
    enabled,
  })
}

export function useWithdraw() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/worker/applications/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['my-applications'] }),
  })
}

export function useSaveWorkerProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<WorkerProfile, 'visible'> & { visible: boolean }) => (await api.put('/worker/profile', payload)).data.data as User,
    onSuccess: (user) => qc.setQueryData(['user'], user),
  })
}

// ── Employers ─────────────────────────────────────────────────────────────
export function useSaveEmployerProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<EmployerProfile, never>) => (await api.put('/employer/profile', payload)).data.data as User,
    onSuccess: (user) => qc.setQueryData(['user'], user),
  })
}

export function useOwnJobs(enabled = true) {
  return useQuery<OwnJob[]>({
    queryKey: ['own-jobs'],
    queryFn: async () => (await api.get('/employer/jobs')).data.data,
    enabled,
  })
}

export function useOwnJob(id: number | undefined) {
  return useQuery<OwnJob>({
    queryKey: ['own-job', id],
    queryFn: async () => (await api.get(`/employer/jobs/${id}`)).data.data,
    enabled: !!id,
  })
}

export type JobPayload = Pick<
  Job,
  'title' | 'trade' | 'province' | 'city' | 'contract_type' | 'workday' | 'salary_min' | 'salary_max' | 'salary_period' | 'start' | 'vacancies' | 'experience_min' | 'description' | 'requirements' | 'requires_tpc' | 'requires_license' | 'accommodation'
>

export function useSaveJob(id?: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: JobPayload) =>
      (id ? await api.put(`/employer/jobs/${id}`, payload) : await api.post('/employer/jobs', payload)).data.data as OwnJob,
    onSuccess: (job) => {
      qc.setQueryData(['own-job', job.id], job)
      void qc.invalidateQueries({ queryKey: ['own-jobs'] })
    },
  })
}

export function useJobStatus(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (action: 'close' | 'reopen') => (await api.post(`/employer/jobs/${id}/${action}`)).data.data as OwnJob,
    onSuccess: (job) => {
      qc.setQueryData(['own-job', job.id], job)
      void qc.invalidateQueries({ queryKey: ['own-jobs'] })
    },
  })
}

export function useApplicants(jobId: number | undefined) {
  return useQuery<{ data: Applicant[]; meta: { unlocked: boolean; unlocked_until: string | null } }>({
    queryKey: ['applicants', jobId],
    queryFn: async () => (await api.get(`/employer/jobs/${jobId}/applications`)).data,
    enabled: !!jobId,
  })
}

export function useApplicantStatus(jobId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Applicant['status'] }) => (await api.patch(`/employer/applications/${id}`, { status })).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['applicants', jobId] }),
  })
}

export function useOpenApplicantChat() {
  return useMutation({
    mutationFn: async (applicationId: number) => (await api.post(`/employer/applications/${applicationId}/chat`)).data.data as { conversation_id: number },
  })
}

export interface WorkerFilters {
  q?: string
  trade?: string
  province?: string
  availability?: string
  has_tpc?: boolean
  min_years?: number
  page?: number
}

export function useWorkers(filters: WorkerFilters) {
  return useQuery<Paginated<WorkerCard>>({
    queryKey: ['workers', filters],
    queryFn: async () => (await api.get('/employer/workers', { params: clean({ ...filters, has_tpc: filters.has_tpc ? 1 : undefined }) })).data,
    placeholderData: keepPreviousData,
  })
}

export function useContactWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (workerId: number) => (await api.post(`/employer/workers/${workerId}/contact`)).data.data as { conversation_id: number; credits: number },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workers'] })
      void qc.invalidateQueries({ queryKey: ['summary'] })
      void qc.invalidateQueries({ queryKey: ['user'] })
    },
  })
}
