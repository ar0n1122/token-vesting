import { TokenvestingAccount, getCloseInstruction } from '@project/anchor'
import { useMutation } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { toastTx } from '@/components/toast-tx'
import { useTokenvestingAccountsInvalidate } from './use-tokenvesting-accounts-invalidate'

export function useTokenvestingCloseMutation({ account, tokenvesting }: { account: UiWalletAccount; tokenvesting: TokenvestingAccount }) {
  const invalidateAccounts = useTokenvestingAccountsInvalidate()
  const signAndSend = useWalletUiSignAndSend()
  const signer = useWalletUiSigner({ account })

  return useMutation({
    mutationFn: async () => {
      return await signAndSend(getCloseInstruction({ payer: signer, tokenvesting: tokenvesting.address }), signer)
    },
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}
