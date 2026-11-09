export type Role = 'worker' | 'employer' | 'client' | 'provider' | 'admin'
export type Platform = 'empleo' | 'obras'

export interface WorkerProfile {
  trade: string
  other_trades: string[]
  years_experience: number
  headline: string | null
  bio: string | null
  availability: 'immediate' | 'two_weeks' | 'month' | 'employed'
  has_tpc: boolean
  prl_training: 'none' | '20h' | '60h' | '300h' | null
  driving_license: boolean
  own_vehicle: boolean
  work_permit: boolean
  willing_to_travel: boolean
  languages: string[]
  visible?: boolean
}

export interface EmployerProfile {
  company_name: string
  cif: string | null
  sector: string
  size: string | null
  description: string | null
  website: string | null
}

export interface ProviderProfile {
  company_name: string
  cif: string | null
  categories: string[]
  provinces: string[]
  description: string | null
  founded_year: number | null
  website: string | null
  listed: boolean
}

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  platform: Platform | null
  locale: string
  province: string | null
  city: string | null
  credits: number
  pass_until: string | null
  profile: WorkerProfile | EmployerProfile | ProviderProfile | null
}

export interface Meta {
  trade_groups: Record<string, string[]>
  provinces: { code: string; name: string }[]
  contract_types: string[]
  workdays: string[]
  salary_periods: string[]
  starts: string[]
  obras: {
    categories: string[]
    property_types: string[]
    timings: string[]
    budgets: Record<string, number>
    max_unlocks: number
  }
  products: Product[]
  vat_rate: number
  payments: { stripe: boolean; simulated: boolean }
}

export interface Product {
  key: string
  role: 'employer' | 'provider'
  price_c: number
  credits: number | null
  days: number | null
  needs_offer: boolean
  featured: boolean
  pass: boolean
}

export interface Job {
  id: number
  title: string
  trade: string
  province: string
  city: string | null
  contract_type: string
  workday: string
  salary_min: number | null
  salary_max: number | null
  salary_period: string
  start: string
  vacancies: number
  experience_min: number
  description: string
  requirements: string | null
  requires_tpc: boolean
  requires_license: boolean
  accommodation: boolean
  status: 'active' | 'closed'
  featured: boolean
  published_at: string
  expires_at: string
  company: { name: string; sector: string | null; size: string | null; description: string | null; website: string | null }
  applied?: boolean
  application_status?: string | null
  own?: boolean
}

export interface OwnJob extends Job {
  unlocked: boolean
  unlocked_until: string | null
  featured_until: string | null
  applications_count: number
  new_applications_count: number
  views: number
}

export interface WorkerCard {
  id: number
  name: string
  initials: string
  province: string | null
  city: string | null
  profile: WorkerProfile | null
  unlocked: boolean
  phone: string | null
  email: string | null
  conversation_id: number | null
  member_since: string | null
}

export interface Applicant {
  id: number
  status: 'new' | 'seen' | 'shortlisted' | 'rejected' | 'hired'
  message: string | null
  applied_at: string
  worker: WorkerCard
}

export interface MyApplication {
  id: number
  status: Applicant['status']
  message: string | null
  applied_at: string
  conversation_id: number | null
  job: Job
}

export interface OwnProject {
  id: number
  title: string
  category: string
  description: string
  province: string
  city: string
  postal_code: string | null
  property_type: string
  budget: string
  timing: string
  status: 'open' | 'closed'
  published_at: string
  expires_at?: string
  unlocks_count: number
  max_unlocks: number
  companies?: { unlocked_at: string; conversation_id: number | null; company: ProviderCard }[]
}

export interface Lead {
  id: number
  title: string
  category: string
  description: string
  province: string
  city: string
  postal_code: string | null
  property_type: string
  budget: string
  timing: string
  status: string
  published_at: string
  unlocks_count: number
  max_unlocks: number
  cost: number
  full: boolean
  unlocked: boolean
  conversation_id: number | null
  client: { name: string; initials: string; phone: string | null; email: string | null }
  unlocked_at?: string
  credits_spent?: number
  credits?: number
}

export interface ProviderCard {
  id: number
  company_name: string
  categories: string[]
  provinces: string[]
  description: string | null
  founded_year: number | null
  initials: string
}

export interface Conversation {
  id: number
  platform: Platform
  other: { id: number; name: string; person: string; role: Role; initials: string; phone: string | null; email: string | null }
  context: { type: 'job' | 'project'; id: number; title: string } | null
  last_message: { body: string; mine: boolean; at: string } | null
  unread: number
  last_message_at: string | null
  created_at: string
}

export interface ChatMessage {
  id: number
  body: string
  mine: boolean
  at: string
  read: boolean
}

export interface Order {
  id: number
  product: string
  job_post: { id: number; title: string } | null
  amount_c: number
  base_c: number
  vat_c: number
  status: 'pending' | 'paid' | 'cancelled'
  method: string
  created_at: string
  paid_at: string | null
}

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; total: number; credits?: number }
}
