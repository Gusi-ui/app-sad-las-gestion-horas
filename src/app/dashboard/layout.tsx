// Configuración global para el dashboard
export const dynamic = 'force-dynamic'
export const runtime = 'edge'
export const preferredRegion = 'iad1'

import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
} 