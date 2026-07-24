'use client'

import { createContext, useContext } from 'react'

interface ViewerContextValue {
  userId: string
  email: string
  canDownload: boolean
}

const ViewerContext = createContext<ViewerContextValue>({ userId: '', email: '', canDownload: false })

export function ViewerEmailProvider({
  userId,
  email,
  canDownload,
  children,
}: {
  userId: string
  email: string
  canDownload: boolean
  children: React.ReactNode
}) {
  return (
    <ViewerContext.Provider value={{ userId, email, canDownload }}>
      {children}
    </ViewerContext.Provider>
  )
}

export function useViewer() {
  return useContext(ViewerContext)
}
