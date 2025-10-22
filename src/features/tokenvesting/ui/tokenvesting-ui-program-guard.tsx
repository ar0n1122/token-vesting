'use client'

import {ReactNode} from 'react'
import {useVestingProgram} from '../tokenvesting-data-access'
import {AppAlert} from '@/components/app-alert'

export function TokenvestingUiProgramGuard({children}: {children: ReactNode}) {
    const {getProgramAccount} = useVestingProgram()

    if (getProgramAccount.isLoading) {
        return <div className="text-center">Loading program...</div>
    }

    if (getProgramAccount.isError) {
        return (
            <AppAlert>
                <div>
                    <p className="mb-2">Program account not found.</p>
                    <p>Make sure you have deployed the program and are on the correct cluster.</p>
                </div>
            </AppAlert>
        )
    }

    return <>{children}</>
}