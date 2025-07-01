'use client'

import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { UserForm, UserFormData } from '@/components/UserForm'
import { supabase } from '@/lib/supabase'

export default function NewUserPage() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()

  const handleSubmit = async (formData: UserFormData) => {
    try {
      console.log('📝 Creating user with data:', formData)
      
      const userData = {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        phone: formData.phone.replace(/\s/g, ''),
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        is_active: formData.is_active,
        monthly_hours: formData.monthly_hours
      }
      
      console.log('🔧 Processed user data:', userData)

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single()

      console.log('📊 Supabase response:', { data, error })

      if (error) {
        console.error('❌ Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        showToast(`Error al crear usuario: ${error.message}`, 'error')
        return
      }

      if (!data) {
        console.error('❌ No data returned from insert')
        showToast('Error: No se recibieron datos del servidor', 'error')
        return
      }

      console.log('✅ User created successfully:', data)
      showToast('Usuario creado correctamente', 'success')
      router.push('/dashboard/users')
    } catch (error) {
      console.error('❌ Unexpected error creating user:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      showToast(`Error inesperado al crear usuario: ${errorMessage}`, 'error')
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/users')
  }

  return (
    <>
      <UserForm
        isEditing={false}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
      {ToastComponent}
    </>
  )
}
