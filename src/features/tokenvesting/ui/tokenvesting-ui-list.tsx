import { TokenvestingUiCard } from './tokenvesting-ui-card'
import { useTokenvestingAccountsQuery } from '@/features/tokenvesting/data-access/use-tokenvesting-accounts-query'
import { UiWalletAccount } from '@wallet-ui/react'

export function TokenvestingUiList({ account }: { account: UiWalletAccount }) {
  const tokenvestingAccountsQuery = useTokenvestingAccountsQuery()

  if (tokenvestingAccountsQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!tokenvestingAccountsQuery.data?.length) {
    return (
      <div className="text-center">
        <h2 className={'text-2xl'}>No accounts</h2>
        No accounts found. Initialize one to get started.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {tokenvestingAccountsQuery.data?.map((tokenvesting) => (
        <TokenvestingUiCard account={account} key={tokenvesting.address} tokenvesting={tokenvesting} />
      ))}
    </div>
  )
}
