import { TokenvestingAccount, getDecrementInstruction } from '@project/anchor'
import { useMutation } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { toastTx } from '@/components/toast-tx'
import { useTokenvestingAccountsInvalidate } from './use-tokenvesting-accounts-invalidate'

export function useTokenvestingDecrementMutation({
  account,
  tokenvesting,
}: {
  account: UiWalletAccount
  tokenvesting: TokenvestingAccount
}) {
  const invalidateAccounts = useTokenvestingAccountsInvalidate()
  const signer = useWalletUiSigner({ account })
  const signAndSend = useWalletUiSignAndSend()

  return useMutation({
    mutationFn: async () => await signAndSend(getDecrementInstruction({ tokenvesting: tokenvesting.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}
