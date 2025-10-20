import { TokenvestingAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useTokenvestingCloseMutation } from '@/features/tokenvesting/data-access/use-tokenvesting-close-mutation'

export function TokenvestingUiButtonClose({ account, tokenvesting }: { account: UiWalletAccount; tokenvesting: TokenvestingAccount }) {
  const closeMutation = useTokenvestingCloseMutation({ account, tokenvesting })

  return (
    <Button
      variant="destructive"
      onClick={() => {
        if (!window.confirm('Are you sure you want to close this account?')) {
          return
        }
        return closeMutation.mutateAsync()
      }}
      disabled={closeMutation.isPending}
    >
      Close
    </Button>
  )
}
