import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { TokenvestingUiButtonInitialize } from './ui/tokenvesting-ui-button-initialize'
import { TokenvestingUiList } from './ui/tokenvesting-ui-list'
import { TokenvestingUiProgramExplorerLink } from './ui/tokenvesting-ui-program-explorer-link'
import { TokenvestingUiProgramGuard } from './ui/tokenvesting-ui-program-guard'

export default function TokenvestingFeature() {
  const { account } = useSolana()

  return (
    <TokenvestingUiProgramGuard>
      <AppHero
        title="Tokenvesting"
        subtitle={
          account
            ? "Initialize a new tokenvesting onchain by clicking the button. Use the program's methods (increment, decrement, set, and close) to change the state of the account."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <TokenvestingUiProgramExplorerLink />
        </p>
        {account ? (
          <TokenvestingUiButtonInitialize account={account} />
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletDropdown />
          </div>
        )}
      </AppHero>
      {account ? <TokenvestingUiList account={account} /> : null}
    </TokenvestingUiProgramGuard>
  )
}
