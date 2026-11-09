import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Order } from './types'

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/billing/orders')).data.data,
  })
}

export function useOrder(id: number | undefined, poll = false) {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => (await api.get(`/billing/orders/${id}`)).data.data,
    enabled: !!id,
    refetchInterval: (query) => (poll && query.state.data?.status === 'pending' ? 2_000 : false),
  })
}

export function useMovements() {
  return useQuery<{ id: number; delta: number; reason: string; reference: string | null; at: string }[]>({
    queryKey: ['movements'],
    queryFn: async () => (await api.get('/billing/movements')).data.data,
  })
}

/** Start a payment and go: to Stripe, or to the demo's payment screen. */
export function useCheckout() {
  return useMutation({
    mutationFn: async (payload: { product: string; job_post_id?: number }) =>
      (await api.post('/billing/checkout', payload)).data.data as { order_id: number; url: string; simulated: boolean },
    onSuccess: ({ url, simulated, order_id }) => {
      if (simulated) {
        window.location.assign(`/pago/simulado/${order_id}`)
      } else {
        window.location.assign(url)
      }
    },
  })
}

export function useSimulatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: number) => (await api.post(`/billing/orders/${orderId}/simulate`)).data.data as Order,
    onSuccess: (order) => {
      qc.setQueryData(['order', order.id], order)
      void qc.invalidateQueries()
    },
  })
}
