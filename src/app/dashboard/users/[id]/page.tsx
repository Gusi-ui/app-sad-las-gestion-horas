'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { User, ServiceCard, WorkerType } from '@/lib/types'
import { getHolidaysForMonth, type Holiday } from '@/lib/calendar'
import HoursPredictionBanner from '@/components/HoursPredictionBanner'

interface WorkerConfig {
  isActive: boolean
  serviceCard?: ServiceCard
}

interface WorkerConfigs {
  regular: WorkerConfig
  holidays: WorkerConfig
  weekends: WorkerConfig
}

export default function UserDetailPage() {
  const params = useParams()
  const userId = params.id as string
  const [user, setUser] = useState<User | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [workerConfigs, setWorkerConfigs] = useState<WorkerConfigs>({
    regular: { isActive: false },
    holidays: { isActive: false },
    weekends: { isActive: false }
  })
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<WorkerType, boolean>>({
    regular: false,
    holidays: false,
    weekends: false
  })
  const [localChanges, setLocalChanges] = useState<Record<string, Partial<ServiceCard>>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autoCreatedThisMonth, setAutoCreatedThisMonth] = useState(false)

  useEffect(() => {
    setAutoCreatedThisMonth(false) // Reset indicator when changing month
    fetchData()
  }, [userId, currentMonth, currentYear])

  const fetchData = async () => {
    console.log('=== INICIANDO FETCH DATA ===')
    setLoading(true)
    try {
      // Fetch user
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userData) {
        console.log('Usuario cargado:', userData)
        console.log('Monthly hours del usuario:', userData.monthly_hours)
        setUser(userData)
      }

      // Fetch all service cards for this user and month/year
      const { data: serviceCards } = await supabase
        .from('service_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .eq('year', currentYear)

      console.log('Service cards cargadas para', currentMonth, '/', currentYear, ':', serviceCards)

      // Si no hay service cards para este mes, buscar la configuración más reciente
      if (!serviceCards || serviceCards.length === 0) {
        console.log('No hay service cards para este mes, buscando configuración más reciente...')
        await autoCreateServiceCardsFromTemplate()
        
        // Volver a cargar después de crear las plantillas
        const { data: newServiceCards } = await supabase
          .from('service_cards')
          .select('*')
          .eq('user_id', userId)
          .eq('month', currentMonth)
          .eq('year', currentYear)
        
        console.log('Service cards creadas automáticamente:', newServiceCards)
        setWorkerConfigs(organizeServiceCards(newServiceCards || []))
      } else {
        setWorkerConfigs(organizeServiceCards(serviceCards || []))
      }
      
      // Limpiar cambios locales cuando se recargan los datos
      setLocalChanges({})
      setHasUnsavedChanges(false)
      console.log('=== FETCH DATA COMPLETADO ===')
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const organizeServiceCards = (serviceCards: any[]): WorkerConfigs => {
    const newConfigs: WorkerConfigs = {
      regular: { isActive: false },
      holidays: { isActive: false },
      weekends: { isActive: false }
    }

    if (serviceCards) {
      serviceCards.forEach(card => {
        const workerType = card.worker_type as WorkerType
        console.log(`Configurando ${workerType}:`, card)
        console.log(`Weekly schedule para ${workerType}:`, card.weekly_schedule, typeof card.weekly_schedule)
        console.log(`Used hours para ${workerType}:`, card.used_hours, typeof card.used_hours)
        newConfigs[workerType] = {
          isActive: true,
          serviceCard: card
        }
      })
    }

    return newConfigs
  }

  const autoCreateServiceCardsFromTemplate = async () => {
    try {
      console.log('Buscando plantilla más reciente...')
      
      // Buscar service cards más recientes del usuario (cualquier mes/año)
      const { data: templateCards } = await supabase
        .from('service_cards')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(10) // Últimos 10 registros para cubrir todos los worker_types

      console.log('Template cards encontradas:', templateCards)

      if (templateCards && templateCards.length > 0) {
        // Agrupar por worker_type y tomar el más reciente de cada tipo
        const latestByType: Record<WorkerType, any> = {} as any

        templateCards.forEach(card => {
          const workerType = card.worker_type as WorkerType
          if (!latestByType[workerType] || 
              card.year > latestByType[workerType].year || 
              (card.year === latestByType[workerType].year && card.month > latestByType[workerType].month)) {
            latestByType[workerType] = card
          }
        })

        console.log('Plantillas más recientes por tipo:', latestByType)

        // Crear service cards para el mes actual basadas en las plantillas
        const cardsToCreate = []

        for (const [workerType, templateCard] of Object.entries(latestByType)) {
          const newCard = {
            user_id: userId,
            month: currentMonth,
            year: currentYear,
            worker_type: workerType,
            used_hours: 0,
            total_hours: 0,
            // Copiar configuraciones específicas de la plantilla
            weekly_schedule: templateCard.weekly_schedule,
            specific_dates: workerType === 'holidays' ? [] : templateCard.specific_dates, // Festivos se resetean por mes
            holiday_hours: templateCard.holiday_hours,
            weekend_config: templateCard.weekend_config,
            weekend_hours: templateCard.weekend_hours
          }

          // Si es holidays, auto-seleccionar festivos del nuevo mes si había festivos configurados
          if (workerType === 'holidays') {
            const holidaysForMonth = await getHolidaysForCurrentMonth()
            // Si tenía festivos configurados anteriormente, auto-seleccionar todos los del nuevo mes
            newCard.specific_dates = templateCard.specific_dates && templateCard.specific_dates.length > 0 
              ? holidaysForMonth 
              : []
          }

          cardsToCreate.push(newCard)
        }

        if (cardsToCreate.length > 0) {
          console.log('Creando service cards automáticamente:', cardsToCreate)
          
          const { data, error } = await supabase
            .from('service_cards')
            .insert(cardsToCreate)
            .select()

          if (error) {
            console.error('Error creando service cards automáticamente:', error)
          } else {
            console.log('Service cards creadas exitosamente:', data)
            // Auto-calcular y actualizar las horas usadas para el nuevo mes
            await updateUsedHoursForNewCards(data)
            // Marcar que se han creado configuraciones automáticamente
            setAutoCreatedThisMonth(true)
          }
        }
      }
    } catch (error) {
      console.error('Error en autoCreateServiceCardsFromTemplate:', error)
    }
  }

  const getHolidaysForCurrentMonth = async (): Promise<string[]> => {
    try {
      const holidays = getHolidaysForMonth(currentYear, currentMonth)
      return holidays.map(h => h.date)
    } catch (error) {
      console.error('Error obteniendo festivos del mes:', error)
      return []
    }
  }

  const updateUsedHoursForNewCards = async (serviceCards: any[]) => {
    try {
      console.log('Actualizando horas usadas para nuevas service cards...')
      
      const updatePromises = serviceCards.map(async (card) => {
        const calculatedUsedHours = calculateUsedHours(card)
        
        console.log(`Actualizando horas para ${card.worker_type}: ${calculatedUsedHours}h`)
        
        return await supabase
          .from('service_cards')
          .update({ used_hours: calculatedUsedHours })
          .eq('id', card.id)
      })

      await Promise.all(updatePromises)
      console.log('Horas usadas actualizadas para todas las nuevas service cards')
    } catch (error) {
      console.error('Error actualizando horas usadas:', error)
    }
  }

  const toggleWorkerType = async (workerType: WorkerType) => {
    const isCurrentlyActive = workerConfigs[workerType].isActive

    if (isCurrentlyActive) {
      // Deactivate - delete service card
      const serviceCard = workerConfigs[workerType].serviceCard
      if (serviceCard) {
        await supabase
          .from('service_cards')
          .delete()
          .eq('id', serviceCard.id)
      }
    } else {
      // Activate - create new service card
      console.log(`Activando worker type: ${workerType}`)
      
      try {
        // Intentar primero con todos los campos
        let insertData: any = {
          user_id: userId,
          month: currentMonth,
          year: currentYear,
          used_hours: 0,
          total_hours: 0, // Campo obligatorio
          worker_type: workerType
        }

        // Add type-specific fields
        if (workerType === 'holidays') {
          insertData.specific_dates = []
          insertData.holiday_hours = 3.5
        } else if (workerType === 'weekends') {
          insertData.weekend_config = { saturday: false, sunday: false }
          insertData.weekend_hours = { saturday: 3.5, sunday: 3.5 }
        } else if (workerType === 'regular') {
          insertData.weekly_schedule = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }

        console.log('Intentando insertar service card con campos completos:', insertData)

        let { data, error } = await supabase
          .from('service_cards')
          .insert(insertData)
          .select()
          .single()

        // Si falla, intentar solo con campos básicos
        if (error) {
          console.log('Intento completo falló, probando con campos básicos...')
          
          const basicData: any = {
            user_id: userId,
            month: currentMonth,
            year: currentYear,
            used_hours: 0,
            total_hours: 0, // Campo obligatorio
            worker_type: workerType
          }

          // Solo añadir campos que sabemos que existen
          if (workerType === 'holidays') {
            basicData.specific_dates = []
          } else if (workerType === 'weekends') {
            basicData.weekend_config = { saturday: false, sunday: false }
          } else if (workerType === 'regular') {
            basicData.weekly_schedule = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          }

          console.log('Intentando insertar con campos básicos:', basicData)

          const basicResult = await supabase
            .from('service_cards')
            .insert(basicData)
            .select()
            .single()

          data = basicResult.data
          error = basicResult.error
        }

        if (error) {
          console.error('Error al crear service card:', error)
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          alert(`Error al activar ${workerType}: ${error.message || JSON.stringify(error)}`)
          return
        }

        if (data) {
          console.log('Service card creada exitosamente:', data)
          setExpandedSections(prev => ({ ...prev, [workerType]: true }))
        }
      } catch (error: any) {
        console.error('Error en toggleWorkerType:', error)
        alert(`Error al activar ${workerType}: ${error.message || error.toString()}`)
        return
      }
    }

    await fetchData()
  }

  const toggleSection = (workerType: WorkerType) => {
    setExpandedSections(prev => ({
      ...prev,
      [workerType]: !prev[workerType]
    }))
  }

  const updateLocalChange = (serviceCardId: string, changes: Partial<ServiceCard>) => {
    setLocalChanges(prev => ({
      ...prev,
      [serviceCardId]: {
        ...prev[serviceCardId],
        ...changes
      }
    }))
    setHasUnsavedChanges(true)
  }

  const getServiceCardWithChanges = (serviceCard: ServiceCard) => {
    const changes = localChanges[serviceCard.id] || {}
    const updatedCard = { ...serviceCard, ...changes }
    
    // Debug removido para producción
    
    return updatedCard
  }

  const calculateUsedHours = (serviceCard: ServiceCard): number => {
    const today = new Date()
    const isCurrentMonth = currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear()
    const lastDayToCount = isCurrentMonth ? today.getDate() : new Date(currentYear, currentMonth, 0).getDate()
    
    if (serviceCard.worker_type === 'regular' && serviceCard.weekly_schedule) {
      const weeklySchedule = serviceCard.weekly_schedule as { [key: number]: number }
      let totalUsedHours = 0
      
      // Obtener festivos del mes para excluirlos del trabajo regular
      const holidaysThisMonth = getHolidaysForMonth(currentYear, currentMonth)
      const holidayDates = holidaysThisMonth.map(h => h.date)
      
      // Iterar por cada día del mes hasta hoy (si es el mes actual) o hasta el final del mes
      for (let day = 1; day <= lastDayToCount; day++) {
        const date = new Date(Date.UTC(currentYear, currentMonth - 1, day, 12, 0, 0))
        const dayOfWeek = date.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const dateStr = date.toISOString().split('T')[0]
        const isHoliday = holidayDates.includes(dateStr)
        
        // Solo contar días laborables (lunes a viernes) que NO sean festivos
        if (!isWeekend && !isHoliday && weeklySchedule[dayOfWeek]) {
          totalUsedHours += weeklySchedule[dayOfWeek]
        }
      }
      
      return Math.round(totalUsedHours * 10) / 10
    }
    
    if (serviceCard.worker_type === 'holidays' && serviceCard.specific_dates) {
      // Para trabajadora de festivos: contar solo días festivos específicos que ya han pasado
      let totalUsedHours = 0
      const hoursPerHoliday = serviceCard.holiday_hours || 3.5
      
      serviceCard.specific_dates.forEach(dateStr => {
        const holidayDate = new Date(dateStr + 'T12:00:00Z') // Z para UTC
        const holidayDay = holidayDate.getDate()
        
        // Solo contar si el día festivo ya pasó en este mes
        if (holidayDate.getFullYear() === currentYear && 
            holidayDate.getMonth() + 1 === currentMonth && 
            holidayDay <= lastDayToCount) {
          totalUsedHours += hoursPerHoliday
        }
      })
      
      return Math.round(totalUsedHours * 10) / 10
    }
    
    if (serviceCard.worker_type === 'weekends' && serviceCard.weekend_config) {
      // Para trabajadora de fines de semana: contar sábados y domingos que ya han pasado
      let totalUsedHours = 0
      const { saturday, sunday } = serviceCard.weekend_config
      const weekendHours = serviceCard.weekend_hours || { saturday: 3.5, sunday: 3.5 }
      
      for (let day = 1; day <= lastDayToCount; day++) {
        const date = new Date(Date.UTC(currentYear, currentMonth - 1, day, 12, 0, 0))
        const dayOfWeek = date.getDay()
        
        if (dayOfWeek === 6 && saturday) { // Sábado
          totalUsedHours += weekendHours.saturday
        }
        if (dayOfWeek === 0 && sunday) { // Domingo
          totalUsedHours += weekendHours.sunday
        }
      }
      
      return Math.round(totalUsedHours * 10) / 10
    }
    
    // Fallback: mantener el valor actual
    return serviceCard.used_hours || 0
  }

  const saveAllChanges = async () => {
    try {
      console.log('=== INICIANDO GUARDADO ===')
      console.log('Cambios locales:', localChanges)
      
      const updatePromises = Object.entries(localChanges).map(async ([serviceCardId, changes]) => {
        // Para cualquier cambio, recalcular las horas utilizadas automáticamente
        const serviceCard = Object.values(workerConfigs)
          .find(config => config.serviceCard?.id === serviceCardId)?.serviceCard
        
        if (serviceCard) {
          const updatedCard = { ...serviceCard, ...changes }
          const calculatedUsedHours = calculateUsedHours(updatedCard)
          
          // Preparar los cambios finales
          const finalChanges = {
            ...changes,
            used_hours: calculatedUsedHours
          }
          
          // Eliminar campos que no deben guardarse
          delete finalChanges.total_hours
          
          console.log(`Guardando para ${serviceCardId}:`, finalChanges)
          
          const result = await supabase
            .from('service_cards')
            .update(finalChanges)
            .eq('id', serviceCardId)
            .select()
          
          console.log(`Resultado de guardado para ${serviceCardId}:`, result)
          
          if (result.error) {
            console.error(`Error guardando ${serviceCardId}:`, result.error)
            throw result.error
          }
          
          return result
        }
      })
      
      await Promise.all(updatePromises)
      
      console.log('=== GUARDADO COMPLETADO ===')
      
      setLocalChanges({})
      setHasUnsavedChanges(false)
      
      // Esperar un momento antes de recargar para asegurar que la BD se actualice
      setTimeout(async () => {
        await fetchData()
        console.log('Datos recargados después del guardado')
      }, 100)
      
    } catch (error) {
      console.error('Error saving changes:', error)
      alert('Error al guardar los cambios. Revisa la consola para más detalles.')
    }
  }

  const discardChanges = () => {
    setLocalChanges({})
    setHasUnsavedChanges(false)
  }

  const getWorkerTypeInfo = (workerType: WorkerType) => {
    const info = {
      regular: {
        title: 'Trabajo Regular',
        description: 'Lunes a Viernes',
        color: 'bg-blue-50 border-blue-200',
        activeColor: 'bg-blue-100 border-blue-300',
        buttonColor: 'bg-blue-500 hover:bg-blue-600'
      },
      holidays: {
        title: 'Trabajo en Festivos',
        description: 'Días festivos específicos',
        color: 'bg-orange-50 border-orange-200',
        activeColor: 'bg-orange-100 border-orange-300',
        buttonColor: 'bg-orange-500 hover:bg-orange-600'
      },
      weekends: {
        title: 'Trabajo en Fines de Semana',
        description: 'Sábados y Domingos',
        color: 'bg-purple-50 border-purple-200',
        activeColor: 'bg-purple-100 border-purple-300',
        buttonColor: 'bg-purple-500 hover:bg-purple-600'
      }
    }
    return info[workerType]
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  if (!user) {
    return <div className="p-6">Usuario no encontrado</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{user.name} {user.surname}</h1>
          <p className="text-gray-600">
            {new Date(0, currentMonth - 1).toLocaleString('es-ES', { month: 'long' })} {currentYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => {
              if (currentMonth === 1) {
                setCurrentMonth(12)
                setCurrentYear(currentYear - 1)
              } else {
                setCurrentMonth(currentMonth - 1)
              }
            }}
          >
            ← Mes Anterior
          </Button>
          <Button 
            variant="secondary"
            onClick={() => {
              if (currentMonth === 12) {
                setCurrentMonth(1)
                setCurrentYear(currentYear + 1)
              } else {
                setCurrentMonth(currentMonth + 1)
              }
            }}
          >
            Mes Siguiente →
          </Button>
        </div>
      </div>

      {/* Monthly Hours Overview - Responsive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Hours Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
                          <div className="text-center">
              <div className="text-base font-bold text-blue-600 mb-2">Horas Totales del Mes</div>
              <div className="flex items-center justify-center space-x-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={user?.monthly_hours || 0}
                  onChange={async (e) => {
                    const newHours = Number(e.target.value)
                    if (user) {
                      await supabase
                        .from('users')
                        .update({ monthly_hours: newHours })
                        .eq('id', user.id)
                      
                      setUser({ ...user, monthly_hours: newHours })
                    }
                  }}
                  className="text-4xl font-bold text-blue-900 bg-transparent border-none text-center w-24 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                />
                <span className="text-2xl font-semibold text-blue-700">h</span>
              </div>
              <div className="text-sm font-medium text-blue-500 mt-1">Asignadas</div>
            </div>
          </CardContent>
        </Card>

        {/* Used Hours Card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-base font-bold text-green-600 mb-2">Horas Utilizadas</div>
              <div className="text-4xl font-bold text-green-900">
                {(() => {
                  const totalUsedHours = Object.values(workerConfigs)
                    .filter(config => config.isActive && config.serviceCard)
                    .reduce((sum, config) => {
                      const serviceCard = getServiceCardWithChanges(config.serviceCard!)
                      return sum + calculateUsedHours(serviceCard)
                    }, 0)
                  return Math.round(totalUsedHours * 10) / 10
                })()}
                <span className="text-2xl font-semibold text-green-700 ml-1">h</span>
              </div>
              <div className="text-sm font-medium text-green-500 mt-1">Hasta hoy</div>
            </div>
          </CardContent>
        </Card>

        {/* Remaining Hours Card */}
        <Card className={`bg-gradient-to-br ${
          (() => {
            const userTotalHours = user?.monthly_hours || 0
            const totalUsedHours = Object.values(workerConfigs)
              .filter(config => config.isActive && config.serviceCard)
              .reduce((sum, config) => {
                const serviceCard = getServiceCardWithChanges(config.serviceCard!)
                return sum + calculateUsedHours(serviceCard)
              }, 0)
            const remainingHours = userTotalHours - totalUsedHours
            return remainingHours >= 0 
              ? 'from-amber-50 to-amber-100 border-amber-200' 
              : 'from-red-50 to-red-100 border-red-200'
          })()
        }`}>
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              {(() => {
                const userTotalHours = user?.monthly_hours || 0
                const totalUsedHours = Object.values(workerConfigs)
                  .filter(config => config.isActive && config.serviceCard)
                  .reduce((sum, config) => {
                    const serviceCard = getServiceCardWithChanges(config.serviceCard!)
                    return sum + calculateUsedHours(serviceCard)
                  }, 0)
                const remainingHours = userTotalHours - totalUsedHours
                const isPositive = remainingHours >= 0
                
                // Calcular días restantes del mes
                const today = new Date()
                const isCurrentMonth = currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear()
                const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
                const currentDay = isCurrentMonth ? today.getDate() : daysInMonth
                const remainingDays = Math.max(0, daysInMonth - currentDay)
                
                // Calcular porcentaje de progreso
                const progressPercentage = userTotalHours > 0 ? (totalUsedHours / userTotalHours) * 100 : 0
                
                return (
                  <>
                    <div className={`text-base font-bold mb-2 ${
                      isPositive ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {isPositive ? 'Te QUEDAN' : 'Horas de Exceso'}
                    </div>
                    
                    <div className={`text-4xl font-bold ${
                      isPositive ? 'text-amber-900' : 'text-red-900'
                    }`}>
                      {Math.abs(remainingHours)}
                      <span className={`text-2xl font-semibold ml-1 ${
                        isPositive ? 'text-amber-700' : 'text-red-700'
                      }`}>h</span>
                    </div>
                    
                    {/* Barra de progreso */}
                    <div className="w-full bg-white/50 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isPositive 
                            ? progressPercentage >= 90 ? 'bg-amber-500' : 'bg-amber-400'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className={`text-sm font-medium mt-1 ${
                      isPositive ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {isPositive ? (
                        isCurrentMonth ? `${remainingDays} días para acabar el mes` : 'Mes completado'
                      ) : 'Sobre límite'}
                    </div>
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banner de configuración automática */}
      {autoCreatedThisMonth && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-800 font-medium">
              ✨ Configuración automática aplicada
            </span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Se han creado automáticamente las configuraciones para{' '}
            <strong>{new Date(0, currentMonth - 1).toLocaleString('es-ES', { month: 'long' })} {currentYear}</strong>{' '}
            basándose en tus configuraciones anteriores. Las horas se han calculado automáticamente según los días del mes.
          </p>
        </div>
      )}

      {/* Botones de guardado */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-yellow-800 font-medium">Tienes cambios sin guardar</span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={discardChanges}
              >
                Descartar
              </Button>
              <Button
                size="sm"
                onClick={saveAllChanges}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Global Prediction Banner */}
      {Object.values(workerConfigs).some(config => config.isActive) && user && (
        <HoursPredictionBanner 
          serviceCards={Object.values(workerConfigs)
            .filter(config => config.isActive && config.serviceCard)
            .map(config => getServiceCardWithChanges(config.serviceCard!))}
          user={user}
          month={currentMonth}
          year={currentYear}
          consolidated={true}
        />
      )}

      {/* Worker Type Toggles - Reorganizado por realidad laboral */}
      <div className="space-y-8">
        {/* Trabajadora Regular (L-V) - Sección separada */}
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-lg font-semibold text-gray-900">
              👩‍💼 Trabajadora Regular (Lunes a Viernes)
            </h3>
            <p className="text-sm text-gray-600">Persona independiente - Horario laboral estándar</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {(['regular'] as WorkerType[]).map(workerType => {
              const config = workerConfigs[workerType]
              const info = getWorkerTypeInfo(workerType)

              return (
                <Card key={workerType} className={`border-2 ${config.isActive ? info.activeColor : info.color}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{info.title}</h3>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                      <Button
                        onClick={() => toggleWorkerType(workerType)}
                        className={config.isActive ? 'bg-red-500 hover:bg-red-600' : info.buttonColor}
                      >
                        {config.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                    
                    {config.isActive && config.serviceCard && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">Configuración y Progreso</h4>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => toggleSection(workerType)}
                          >
                            {expandedSections[workerType] ? 'Contraer' : 'Expandir'}
                          </Button>
                        </div>

                        {/* Contenido expandido */}
                        {expandedSections[workerType] && (
                          <div className="space-y-4 border-t pt-4">
                            {/* Resto del contenido igual que antes */}
                            {/* ... */}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Trabajadora Festivos + Fines de Semana - Misma persona */}
        <div className="space-y-4">
          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="text-lg font-semibold text-gray-900">
              🎉 Trabajadora Festivos + Fines de Semana
            </h3>
            <p className="text-sm text-gray-600">Misma persona - Cobertura días especiales</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['holidays', 'weekends'] as WorkerType[]).map(workerType => {
              const config = workerConfigs[workerType]
              const info = getWorkerTypeInfo(workerType)

              return (
                <Card key={workerType} className={`border-2 ${config.isActive ? info.activeColor : info.color}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{info.title}</h3>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                      <Button
                        onClick={() => toggleWorkerType(workerType)}
                        className={config.isActive ? 'bg-red-500 hover:bg-red-600' : info.buttonColor}
                      >
                        {config.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                    
                    {config.isActive && config.serviceCard && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">Configuración y Progreso</h4>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => toggleSection(workerType)}
                          >
                            {expandedSections[workerType] ? 'Contraer' : 'Expandir'}
                          </Button>
                        </div>

                        {/* Contenido expandido igual que antes */}
                        {expandedSections[workerType] && (
                          <div className="space-y-4 border-t pt-4">
                            {/* Resto del contenido igual que antes */}
                            {/* ... */}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {!Object.values(workerConfigs).some(config => config.isActive) && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500 text-lg">
              No hay modalidades de trabajo activadas para {user.name} {user.surname}
            </p>
            <p className="text-gray-400 mt-2">
              Activa una o más modalidades arriba para comenzar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}