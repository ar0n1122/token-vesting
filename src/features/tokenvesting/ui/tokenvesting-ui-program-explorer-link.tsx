'use client'

import {AppExplorerLink} from '@/components/app-explorer-link'
import {TOKENVESTING_PROGRAM_ID} from '../../../lib/tokenvesting-anchor'

export function TokenvestingUiProgramExplorerLink() {
    return (
        <AppExplorerLink
            address={TOKENVESTING_PROGRAM_ID.toString()}
            label="View Program on Explorer"
        />
    )
}