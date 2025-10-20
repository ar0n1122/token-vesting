import { TokenvestingAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useTokenvestingSetMutation } from '@/features/tokenvesting/data-access/use-tokenvesting-set-mutation'

export function TokenvestingUiButtonSet({ account, tokenvesting }: { account: UiWalletAccount; tokenvesting: TokenvestingAccount }) {
  const setMutation = useTokenvestingSetMutation({ account, tokenvesting })

  return (
    <Button
      variant="outline"
      onClick={() => {
        const value = window.prompt('Set value to:', tokenvesting.data.count.toString() ?? '0')
        if (!value || parseInt(value) === tokenvesting.data.count || isNaN(parseInt(value))) {
          return
        }
        return setMutation.mutateAsync(parseInt(value))
      }}
      disabled={setMutation.isPending}
    >
      Set
    </Button>
  )
}
