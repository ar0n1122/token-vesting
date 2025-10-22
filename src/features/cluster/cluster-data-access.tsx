'use client'

import {useSolana} from '@/components/solana/use-solana'

export function useCluster() {
    const {cluster} = useSolana()
    return {cluster}
}