"use client"

import { Provider } from 'react-redux'
import { store } from './store'
import { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'


export const ReduxProvider = ({ children }: { children: ReactNode }) => {
    return <Provider store={store}>{children}<Toaster richColors position="top-right" /></Provider>
}