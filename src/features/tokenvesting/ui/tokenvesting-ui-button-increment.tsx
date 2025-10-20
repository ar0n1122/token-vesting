import { TokenvestingAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'
import { useTokenvestingIncrementMutation } from '../data-access/use-tokenvesting-increment-mutation'

export function TokenvestingUiButtonIncrement({ account, tokenvesting }: { account: UiWalletAccount; tokenvesting: TokenvestingAccount }) {
  const incrementMutation = useTokenvestingIncrementMutation({ account, tokenvesting })

  return (
    <Button variant="outline" onClick={() => incrementMutation.mutateAsync()} disabled={incrementMutation.isPending}>
      Increment
    </Button>
  )
}
