import { useQueryClient } from '@tanstack/react-query'
import { useTokenvestingAccountsQueryKey } from './use-tokenvesting-accounts-query-key'

export function useTokenvestingAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = useTokenvestingAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}
