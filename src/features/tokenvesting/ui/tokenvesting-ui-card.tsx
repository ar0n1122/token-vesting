import { TokenvestingAccount } from '@project/anchor'
import { ellipsify, UiWalletAccount } from '@wallet-ui/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { TokenvestingUiButtonClose } from './tokenvesting-ui-button-close'
import { TokenvestingUiButtonDecrement } from './tokenvesting-ui-button-decrement'
import { TokenvestingUiButtonIncrement } from './tokenvesting-ui-button-increment'
import { TokenvestingUiButtonSet } from './tokenvesting-ui-button-set'

export function TokenvestingUiCard({ account, tokenvesting }: { account: UiWalletAccount; tokenvesting: TokenvestingAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tokenvesting: {tokenvesting.data.count}</CardTitle>
        <CardDescription>
          Account: <AppExplorerLink address={tokenvesting.address} label={ellipsify(tokenvesting.address)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-evenly">
          <TokenvestingUiButtonIncrement account={account} tokenvesting={tokenvesting} />
          <TokenvestingUiButtonSet account={account} tokenvesting={tokenvesting} />
          <TokenvestingUiButtonDecrement account={account} tokenvesting={tokenvesting} />
          <TokenvestingUiButtonClose account={account} tokenvesting={tokenvesting} />
        </div>
      </CardContent>
    </Card>
  )
}
