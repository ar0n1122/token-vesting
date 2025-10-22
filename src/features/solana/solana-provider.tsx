'use client'

import {useSolana} from '@/components/solana/use-solana'
import {AnchorProvider} from '@coral-xyz/anchor'
import {useMemo} from 'react'

export function useAnchorProvider() {
    const {client, wallet} = useSolana()

    return useMemo(() => {
        if (!wallet || !client) {
            return null
        }

        // Use the client's rpc instead of creating a new connection
        return new AnchorProvider(
            client.rpc as unknown as AnchorProvider['connection'],
            wallet as unknown as AnchorProvider['wallet'],
            {
                commitment: 'confirmed',
                preflightCommitment: 'processed'
            }
        )
    }, [client, wallet])
}