import { TOKENVESTING_PROGRAM_ADDRESS } from '@project/anchor'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { ellipsify } from '@wallet-ui/react'

export function TokenvestingUiProgramExplorerLink() {
  return <AppExplorerLink address={TOKENVESTING_PROGRAM_ADDRESS} label={ellipsify(TOKENVESTING_PROGRAM_ADDRESS)} />
}
