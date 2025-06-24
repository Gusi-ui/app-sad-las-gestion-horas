import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ServiceCard, ServiceDay } from '@/lib/types'

export function useServiceCards(userId?: string) {
  return useQuery({
    queryKey: ['service-cards', userId],
    queryFn: async () => {
      let query = supabase
        .from('service_cards')
        .select(`
          *,
          service_days (*)
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Parsear los campos JSON
      return data.map(card => ({
        ...card,
        specific_dates: card.specific_dates ? JSON.parse(card.specific_dates) : [],
        weekend_config: card.weekend_config ? JSON.parse(card.weekend_config) : { saturday: false, sunday: false }
      })) as (ServiceCard & { service_days: ServiceDay[] })[]
    },
    enabled: !!userId
  })
}

export function useServiceCard(cardId: string) {
  return useQuery({
    queryKey: ['service-cards', cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_cards')
        .select(`
          *,
          service_days (*)
        `)
        .eq('id', cardId)
        .single()

      if (error) throw error
      
      // Parsear los campos JSON
      return {
        ...data,
        specific_dates: data.specific_dates ? JSON.parse(data.specific_dates) : [],
        weekend_config: data.weekend_config ? JSON.parse(data.weekend_config) : { saturday: false, sunday: false }
      } as ServiceCard & { service_days: ServiceDay[] }
    },
    enabled: !!cardId
  })
}

export function useCreateServiceCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cardData: {
      user_id: string
      month: number
      year: number
      worker_type: string
      total_hours: number
      service_days: { day_of_week: number; hours: number; specific_date?: string }[]
      specific_dates?: string[]
      weekend_config?: { saturday: boolean; sunday: boolean }
    }) => {
      const { service_days, specific_dates, weekend_config, ...cardInfo } = cardData
      
      // Preparar datos con los nuevos campos
      const cardInfoWithExtras = {
        ...cardInfo,
        specific_dates: specific_dates ? JSON.stringify(specific_dates) : null,
        weekend_config: weekend_config ? JSON.stringify(weekend_config) : null
      }

      // Crear la tarjeta de servicio
      const { data: card, error: cardError } = await supabase
        .from('service_cards')
        .insert(cardInfoWithExtras)
        .select()
        .single()

      if (cardError) throw cardError

      // Crear los días de servicio
      if (service_days.length > 0) {
        const { error: daysError } = await supabase
          .from('service_days')
          .insert(
            service_days.map(day => ({
              card_id: card.id,
              ...day
            }))
          )

        if (daysError) throw daysError
      }

      return card as ServiceCard
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-cards'] })
      queryClient.invalidateQueries({ queryKey: ['service-cards', data.user_id] })
    }
  })
}

export function useUpdateServiceCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      id: string
      updates: Partial<ServiceCard>
      service_days?: { day_of_week: number; hours: number }[]
    }) => {
      const { id, updates, service_days } = data

      // Actualizar la tarjeta
      const { data: card, error: cardError } = await supabase
        .from('service_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (cardError) throw cardError

      // Si se proporcionan días de servicio, actualizarlos
      if (service_days) {
        // Eliminar días existentes
        await supabase
          .from('service_days')
          .delete()
          .eq('card_id', id)

        // Insertar nuevos días
        if (service_days.length > 0) {
          const { error: daysError } = await supabase
            .from('service_days')
            .insert(
              service_days.map(day => ({
                card_id: id,
                ...day
              }))
            )

          if (daysError) throw daysError
        }
      }

      return card as ServiceCard
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-cards'] })
      queryClient.invalidateQueries({ queryKey: ['service-cards', data.id] })
      queryClient.invalidateQueries({ queryKey: ['service-cards', data.user_id] })
    }
  })
}

export function useUpdateUsedHours() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cardId, usedHours }: { cardId: string; usedHours: number }) => {
      const { data, error } = await supabase
        .from('service_cards')
        .update({ used_hours: usedHours })
        .eq('id', cardId)
        .select()
        .single()

      if (error) throw error
      return data as ServiceCard
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-cards'] })
      queryClient.invalidateQueries({ queryKey: ['service-cards', data.id] })
      queryClient.invalidateQueries({ queryKey: ['service-cards', data.user_id] })
    }
  })
}

export function useDeleteServiceCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cardId: string) => {
      // Primero eliminar los días de servicio (por foreign key constraint)
      await supabase
        .from('service_days')
        .delete()
        .eq('card_id', cardId)

      // Luego eliminar la tarjeta
      const { data, error } = await supabase
        .from('service_cards')
        .delete()
        .eq('id', cardId)
        .select()
        .single()

      if (error) throw error
      return data as ServiceCard
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-cards'] })
      queryClient.invalidateQueries({ queryKey: ['service-cards', data.user_id] })
    }
  })
} 