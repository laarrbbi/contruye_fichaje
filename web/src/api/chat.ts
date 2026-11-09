import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { ChatMessage, Conversation } from './types'

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => (await api.get('/conversations')).data.data,
    refetchInterval: 20_000,
  })
}

/** The open chat, polled every few seconds while on screen. */
export function useConversation(id: number | undefined) {
  return useQuery<{ data: ChatMessage[]; conversation: Conversation }>({
    queryKey: ['conversation', id],
    queryFn: async () => (await api.get(`/conversations/${id}`)).data,
    enabled: !!id,
    refetchInterval: 5_000,
  })
}

export function useSendMessage(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => (await api.post(`/conversations/${id}/messages`, { body })).data.data as ChatMessage,
    onSuccess: (message) => {
      qc.setQueryData<{ data: ChatMessage[]; conversation: Conversation }>(['conversation', id], (old) => (old ? { ...old, data: [...old.data, message] } : old))
      void qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
