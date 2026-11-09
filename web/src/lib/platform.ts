import type { Role } from '@/api/types'

export type Area = 'empleo' | 'obras' | 'common'

/** Which platform a path belongs to: the header, the logo and the links follow it. */
export function areaOf(pathname: string, role?: Role | null): Area {
  if (/^\/(empleo|trabajador|empresa)(\/|$)/.test(pathname)) return 'empleo'
  if (/^\/(obras|cliente|profesional)(\/|$)/.test(pathname)) return 'obras'
  if (role === 'worker' || role === 'employer') return 'empleo'
  if (role === 'client' || role === 'provider') return 'obras'
  return 'common'
}
