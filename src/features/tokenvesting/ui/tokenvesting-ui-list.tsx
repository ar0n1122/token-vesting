'use client'

import {useVestingProgram} from '../tokenvesting-data-access'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'

export function TokenvestingUiList({account: _account}: {account: string}) {
    const {accounts} = useVestingProgram()

    if (accounts.isLoading) {
        return <div className="text-center">Loading vesting accounts...</div>
    }

    if (accounts.isError) {
        return <div className="text-center text-red-500">Error loading accounts</div>
    }

    if (!accounts.data?.length) {
        return <div className="text-center">No vesting accounts found</div>
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Vesting Accounts</h2>
            <div className="grid gap-4">
                {accounts.data.map((account: {publicKey?: {toString(): string}}, index: number) => (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle>Account #{index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Address: {account.publicKey?.toString() || 'Unknown'}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}