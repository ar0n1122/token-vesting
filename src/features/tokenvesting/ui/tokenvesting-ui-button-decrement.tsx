import { TokenvestingAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useTokenvestingDecrementMutation } from '../data-access/use-tokenvesting-decrement-mutation'

export function TokenvestingUiButtonDecrement({ account, tokenvesting }: { account: UiWalletAccount; tokenvesting: TokenvestingAccount }) {
  const decrementMutation = useTokenvestingDecrementMutation({ account, tokenvesting })

  return (
    <Button variant="outline" onClick={() => decrementMutation.mutateAsync()} disabled={decrementMutation.isPending}>
      Decrement
    </Button>
  )
}
