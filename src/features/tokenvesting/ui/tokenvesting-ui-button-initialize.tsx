'use client'

import {Button} from '@/components/ui/button'
import {useVestingProgram} from '../tokenvesting-data-access'

export function TokenvestingUiButtonInitialize({account: _account}: {account: string}) {
    const {createVestingAccount} = useVestingProgram()

    const handleClick = () => {
        const companyName = prompt('Enter company name:')
        const mint = prompt('Enter mint address:')

        if (companyName && mint) {
            createVestingAccount.mutateAsync({companyName, mint})
        }
    }

    return (
        <Button
            onClick={handleClick}
            disabled={createVestingAccount.isPending}
        >
            {createVestingAccount.isPending ? 'Creating...' : 'Create Vesting Account'}
        </Button>
    )
}