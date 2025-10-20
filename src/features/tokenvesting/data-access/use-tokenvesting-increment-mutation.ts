import { TokenvestingAccount, getIncrementInstruction } from '@project/anchor'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { useMutation } from '@tanstack/react-query'
import { toastTx } from '@/components/toast-tx'
import { useTokenvestingAccountsInvalidate } from './use-tokenvesting-accounts-invalidate'

export function useTokenvestingIncrementMutation({
  account,
  tokenvesting,
}: {
  account: UiWalletAccount
  tokenvesting: TokenvestingAccount
}) {
  const invalidateAccounts = useTokenvestingAccountsInvalidate()
  const signAndSend = useWalletUiSignAndSend()
  const signer = useWalletUiSigner({ account })

  return useMutation({
    mutationFn: async () => await signAndSend(getIncrementInstruction({ tokenvesting: tokenvesting.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}
