import { useSolana } from '@/components/solana/use-solana'
import { useQuery } from '@tanstack/react-query'
import { getTokenvestingProgramAccounts } from '@project/anchor'
import { useTokenvestingAccountsQueryKey } from './use-tokenvesting-accounts-query-key'

export function useTokenvestingAccountsQuery() {
  const { client } = useSolana()

  return useQuery({
    queryKey: useTokenvestingAccountsQueryKey(),
    queryFn: async () => await getTokenvestingProgramAccounts(client.rpc),
  })
}
