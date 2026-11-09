import { useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { Meta } from './types'

/** Trades, provinces, categories and prices: fetched once per session. */
export function useMeta() {
  return useQuery<Meta>({
    queryKey: ['meta'],
    queryFn: async () => (await api.get('/meta')).data.data,
    staleTime: Infinity,
  })
}

export function useProvinceName() {
  const { data } = useMeta()
  return (code: string | null | undefined) => data?.provinces.find((p) => p.code === code)?.name ?? ''
}
