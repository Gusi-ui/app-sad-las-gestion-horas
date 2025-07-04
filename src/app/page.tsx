'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 to-slate-200 p-4">
      <div className="w-full max-w-sm bg-white/90 rounded-2xl shadow-xl px-6 py-8 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-100 mb-2">
            <svg className="w-10 h-10 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Bienvenido/a</h1>
          <p className="text-slate-600 text-base text-center">Gestión profesional de servicios y horarios de ayuda a domicilio</p>
        </div>
        <div className="flex flex-col gap-4 w-full mt-2">
          <Link href="/login" className="block">
            <Button className="w-full text-lg py-4 flex items-center gap-2" size="lg">
              <User className="w-5 h-5" /> Administración
            </Button>
          </Link>
          <Link href="/worker/login" className="block">
            <Button className="w-full text-lg py-4 flex items-center gap-2" size="lg" variant="secondary">
              <Users className="w-5 h-5" /> Trabajadoras
            </Button>
          </Link>
        </div>
      </div>
      <footer className="mt-8 text-slate-400 text-xs text-center">
        &copy; {new Date().getFullYear()} App SAD. Todos los derechos reservados.
      </footer>
    </div>
  )
}
