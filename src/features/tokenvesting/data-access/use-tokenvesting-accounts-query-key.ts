import { useSolana } from '@/components/solana/use-solana'

export function useTokenvestingAccountsQueryKey() {
  const { cluster } = useSolana()

  return ['tokenvesting', 'accounts', { cluster }]
}
