'use client'

import { ServiceCard, User } from '@/lib/types'

interface HoursPredictionBannerProps {
  serviceCards: ServiceCard[]
  user: User
  month: number
  year: number
  consolidated?: boolean
  compact?: boolean
}

export default function HoursPredictionBanner({ 
  serviceCards, 
  user,
  month, 
  year, 
  consolidated = false,
  compact = false 
}: HoursPredictionBannerProps) {
  if (!serviceCards || serviceCards.length === 0) {
    return null
  }

  const calculateUsedHours = (serviceCard: ServiceCard): number => {
    if (serviceCard.worker_type === 'regular' && serviceCard.weekly_schedule) {
      const weeklySchedule = serviceCard.weekly_schedule as { [key: number]: number }
      
      // Calcular horas utilizadas hasta el día actual del mes
      const today = new Date()
      const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear()
      const lastDayToCount = isCurrentMonth ? today.getDate() : new Date(year, month, 0).getDate()
      
      let totalUsedHours = 0
      
      // Iterar por cada día del mes hasta hoy (si es el mes actual) o hasta el final del mes
      for (let day = 1; day <= lastDayToCount; day++) {
        const date = new Date(year, month - 1, day)
        const dayOfWeek = date.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        
        // Solo contar días laborables (lunes a viernes)
        if (!isWeekend && weeklySchedule[dayOfWeek]) {
          totalUsedHours += weeklySchedule[dayOfWeek]
        }
      }
      
      return Math.round(totalUsedHours * 10) / 10 // Redondear a 1 decimal
    }
    
    // Para otros tipos de trabajadoras, usar el valor de la base de datos
    return serviceCard.used_hours || 0
  }

  const calculatePrediction = (serviceCard: ServiceCard) => {
    // Las horas totales del usuario (ej: 86h) - son las mismas para todas las trabajadoras
    const userMonthlyHours = user.monthly_hours || 0
    
    // Calcular horas utilizadas basándose en la configuración actual
    const usedHours = calculateUsedHours(serviceCard)
    const remainingHours = userMonthlyHours - usedHours

    return {
      userMonthlyHours,
      usedHours,
      remainingHours,
      difference: remainingHours,
      status: remainingHours === 0 ? 'perfect' : remainingHours > 0 ? 'remaining' : 'exceeded'
    }
  }

  if (consolidated) {
    // Show combined prediction for all service cards
    let totalUsed = 0
    const userMonthlyHours = user.monthly_hours || 0
    
    serviceCards.forEach(card => {
      totalUsed += card.used_hours || 0
    })
    
    const totalRemaining = userMonthlyHours - totalUsed
    const status = totalRemaining === 0 ? 'perfect' : totalRemaining > 0 ? 'remaining' : 'exceeded'
    
    const getStatusColor = () => {
      switch (status) {
        case 'perfect': return 'bg-green-100 border-green-300 text-green-800'
        case 'remaining': return 'bg-blue-100 border-blue-300 text-blue-800'
        case 'exceeded': return 'bg-red-100 border-red-300 text-red-800'
      }
    }
    
    const getStatusMessage = () => {
      if (status === 'perfect') return '✅ Horas completadas'
      if (status === 'remaining') return `📋 Te QUEDAN ${Math.abs(totalRemaining)} horas`
      return `⚠️ Te has PASADO ${Math.abs(totalRemaining)} horas`
    }
    
    return (
      <div className={`p-4 rounded-lg border-2 ${getStatusColor()} ${compact ? 'text-sm' : 'text-lg'}`}>
        <div className={`font-bold ${compact ? 'text-base' : 'text-xl'}`}>
          {getStatusMessage()}
        </div>
        {!compact && (
          <div className="mt-2 text-sm opacity-75">
            Utilizadas: {totalUsed}h • Total asignadas: {userMonthlyHours}h • Restantes: {totalRemaining}h
          </div>
        )}
      </div>
    )
  }

  // Show prediction for single service card (compact mode)
  const serviceCard = serviceCards[0]
  const prediction = calculatePrediction(serviceCard)
  
  const getStatusColor = () => {
    switch (prediction.status) {
      case 'perfect': return 'bg-green-100 border-green-300 text-green-800'
      case 'remaining': return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'exceeded': return 'bg-red-100 border-red-300 text-red-800'
    }
  }
  
  const getStatusMessage = () => {
    if (prediction.status === 'perfect') return '✅ Completado'
    if (prediction.status === 'remaining') return `📋 Quedan ${Math.abs(prediction.difference)}h`
    return `⚠️ Pasado ${Math.abs(prediction.difference)}h`
  }
  
  const getWorkerTypeLabel = () => {
    switch (serviceCard.worker_type) {
      case 'regular': return 'Regular'
      case 'holidays': return 'Festivos'
      case 'weekends': return 'Fines de Semana'
      default: return ''
    }
  }
  
  return (
    <div className={`p-3 rounded-lg border ${getStatusColor()} text-sm`}>
      <div className="font-semibold">
        {getWorkerTypeLabel()}: {getStatusMessage()}
      </div>
      <div className="text-xs opacity-75 mt-1">
        {prediction.usedHours}h utilizadas de {prediction.userMonthlyHours}h totales
      </div>
    </div>
  )
} 