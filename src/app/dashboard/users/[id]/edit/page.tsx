'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { UserForm, UserFormData } from '@/components/UserForm'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, User, Users, Clock, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  surname: string
  phone: string
  address: string
  notes: string
  is_active: boolean
  monthly_hours: number
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { showToast, ToastComponent } = useToast()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Verificar autenticación - removido showToast de dependencias
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
      // if (error || !authUser) {
        // router.push('/login')
        return
      }

      // }

    checkAuth()
  }, [router]) // Removido showToast de las dependencias

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      // const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      // if (error) {
        console.error('Error fetching user:', error)
        showToast('Error al cargar los datos del usuario', 'error')
        router.push('/dashboard/users')
        return
      }

      setUser(data)
    } catch (error) {
      console.error('Error fetching user:', error)
      showToast('Error al cargar los datos del usuario', 'error')
      router.push('/dashboard/users')
    } finally {
      setLoading(false)
    }
  }, [userId, router, showToast])

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId, fetchUser])

  const handleSubmit = useCallback(async (formData: UserFormData) => {
    try {
      // // // const updateData = {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        phone: formData.phone.replace(/\s/g, ''),
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        is_active: formData.is_active,
        monthly_hours: Number(formData.monthly_hours)
      }

      // const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        console.error('❌ Error updating user:', error)
        showToast(`Error al actualizar usuario: ${error.message}`, 'error')
        return
      }

      // showToast('Usuario actualizado correctamente', 'success')
      setTimeout(() => {
        router.push('/dashboard/users')
      }, 1500)
    } catch (error) {
      console.error('❌ Unexpected error updating user:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar los cambios'
      showToast(`Error al guardar: ${errorMessage}`, 'error')
    }
  }, [userId, router, showToast])

  const handleCancel = useCallback(() => {
    router.push('/dashboard/users')
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Usuario no encontrado</p>
          <button
            onClick={() => router.push('/dashboard/users')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header sticky mobile-first */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center py-4">
            <button onClick={() => router.back()} className="mr-2 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 truncate flex-1">Editar Usuario</h1>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <UserForm
          user={user}
          isEditing={true}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
        {ToastComponent}
      </div>
      {/* Footer de navegación fijo */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
        <nav className="flex justify-around py-3">
          <Link href="/dashboard/users" className="flex flex-col items-center text-xs text-slate-600 hover:text-blue-600 transition-colors">
            <User className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Usuarios</span>
          </Link>
          <Link href="/dashboard/workers" className="flex flex-col items-center text-xs text-slate-600 hover:text-green-600 transition-colors">
            <Users className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Trabajadoras</span>
          </Link>
          <Link href="/dashboard/assignments" className="flex flex-col items-center text-xs text-slate-600 hover:text-purple-600 transition-colors">
            <Clock className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Asignaciones</span>
          </Link>
          <Link href="/dashboard/planning" className="flex flex-col items-center text-xs text-blue-600 transition-colors">
            <Calendar className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Planning</span>
          </Link>
          <Link href="/dashboard/settings" className="flex flex-col items-center text-xs text-slate-600 hover:text-slate-800 transition-colors">
            <FileText className="w-5 h-5 mb-1" />
            <span className="hidden sm:inline">Configuración</span>
          </Link>
        </nav>
      </footer>
      <div className="h-20"></div>
    </div>
  )
}
