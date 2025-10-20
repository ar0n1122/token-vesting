import { Button } from '@/components/ui/button'
import { UiWalletAccount } from '@wallet-ui/react'

import { useTokenvestingInitializeMutation } from '@/features/tokenvesting/data-access/use-tokenvesting-initialize-mutation'

export function TokenvestingUiButtonInitialize({ account }: { account: UiWalletAccount }) {
  const mutationInitialize = useTokenvestingInitializeMutation({ account })

  return (
    <Button onClick={() => mutationInitialize.mutateAsync()} disabled={mutationInitialize.isPending}>
      Initialize Tokenvesting {mutationInitialize.isPending && '...'}
    </Button>
  )
}
