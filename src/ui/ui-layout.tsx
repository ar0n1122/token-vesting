'use client'

import {useCallback} from 'react'
import {toast} from 'sonner'

export function useTransactionToast() {
    return useCallback((signature?: string) => {
        if (signature) {
            toast.success(`Transaction completed: ${signature}`)
        } else {
            toast.error('Transaction failed')
        }
    }, [])
}