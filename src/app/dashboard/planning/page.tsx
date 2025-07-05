'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Plus, ChevronLeft, ChevronRight, Users, User as UserIcon, Clock, AlertTriangle, Settings, ArrowLeft, LogOut, Menu, X } from 'lucide-react'
import { useAssignments } from '@/hooks/useAssignments'
import { useWorkers } from '@/hooks/useWorkers'
import { useUsers } from '@/hooks/useUsers'
import type { Assignment, WeekDay, User, Worker } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { addDays, startOfWeek, format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Modal } from '@/components/ui/modal'
import { getDaysInMonth } from '@/lib/calendar'

// Configuración para evitar el prerender estático
export const dynamic = 'force-dynamic'

function getScheduleForDay(schedule: Record<WeekDay, string[]> | undefined, day: string): string[] | undefined {
  if (!schedule) return undefined;
  return schedule[day as WeekDay];
}

// Drawer inferior reutilizable
function BottomDrawer({ open, onClose, title, children }: { open: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Cerrar modal" tabIndex={0} />
      <div className="relative w-full max-w-md mx-auto bg-white rounded-t-2xl shadow-lg animate-slide-up" style={{ minHeight: '40vh', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-secondary">
          <span className="font-semibold text-lg text-secondary">{title}</span>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary/30" aria-label="Cerrar">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// Función para convertir hora a minutos para ordenamiento
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

// Función para obtener la hora de inicio de un horario
function getStartTime(times: any): string | null {
  if (!times) return null;
  
  // Caso: array de strings (antiguo)
  if (Array.isArray(times) && typeof times[0] === 'string') {
    return times[0];
  }
  
  // Caso: array de objetos {start, end}
  if (Array.isArray(times) && typeof times[0] === 'object' && times[0] !== null) {
    const firstTime = times[0];
    if (typeof firstTime === 'string') return firstTime;
    if (firstTime.start) return firstTime.start;
  }
  
  return null;
}

// Función para convertir día de la semana a WeekDay
function getDayKey(day: Date): WeekDay {
  const dayNames: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[day.getDay()];
}

// Función para ordenar asignaciones por hora de inicio
function sortAssignmentsByTime(assignments: Assignment[], dayKey: WeekDay): Assignment[] {
  return [...assignments].sort((a, b) => {
    const timesA = getScheduleForDay(a.specific_schedule, dayKey);
    const timesB = getScheduleForDay(b.specific_schedule, dayKey);
    
    const startTimeA = getStartTime(timesA);
    const startTimeB = getStartTime(timesB);
    
    // Si ambos tienen horario, ordenar por hora
    if (startTimeA && startTimeB) {
      return timeToMinutes(startTimeA) - timeToMinutes(startTimeB);
    }
    
    // Si solo uno tiene horario, el que tiene horario va primero
    if (startTimeA && !startTimeB) return -1;
    if (!startTimeA && startTimeB) return 1;
    
    // Si ninguno tiene horario, mantener orden original
    return 0;
  });
}

// Utilidad para mostrar horarios flexibles
function renderScheduleTimes(times: any): string {
  if (!times) return 'Sin horario';
  // Caso: array de strings (antiguo)
  if (Array.isArray(times) && typeof times[0] === 'string') {
    return times.length === 2 ? `${times[0]} - ${times[1]}` : times.join(', ');
  }
  // Caso: array de objetos {start, end}
  if (Array.isArray(times) && typeof times[0] === 'object' && times[0] !== null) {
    return times
      .map((t: any) => {
        if (typeof t === 'string') return t;
        if (t.start && t.end) return `${t.start}-${t.end}`;
        if (t.start) return t.start;
        return '';
      })
      .filter(Boolean)
      .join(', ');
  }
  return 'Sin horario';
}

export default function PlanningPage() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { assignments, isLoading, createAssignment, deleteAssignment, updateAssignment } = useAssignments()
  // console.log('ASSIGNMENTS', assignments);
  const { workers } = useWorkers()
  const { data: users } = useUsers()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [drawer, setDrawer] = useState<null | 'workers' | 'users' | 'conflicts' | 'settings'>(null)
  const [userSearch, setUserSearch] = useState('')
  const [workerSearch, setWorkerSearch] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [groupBy, setGroupBy] = useState<'none' | 'worker' | 'user'>('none')
  const [monthlyViewType, setMonthlyViewType] = useState<'grid' | 'list'>('list')

  const [weekStart, setWeekStart] = useState(startOfWeek(selectedDate, { weekStartsOn: 1 }))
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Función para obtener el día de la semana correcto (lunes=0, domingo=6)
  const getCorrectDayOfWeek = (date: Date): number => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1; // Convertir domingo (0) a 6, resto restar 1
  }

  // const goToPrevWeek = () => setWeekStart(prev => addDays(prev, -7))
  // const goToNextWeek = () => setWeekStart(prev => addDays(prev, 7))

  // Filtros globales de planning
  const [filterWorkerId, setFilterWorkerId] = useState<string>('');
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterWorkerSearch, setFilterWorkerSearch] = useState('');
  const [filterUserSearch, setFilterUserSearch] = useState('');

  const filteredAssignments = assignments.filter((a) => {
    // Filtro por trabajadora y usuario
    if (filterWorkerId && a.worker_id !== filterWorkerId) return false;
    if (filterUserId && a.user_id !== filterUserId) return false;
          if (viewMode === 'day') {
        if (a.specific_schedule) {
          const weekDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
          const dayKey = weekDays[getCorrectDayOfWeek(selectedDate)] as WeekDay;
          const times = getScheduleForDay(a.specific_schedule, dayKey);
        // Si hay horario para ese día, mostrarla
        if (times && times.length > 0) return true;
        // Si no hay horario, pero el start_date coincide, mostrarla también
        if (a.start_date) {
          const start = new Date(a.start_date);
          return isSameDay(start, selectedDate);
        }
        return false;
      }
      if (a.start_date) {
        const start = new Date(a.start_date);
        return isSameDay(start, selectedDate);
      }
      return false;
    }
    return true;
  })

  const assignmentsByDay = weekDays.map(day => {
    return filteredAssignments.filter(a => {
      if (a.specific_schedule) {
        const dayKey = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'][getCorrectDayOfWeek(day)];
        const times = getScheduleForDay(a.specific_schedule, dayKey);
        if (times && times.length > 0) return true;
        if (a.start_date) {
          return isSameDay(new Date(a.start_date), day);
        }
        return false;
      }
      if (a.start_date) {
        return isSameDay(new Date(a.start_date), day);
      }
      return false;
    });
  });

  const goToPrevDay = () => {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    setSelectedDate(prev)
  }

  const goToNextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    setSelectedDate(next)
  }

  const goToPrevWeek = () => {
    const prev = new Date(weekStart)
    prev.setDate(prev.getDate() - 7)
    setWeekStart(prev)
  }

  const goToNextWeek = () => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + 7)
    setWeekStart(next)
  }

  // Función para formatear el rango de fechas de la semana
  const formatWeekRange = () => {
    const startOfWeek = new Date(weekStart)
    const endOfWeek = new Date(weekStart)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    
    const startFormatted = startOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    const endFormatted = endOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    
    return `${startFormatted} - ${endFormatted}`
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Filtros de búsqueda
  const filteredUsers = users?.filter(u => {
    const q = userSearch.toLowerCase()
    return (
      u.name?.toLowerCase().includes(q) ||
      u.surname?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.address?.toLowerCase().includes(q)
    )
  }) || []

  const filteredWorkers = workers?.filter(w => {
    const q = workerSearch.toLowerCase()
    return (
      w.name?.toLowerCase().includes(q) ||
      w.surname?.toLowerCase().includes(q) ||
      w.email?.toLowerCase().includes(q)
    )
  }) || []

  // Simulación de conflictos (puedes reemplazar con lógica real)
  const conflicts: { type: string; description: string; assignments: Assignment[] }[] = [];
  if (assignments && assignments.length > 0 && workers && users) {
    // 1. Solapamiento de horarios para la misma trabajadora
    for (let i = 0; i < assignments.length; i++) {
      for (let j = i + 1; j < assignments.length; j++) {
        const a1 = assignments[i];
        const a2 = assignments[j];
        if (a1.worker_id === a2.worker_id) {
          // Mismo día y solapamiento de horario
          const days: WeekDay[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
          for (const day of days) {
            const t1 = a1.specific_schedule?.[day];
            const t2 = a2.specific_schedule?.[day];
            if (t1 && t2 && t1.length === 2 && t2.length === 2) {
              // Comprobar solapamiento de horas
              const [s1, e1] = t1;
              const [s2, e2] = t2;
              if (!(e1 <= s2 || e2 <= s1)) {
                conflicts.push({
                  type: 'Solapamiento de horarios (trabajadora)',
                  description: `La trabajadora ${a1.worker?.name} ${a1.worker?.surname} tiene dos asignaciones solapadas el ${day} (${s1}-${e1} y ${s2}-${e2})`,
                  assignments: [a1, a2]
                });
              }
            }
          }
        }
      }
    }
    // 2. Trabajadora con más horas semanales asignadas que su máximo
    for (const worker of workers) {
      const workerAssignments = assignments.filter(a => a.worker_id === worker.id);
      const totalHours = workerAssignments.reduce((sum, a) => sum + (a.assigned_hours_per_week || 0), 0);
      if (totalHours > worker.max_weekly_hours) {
        conflicts.push({
          type: 'Exceso de horas (trabajadora)',
          description: `La trabajadora ${worker.name} ${worker.surname} tiene asignadas ${totalHours}h/semana (máximo permitido: ${worker.max_weekly_hours}h)`,
          assignments: workerAssignments
        });
      }
    }
    // 3. Usuario con más de una trabajadora asignada en el mismo horario
    for (let i = 0; i < assignments.length; i++) {
      for (let j = i + 1; j < assignments.length; j++) {
        const a1 = assignments[i];
        const a2 = assignments[j];
        if (a1.user_id === a2.user_id && a1.worker_id !== a2.worker_id) {
          // Mismo día y solapamiento de horario
          const days: WeekDay[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
          for (const day of days) {
            const t1 = a1.specific_schedule?.[day];
            const t2 = a2.specific_schedule?.[day];
            if (t1 && t2 && t1.length === 2 && t2.length === 2) {
              const [s1, e1] = t1;
              const [s2, e2] = t2;
              if (!(e1 <= s2 || e2 <= s1)) {
                conflicts.push({
                  type: 'Solapamiento de trabajadoras (usuario)',
                  description: `El usuario ${a1.user?.name} ${a1.user?.surname} tiene dos trabajadoras asignadas en el mismo horario el ${day} (${s1}-${e1} y ${s2}-${e2})`,
                  assignments: [a1, a2]
                });
              }
            }
          }
        }
      }
    }
  }

  // Estado para los campos del modal de asignación
  const [assignHours, setAssignHours] = useState('')
  const [assignStartDate, setAssignStartDate] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)

  // Estado para el modal de resolución de conflicto
  const [resolveModal, setResolveModal] = useState<{ open: boolean; conflict: { type: string; description: string; assignments: Assignment[] } | null }>({ open: false, conflict: null })
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null)

  // Estado para el modal de confirmación de eliminación
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; assignment: Assignment | null }>({ open: false, assignment: null })

  // Estado para la reasignación
  const [reassignState, setReassignState] = useState<{ assignmentId: string | null, workerId: string, loading: boolean }>({ assignmentId: null, workerId: '', loading: false })

  // Debug temporal para Dolores
  assignments.forEach(a => {
    if (a.user?.name === 'Dolores') {
      // console.log('DOLORES ASSIGNMENT:', a);
      const weekDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
      const dayKey = weekDays[getCorrectDayOfWeek(selectedDate)] as WeekDay;
      const times = getScheduleForDay(a.specific_schedule, dayKey);
      // console.log('DOLORES TIMES FOR TODAY:', times);
    }
  });

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1; // 1-indexed
  const daysInMonth = getDaysInMonth(year, month);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                Planning Semanal
              </h1>
              <p className="text-sm text-slate-600 truncate">
                Vista diaria de asignaciones
              </p>
            </div>
            
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/workers">
                <Button variant="secondary" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Trabajadoras
                </Button>
              </Link>
              <Link href="/dashboard/users">
                <Button variant="secondary" size="sm">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Usuarios
                </Button>
              </Link>
              <Link href="/dashboard/assignments">
                <Button variant="secondary" size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Asignaciones
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>

            <div className="md:hidden relative">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Abrir menú de navegación"
                aria-expanded={showMobileMenu}
                className="relative z-10"
              >
                <Menu className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de filtros activos */}
      {(filterWorkerId || filterUserId) && (
        <div className="flex flex-wrap gap-2 px-4 py-2 bg-slate-100 border-b items-center">
          {filterWorkerId && (
            <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
              Trabajadora: {workers?.find(w => w.id === filterWorkerId)?.name} {workers?.find(w => w.id === filterWorkerId)?.surname}
              <button className="ml-2 text-blue-600 hover:text-blue-900" onClick={() => { setFilterWorkerId(''); setFilterWorkerSearch(''); }} aria-label="Quitar filtro trabajadora">×</button>
            </span>
          )}
          {filterUserId && (
            <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
              Usuario: {users?.find(u => u.id === filterUserId)?.name} {users?.find(u => u.id === filterUserId)?.surname}
              <button className="ml-2 text-green-600 hover:text-green-900" onClick={() => { setFilterUserId(''); setFilterUserSearch(''); }} aria-label="Quitar filtro usuario">×</button>
            </span>
          )}
        </div>
      )}

      {/* Menú contextual móvil unificado */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${
        showMobileMenu 
          ? 'max-h-96 opacity-100 visible' 
          : 'max-h-0 opacity-0 invisible'
      }`}>
        <div className="py-4 border-t border-slate-200 bg-white shadow-lg">
          <div className="flex flex-col space-y-2 px-4">
            <Link href="/dashboard" onClick={() => setShowMobileMenu(false)}>
              <Button variant="secondary" size="sm" className="w-full justify-start">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/planning" onClick={() => setShowMobileMenu(false)}>
              <Button variant="secondary" size="sm" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                Planning
              </Button>
            </Link>
            <Link href="/dashboard/workers" onClick={() => setShowMobileMenu(false)}>
              <Button variant="secondary" size="sm" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Trabajadoras
              </Button>
            </Link>
            <Link href="/dashboard/users" onClick={() => setShowMobileMenu(false)}>
              <Button variant="secondary" size="sm" className="w-full justify-start">
                <UserIcon className="w-4 h-4 mr-2" />
                Usuarios
              </Button>
            </Link>
            <Link href="/dashboard/assignments" onClick={() => setShowMobileMenu(false)}>
              <Button variant="secondary" size="sm" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                Asignaciones
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => {
                handleLogout()
                setShowMobileMenu(false)
              }} 
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8">
        
        {/* ACCIONES RÁPIDAS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Link href="/dashboard/assignments/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto border border-blue-200 shadow-sm">
              <div className="p-2 bg-blue-50 rounded-lg mb-2">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-blue-900 text-center whitespace-normal break-words leading-snug">
                Nueva Asignación
              </h3>
              <p className="text-xs sm:text-sm text-blue-700 text-center whitespace-normal break-words leading-snug">
                Crear asignación
              </p>
            </Card>
          </Link>

          <Link href="/dashboard/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto border border-green-200 shadow-sm">
              <div className="p-2 bg-green-50 rounded-lg mb-2">
                <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-green-900 text-center whitespace-normal break-words leading-snug">
                Usuarios
              </h3>
              <p className="text-xs sm:text-sm text-green-700 text-center whitespace-normal break-words leading-snug">
                Gestionar usuarios
              </p>
            </Card>
          </Link>

          <Link href="/dashboard/workers">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto border border-purple-200 shadow-sm">
              <div className="p-2 bg-purple-50 rounded-lg mb-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-purple-900 text-center whitespace-normal break-words leading-snug">
                Trabajadoras
              </h3>
              <p className="text-xs sm:text-sm text-purple-700 text-center whitespace-normal break-words leading-snug">
                Gestionar trabajadoras
              </p>
            </Card>
          </Link>

          <Card className="hover:shadow-md transition-shadow cursor-pointer h-32 sm:h-28 flex flex-col items-center justify-center max-w-[140px] sm:max-w-full w-full mx-auto border border-yellow-200 shadow-sm">
            <div className="p-2 bg-yellow-50 rounded-lg mb-1 mt-1">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base text-yellow-900 text-center whitespace-normal break-words leading-snug">
              Vista Actual
            </h3>
            <div className="text-xs sm:text-sm text-yellow-700 text-center whitespace-normal break-words leading-snug">
              {viewMode === 'day' ? 'Vista Diaria' : viewMode === 'week' ? 'Vista Semanal' : 'Vista Mensual'}
            </div>
          </Card>
        </div>

      {viewMode === 'day' && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
          <Button variant="secondary" size="sm" onClick={goToPrevDay}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-lg">
            {selectedDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <Button variant="secondary" size="sm" onClick={goToNextDay}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
      {/* Barra de navegación semanal */}
      {viewMode === 'week' && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
          <Button variant="secondary" size="sm" onClick={goToPrevWeek}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-lg">
            Semana del {formatWeekRange()}
          </span>
          <Button variant="secondary" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Barra de navegación de meses en vista mensual */}
      {viewMode === 'month' && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
          <Button variant="secondary" size="sm" onClick={() => {
            const prev = new Date(selectedDate)
            prev.setMonth(prev.getMonth() - 1)
            setSelectedDate(prev)
          }}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-lg">
            {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="secondary" size="sm" onClick={() => {
            const next = new Date(selectedDate)
            next.setMonth(next.getMonth() + 1)
            setSelectedDate(next)
          }}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      <div className="px-4 py-2">
        <Card>
          <CardContent className="flex items-center justify-between py-3">
            <div>
              <span className="font-bold text-slate-900">{filteredAssignments.length}</span>
              <span className="ml-1 text-slate-600 text-sm">asignaciones</span>
            </div>
            <div className="text-slate-600">
              <span className="font-bold">{conflicts.length}</span>
              <span className="ml-1 text-sm">conflicto{conflicts.length === 1 ? '' : 's'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto max-w-2xl px-2 sm:px-4 space-y-3 mt-2">
        {isLoading ? (
          <div className="text-center text-slate-400 py-8">
            <Clock className="w-10 h-10 mx-auto mb-2 animate-spin" />
            <div className="font-medium">Cargando asignaciones...</div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <Clock className="w-10 h-10 mx-auto mb-2" />
            <div className="font-medium">No hay asignaciones para esta vista</div>
          </div>
        ) : (
          viewMode === 'day' ? (
            groupBy === 'none' ? (
              filteredAssignments.map((a) => {
                const weekDays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const
                const dayKey = weekDays[selectedDate.getDay()] as WeekDay
                const times = getScheduleForDay(a.specific_schedule, dayKey)
                return (
                  <Card key={a.id}>
                    <CardContent className="py-4 px-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-base">
                          {renderScheduleTimes(times)}
                        </span>
                        <span className="text-xs text-slate-500 capitalize">{a.status}</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-700 flex items-center gap-2">
                        Usuario: {a.user?.name} {a.user?.surname}
                      </div>
                      <div className="text-sm text-slate-700 flex items-center gap-2">
                        Trabajadora: {a.worker?.name} {a.worker?.surname}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Link href={`/dashboard/assignments/${a.id}`}><Button size="sm" variant="secondary">Ver</Button></Link>
                        <Link href={`/dashboard/assignments/${a.id}/edit`}><Button size="sm" variant="secondary">Editar</Button></Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : groupBy === 'worker' ? (
              Object.entries(filteredAssignments.reduce((acc, a) => {
                const key = a.worker?.id || 'Sin trabajadora';
                if (!acc[key]) acc[key] = [];
                acc[key].push(a);
                return acc;
              }, {} as Record<string, Assignment[]>)).map(([workerId, assignments]) => (
                <div key={workerId} className="mb-6">
                  <div className="font-bold text-slate-800 mb-2 text-base">
                    {assignments[0].worker?.name ? `${assignments[0].worker?.name} ${assignments[0].worker?.surname}` : 'Sin trabajadora'}
                  </div>
                  <div className="space-y-2">
                    {assignments.map(a => {
                      const weekDays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const
                      const dayKey = weekDays[selectedDate.getDay()] as WeekDay
                      const times = getScheduleForDay(a.specific_schedule, dayKey)
                      return (
                        <Card key={a.id}>
                          <CardContent className="py-3 px-4 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-base">
                                {renderScheduleTimes(times)}
                              </span>
                              <span className="text-xs text-slate-500 capitalize">{a.status}</span>
                            </div>
                            <div className="mt-1 text-sm text-slate-700 flex items-center gap-2">
                              Usuario: {a.user?.name} {a.user?.surname}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Link href={`/dashboard/assignments/${a.id}`}><Button size="sm" variant="secondary">Ver</Button></Link>
                              <Link href={`/dashboard/assignments/${a.id}/edit`}><Button size="sm" variant="secondary">Editar</Button></Link>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))
            ) : (
              Object.entries(filteredAssignments.reduce((acc, a) => {
                const key = a.user?.id || 'Sin usuario';
                if (!acc[key]) acc[key] = [];
                acc[key].push(a);
                return acc;
              }, {} as Record<string, Assignment[]>)).map(([userId, assignments]) => (
                <div key={userId} className="mb-6">
                  <div className="font-bold text-slate-800 mb-2 text-base">
                    {assignments[0].user?.name ? `${assignments[0].user?.name} ${assignments[0].user?.surname}` : 'Sin usuario'}
                  </div>
                  <div className="space-y-2">
                    {assignments.map((a, idx) => {
                      const weekDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
                      const dayKey = weekDays[getCorrectDayOfWeek(selectedDate)] as WeekDay;
                      const times = getScheduleForDay(a.specific_schedule, dayKey);
                      return (
                        <div key={`${a.id}-${idx}`} className="text-[10px] text-slate-700 truncate">
                          <div className="font-medium">{renderScheduleTimes(times)}</div>
                          <div className="text-[8px] text-slate-500">
                            {a.user?.name} {a.user?.surname}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )
          ) : viewMode === 'week' ? (
            groupBy === 'none' ? (
              weekDays.map((day, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b">
                      <div className="font-bold text-slate-700">
                        {format(day, 'EEEE', { locale: es })}
                      </div>
                      <div className="text-sm text-slate-500">
                        {format(day, 'd MMMM yyyy', { locale: es })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {assignmentsByDay[idx].length === 0 ? (
                        <div className="text-center text-slate-400 py-4">
                          <Clock className="w-8 h-8 mx-auto mb-2" />
                          <div className="text-sm">Sin asignaciones</div>
                        </div>
                      ) : (
                        sortAssignmentsByTime(assignmentsByDay[idx], getDayKey(weekDays[idx])).map(a => {
                          const weekDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
                          const dayKey = weekDays[getCorrectDayOfWeek(day)] as WeekDay;
                          const times = getScheduleForDay(a.specific_schedule, dayKey);
                          return (
                            <div key={a.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm">
                                  {renderScheduleTimes(times)}
                                </span>
                                <span className="text-xs text-slate-500 capitalize px-2 py-1 bg-slate-100 rounded">{a.status}</span>
                              </div>
                              <div className="text-sm text-slate-700 mb-1">
                                <span className="font-medium">Usuario:</span> {a.user?.name} {a.user?.surname}
                              </div>
                              <div className="text-sm text-slate-700 mb-2">
                                <span className="font-medium">Trabajadora:</span> {a.worker?.name} {a.worker?.surname}
                              </div>
                              <div className="flex gap-2">
                                <Link href={`/dashboard/assignments/${a.id}`}>
                                  <Button size="sm" variant="secondary">Ver</Button>
                                </Link>
                                <Link href={`/dashboard/assignments/${a.id}/edit`}>
                                  <Button size="sm" variant="secondary">Editar</Button>
                                </Link>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : groupBy === 'worker' ? (
              weekDays.map((day, idx) => {
                // Agrupar assignmentsByDay[idx] por trabajadora
                const grouped: [string, Assignment[]][] = Object.entries(assignmentsByDay[idx].reduce((acc, a) => {
                  const key = a.worker?.id || 'Sin trabajadora';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(a);
                  return acc;
                }, {} as Record<string, Assignment[]>));
                return (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <div className="font-bold text-slate-700">
                          {format(day, 'EEEE', { locale: es })}
                        </div>
                        <div className="text-sm text-slate-500">
                          {format(day, 'd MMMM yyyy', { locale: es })}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {grouped.map(([workerId, assignments]: [string, Assignment[]], groupIdx) => (
                          <div key={workerId} className="mb-2">
                            <div className="font-bold text-slate-800 mb-1 text-sm">
                              {assignments[0].worker?.name ? `${assignments[0].worker?.name} ${assignments[0].worker?.surname}` : 'Sin trabajadora'}
                            </div>
                            <div className="space-y-2">
                              {sortAssignmentsByTime(assignments, getDayKey(day)).map((a, idx) => {
                                const weekDays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const;
                                const dayKey = weekDays[day.getDay()] as WeekDay;
                                const times = getScheduleForDay(a.specific_schedule, dayKey);
                                return (
                                  <div key={`${a.id}-${idx}`} className="text-[10px] text-slate-700 truncate">
                                    <div className="font-medium">{renderScheduleTimes(times)}</div>
                                    <div className="text-[8px] text-slate-500">
                                      {a.user?.name} {a.user?.surname}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              weekDays.map((day, idx) => {
                // Agrupar assignmentsByDay[idx] por usuario
                const grouped: [string, Assignment[]][] = Object.entries(assignmentsByDay[idx].reduce((acc, a) => {
                  const key = a.user?.id || 'Sin usuario';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(a);
                  return acc;
                }, {} as Record<string, Assignment[]>));
                return (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <div className="font-bold text-slate-700">
                          {format(day, 'EEEE', { locale: es })}
                        </div>
                        <div className="text-sm text-slate-500">
                          {format(day, 'd MMMM yyyy', { locale: es })}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {grouped.map(([userId, assignments]: [string, Assignment[]], groupIdx) => (
                          <div key={userId} className="mb-2">
                            <div className="font-bold text-slate-800 mb-1 text-sm">
                              {assignments[0].user?.name ? `${assignments[0].user?.name} ${assignments[0].user?.surname}` : 'Sin usuario'}
                            </div>
                            <div className="space-y-2">
                              {sortAssignmentsByTime(assignments, getDayKey(day)).map((a, idx) => {
                                const weekDays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const;
                                const dayKey = weekDays[day.getDay()] as WeekDay;
                                const times = getScheduleForDay(a.specific_schedule, dayKey);
                                return (
                                  <div key={`${a.id}-${idx}`} className="text-[10px] text-slate-700 truncate">
                                    <div className="font-medium">{renderScheduleTimes(times)}</div>
                                    <div className="text-[8px] text-slate-500">
                                      {a.worker?.name} {a.worker?.surname}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )
          ) : (
            // Vista mensual
            (() => {
              const year = selectedDate.getFullYear();
              const month = selectedDate.getMonth() + 1; // 1-indexed
              const daysInMonth = getDaysInMonth(year, month);
              const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
              // Agrupar asignaciones por día
              const assignmentsByDay: Record<number, Assignment[]> = {};
              filteredAssignments.forEach(a => {
                if (a.start_date) {
                  const date = new Date(a.start_date);
                  if (date.getFullYear() === year && date.getMonth() + 1 === month) {
                    const day = date.getDate();
                    if (!assignmentsByDay[day]) assignmentsByDay[day] = [];
                    assignmentsByDay[day].push(a);
                  }
                }
                // También considerar specific_schedule para asignaciones recurrentes
                if (a.specific_schedule) {
                  daysArray.forEach(dayNum => {
                    const date = new Date(year, month - 1, dayNum);
                    const weekDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
                    const dayKey = weekDays[getCorrectDayOfWeek(date)] as WeekDay;
                    const times = getScheduleForDay(a.specific_schedule, dayKey);
                    if (times && times.length > 0) {
                      if (!assignmentsByDay[dayNum]) assignmentsByDay[dayNum] = [];
                      // Evitar duplicados si ya se añadió por start_date
                      if (!assignmentsByDay[dayNum].some(ass => ass.id === a.id)) {
                        assignmentsByDay[dayNum].push(a);
                      }
                    } else if (a.start_date) {
                      // Si no hay horario pero el start_date coincide con ese día
                      const start = new Date(a.start_date);
                      if (
                        start.getFullYear() === year &&
                        start.getMonth() + 1 === month &&
                        start.getDate() === dayNum
                      ) {
                        if (!assignmentsByDay[dayNum]) assignmentsByDay[dayNum] = [];
                        if (!assignmentsByDay[dayNum].some(ass => ass.id === a.id)) {
                          assignmentsByDay[dayNum].push(a);
                        }
                      }
                    }
                  });
                }
              });
              if (monthlyViewType === 'grid') {
                // Render cuadrícula mensual
                return (
                  <div>
                    <div className="grid grid-cols-7 gap-2 mb-2 text-xs text-slate-500">
                      <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {(() => {
                        const firstDay = new Date(year, month - 1, 1).getDay();
                        const blanks = (firstDay + 6) % 7;
                        const cells = [];
                        for (let i = 0; i < blanks; i++) {
                          cells.push(<div key={`blank-${i}`}></div>);
                        }
                        daysArray.forEach(dayNum => {
                          const dayAssignments = assignmentsByDay[dayNum] || [];
                          // Agrupación
                          let grouped: [string, Assignment[]][] = [];
                          if (groupBy === 'worker') {
                            grouped = Object.entries(dayAssignments.reduce((acc, a) => {
                              const key = a.worker?.id || 'Sin trabajadora';
                              if (!acc[key]) acc[key] = [];
                              acc[key].push(a);
                              return acc;
                            }, {} as Record<string, Assignment[]>));
                          } else if (groupBy === 'user') {
                            grouped = Object.entries(dayAssignments.reduce((acc, a) => {
                              const key = a.user?.id || 'Sin usuario';
                              if (!acc[key]) acc[key] = [];
                              acc[key].push(a);
                              return acc;
                            }, {} as Record<string, Assignment[]>));
                          } else {
                            grouped = dayAssignments.map((a, idx) => [`${a.id}-${dayNum}-${idx}`, [a]]);
                          }
                          cells.push(
                            <div key={`day-${dayNum}`} className="border rounded min-h-[80px] p-1 flex flex-col bg-white">
                              <div className="font-bold text-xs mb-1 text-slate-700">{dayNum}</div>
                              {grouped.length === 0 ? (
                                <div className="text-slate-300 text-xs">—</div>
                              ) : (
                                grouped.map(([groupKey, groupAssignments]: [string, Assignment[]], groupIdx) => (
                                  <div key={`group-${groupKey}-${dayNum}-${groupIdx}`} className="mb-1">
                                    {groupBy !== 'none' && (
                                      <div className="text-[10px] font-semibold text-slate-500 truncate mb-0.5">
                                        {groupBy === 'worker'
                                          ? groupAssignments[0].worker?.name + ' ' + groupAssignments[0].worker?.surname
                                          : groupAssignments[0].user?.name + ' ' + groupAssignments[0].user?.surname}
                                      </div>
                                    )}
                                    {sortAssignmentsByTime(groupAssignments, getDayKey(new Date(year, month - 1, dayNum))).map((a, idx) => {
                                      const weekDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
                                      const dayKey = weekDays[getCorrectDayOfWeek(new Date(year, month - 1, dayNum))] as WeekDay;
                                      const times = getScheduleForDay(a.specific_schedule, dayKey);
                                      return (
                                        <div key={`a-${a.id}-${dayNum}-${groupKey}-${idx}`} className="text-[10px] text-slate-700 truncate">
                                          <div className="font-medium">{renderScheduleTimes(times)}</div>
                                          {groupBy === 'none' && (
                                            <div className="text-[8px] text-slate-500">
                                              {a.user?.name} {a.user?.surname}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                ))
                              )}
                            </div>
                          );
                        });
                        return cells;
                      })()}
                    </div>
                  </div>
                );
              } else {
                // Render lista mensual agrupada por día
                return (
                  <div className="space-y-4">
                    {daysArray.map(dayNum => {
                      const dayAssignments = assignmentsByDay[dayNum] || [];
                      if (dayAssignments.length === 0) return null;
                      // Agrupación
                      let grouped: [string, Assignment[]][] = [];
                      if (groupBy === 'worker') {
                        grouped = Object.entries(dayAssignments.reduce((acc, a) => {
                          const key = a.worker?.id || 'Sin trabajadora';
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(a);
                          return acc;
                        }, {} as Record<string, Assignment[]>));
                      } else if (groupBy === 'user') {
                        grouped = Object.entries(dayAssignments.reduce((acc, a) => {
                          const key = a.user?.id || 'Sin usuario';
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(a);
                          return acc;
                        }, {} as Record<string, Assignment[]>));
                      } else {
                        grouped = dayAssignments.map((a, idx) => [`${a.id}-${dayNum}-${idx}`, [a]]);
                      }
                      return (
                        <div key={`list-day-${dayNum}`} className="border rounded bg-white p-2">
                          <div className="font-bold text-slate-700 mb-1 text-sm">
                            {dayNum} {selectedDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                          </div>
                          {grouped.map(([groupKey, groupAssignments], groupIdx) => (
                            <div key={`list-group-${groupKey}-${dayNum}-${groupIdx}`} className="mb-1">
                              {groupBy !== 'none' && (
                                <div className="text-xs font-semibold text-slate-500 truncate mb-0.5">
                                  {groupBy === 'worker'
                                    ? groupAssignments[0].worker?.name + ' ' + groupAssignments[0].worker?.surname
                                    : groupAssignments[0].user?.name + ' ' + groupAssignments[0].user?.surname}
                                </div>
                              )}
                              {sortAssignmentsByTime(groupAssignments, getDayKey(new Date(year, month - 1, dayNum))).map((a, idx) => {
                                const weekDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
                                const dayKey = weekDays[getCorrectDayOfWeek(new Date(year, month - 1, dayNum))] as WeekDay;
                                const times = getScheduleForDay(a.specific_schedule, dayKey);
                                return (
                                  <div key={`list-a-${a.id}-${dayNum}-${groupKey}-${idx}`} className="text-xs text-slate-700 truncate">
                                    <div className="font-medium">{renderScheduleTimes(times)}</div>
                                    {groupBy === 'none' && (
                                      <div className="text-[10px] text-slate-500">
                                        {a.user?.name} {a.user?.surname} - {a.worker?.name} {a.worker?.surname}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              }
            })()
          )
        )}
      </div>

      <Link href="/dashboard/assignments/new">
        <Button className="fixed bottom-24 right-6 rounded-full shadow-lg bg-green-600 hover:bg-green-700 w-14 h-14 p-0 flex items-center justify-center z-50" size="sm">
          <Plus className="w-7 h-7" />
        </Button>
      </Link>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <nav className="flex justify-around py-2">
          <Button variant="secondary" className="flex flex-col items-center text-xs" onClick={() => setDrawer('workers')}>
            <Users className="w-5 h-5 mb-1" />
            Trabajadoras
          </Button>
          <Button variant="secondary" className="flex flex-col items-center text-xs" onClick={() => setDrawer('users')}>
            <UserIcon className="w-5 h-5 mb-1" />
            Usuarios
          </Button>
          <Button variant="secondary" className="flex flex-col items-center text-xs" onClick={() => setDrawer('conflicts')}>
            <AlertTriangle className="w-5 h-5 mb-1" />
            Conflictos
          </Button>
          <Button variant="secondary" className="flex flex-col items-center text-xs" onClick={() => setDrawer('settings')}>
            <Settings className="w-5 h-5 mb-1" />
            Ajustes
          </Button>
        </nav>
      </div>

      {/* Drawers funcionales */}
      <BottomDrawer open={drawer === 'workers'} onClose={() => setDrawer(null)} title="Trabajadoras">
        <input
          type="text"
          placeholder="Buscar trabajadora..."
          className="w-full mb-3 px-3 py-2 border rounded"
          value={workerSearch}
          onChange={e => setWorkerSearch(e.target.value)}
        />
        <div className="space-y-2">
          {filteredWorkers.length === 0 ? (
            <div className="text-slate-400 text-center py-6">No hay trabajadoras</div>
          ) : (
            filteredWorkers.map(w => (
              <div key={w.id} className="flex items-center justify-between border rounded px-3 py-2">
                <div>
                  <div className="font-medium">{w.name} {w.surname}</div>
                  {w.email && <div className="text-xs text-slate-500">{w.email}</div>}
                </div>
                <div className="flex gap-1">
                  <Link href={`/dashboard/workers/${w.id}`}><Button size="sm" variant="secondary">Ver</Button></Link>
                  <Link href={`/dashboard/workers/${w.id}/edit`}><Button size="sm" variant="secondary">Editar</Button></Link>
                </div>
              </div>
            ))
          )}
        </div>
      </BottomDrawer>
      <BottomDrawer open={drawer === 'users'} onClose={() => setDrawer(null)} title="Usuarios">
        <input
          type="text"
          placeholder="Buscar usuario..."
          className="w-full mb-3 px-3 py-2 border rounded"
          value={userSearch}
          onChange={e => setUserSearch(e.target.value)}
        />
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-slate-400 text-center py-6">No hay usuarios</div>
          ) : (
            filteredUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between border rounded px-3 py-2">
                <div>
                  <div className="font-medium">{u.name} {u.surname}</div>
                  {u.phone && <div className="text-xs text-slate-500">{u.phone}</div>}
                </div>
                <div className="flex gap-1">
                  <Link href={`/dashboard/users/${u.id}`}><Button size="sm" variant="secondary">Ver</Button></Link>
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedUser(u); setShowAssignModal(true); }}>Asignar</Button>
                  <Link href={`/dashboard/users/${u.id}/edit`}><Button size="sm" variant="secondary">Editar</Button></Link>
                </div>
              </div>
            ))
          )}
        </div>
      </BottomDrawer>
      <BottomDrawer open={drawer === 'conflicts'} onClose={() => setDrawer(null)} title="Conflictos">
        {conflicts.length === 0 ? (
          <div className="text-slate-400 text-center py-6">No hay conflictos detectados</div>
        ) : (
          <div className="space-y-2">
            {conflicts.map((c, i) => (
              <div key={i} className="border rounded px-3 py-2">
                <div className="font-medium mb-1">{c.type}</div>
                <div className="text-xs text-slate-500 mb-1">{c.description}</div>
                <div className="text-xs text-slate-400 mb-2">
                  {c.assignments.map(a => (
                    <div key={a.id}>
                      Asignación: {a.user?.name} {a.user?.surname} - {a.worker?.name} {a.worker?.surname}
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="secondary" onClick={() => setResolveModal({ open: true, conflict: c })}>
                  Resolver
                </Button>
              </div>
            ))}
          </div>
        )}
      </BottomDrawer>
      <BottomDrawer open={drawer === 'settings'} onClose={() => setDrawer(null)} title="Ajustes">
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vista del planning</label>
            <select
              className="border rounded px-2 py-1 text-sm w-full"
              value={viewMode}
              onChange={e => setViewMode(e.target.value as 'day' | 'week' | 'month')}
            >
              <option value="day">Día</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Agrupar asignaciones por</label>
            <select
              className="border rounded px-2 py-1 text-sm w-full"
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as 'none' | 'worker' | 'user')}
            >
              <option value="none">Ninguno</option>
              <option value="worker">Trabajadora</option>
              <option value="user">Usuario</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Filtrar por trabajadora</label>
            <input
              type="text"
              className="border rounded px-2 py-1 text-sm w-full mb-1"
              placeholder="Buscar trabajadora..."
              value={filterWorkerId ? (workers?.find(w => w.id === filterWorkerId)?.name + ' ' + workers?.find(w => w.id === filterWorkerId)?.surname) : filterWorkerSearch}
              onChange={e => {
                setFilterWorkerSearch(e.target.value);
                setFilterWorkerId('');
              }}
              onFocus={e => e.target.select()}
              autoComplete="off"
            />
            {filterWorkerSearch !== '' && !filterWorkerId && (
              <div className="relative">
                <div className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                  <button className="w-full text-left px-3 py-1 text-sm hover:bg-slate-100" onClick={() => { setFilterWorkerId(''); setFilterWorkerSearch(''); }}>Todas</button>
                  {workers?.filter(w => (w.name + ' ' + w.surname).toLowerCase().includes(filterWorkerSearch.toLowerCase())).map(w => (
                    <button key={w.id} className="w-full text-left px-3 py-1 text-sm hover:bg-slate-100" onClick={() => { setFilterWorkerId(w.id); setFilterWorkerSearch(''); }}>{w.name} {w.surname}</button>
                  ))}
                </div>
              </div>
            )}
            {filterWorkerId && (
              <div className="mt-1">
                <button className="text-xs text-blue-600 underline" onClick={() => { setFilterWorkerId(''); setFilterWorkerSearch(''); }}>Quitar filtro</button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Filtrar por usuario</label>
            <input
              type="text"
              className="border rounded px-2 py-1 text-sm w-full mb-1"
              placeholder="Buscar usuario..."
              value={filterUserId ? (users?.find(u => u.id === filterUserId)?.name + ' ' + users?.find(u => u.id === filterUserId)?.surname) : filterUserSearch}
              onChange={e => {
                setFilterUserSearch(e.target.value);
                setFilterUserId('');
              }}
              onFocus={e => e.target.select()}
              autoComplete="off"
            />
            {filterUserSearch !== '' && !filterUserId && (
              <div className="relative">
                <div className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                  <button className="w-full text-left px-3 py-1 text-sm hover:bg-slate-100" onClick={() => { setFilterUserId(''); setFilterUserSearch(''); }}>Todos</button>
                  {users?.filter(u => (u.name + ' ' + u.surname).toLowerCase().includes(filterUserSearch.toLowerCase())).map(u => (
                    <button key={u.id} className="w-full text-left px-3 py-1 text-sm hover:bg-slate-100" onClick={() => { setFilterUserId(u.id); setFilterUserSearch(''); }}>{u.name} {u.surname}</button>
                  ))}
                </div>
              </div>
            )}
            {filterUserId && (
              <div className="mt-1">
                <button className="text-xs text-blue-600 underline" onClick={() => { setFilterUserId(''); setFilterUserSearch(''); }}>Quitar filtro</button>
              </div>
            )}
          </div>
        </div>
      </BottomDrawer>
      {/* Modal para asignar usuario a trabajadora */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Asignar usuario">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <div className="font-bold text-lg">Asignar usuario</div>
              <button onClick={() => { setShowAssignModal(false); setAssignHours(''); setAssignStartDate(''); setSelectedWorker(null); setWorkerSearch(''); }} className="p-2 rounded-full hover:bg-slate-100" aria-label="Cerrar">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mb-4">Selecciona una trabajadora para asignar a <span className="font-medium">{selectedUser?.name} {selectedUser?.surname}</span>:</div>
            {/* Combobox de trabajadora */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Buscar trabajadora..."
                className="w-full border rounded px-3 py-2"
                value={workerSearch}
                onChange={e => {
                  setWorkerSearch(e.target.value);
                  setSelectedWorker(null);
                }}
                autoFocus
              />
              {workerSearch && (
                <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredWorkers.length === 0 ? (
                    <div className="text-slate-400 text-center py-2">No hay trabajadoras</div>
                  ) : (
                    filteredWorkers.map(w => (
                      <button
                        key={w.id}
                        className={`w-full text-left px-4 py-2 hover:bg-slate-100 ${selectedWorker?.id === w.id ? 'bg-slate-200' : ''}`}
                        onClick={() => { setSelectedWorker(w); setWorkerSearch(`${w.name} ${w.surname}`); }}
                        type="button"
                      >
                        {w.name} {w.surname} {w.email && <span className="text-xs text-slate-500 ml-2">{w.email}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* Fin combobox */}
            <input
              type="number"
              min="1"
              max="40"
              placeholder="Horas semanales asignadas"
              className="w-full border rounded px-3 py-2 mb-4"
              value={assignHours}
              onChange={e => setAssignHours(e.target.value)}
            />
            <input
              type="date"
              className="w-full border rounded px-3 py-2 mb-4"
              value={assignStartDate}
              onChange={e => setAssignStartDate(e.target.value)}
            />
            <Button className="w-full" loading={assignLoading} disabled={assignLoading}
              onClick={async () => {
                if (!selectedUser || !selectedWorker || !assignHours || !assignStartDate) {
                  showToast('Completa todos los campos', 'warning');
                  return;
                }
                setAssignLoading(true);
                const { error } = await createAssignment({
                  worker_id: selectedWorker.id,
                  user_id: selectedUser.id,
                  assigned_hours_per_week: Number(assignHours),
                  start_date: assignStartDate,
                  priority: 2,
                  status: 'active',
                });
                setAssignLoading(false);
                if (error) {
                  showToast(error, 'error');
                } else {
                  showToast('Asignación creada correctamente', 'success');
                  setShowAssignModal(false);
                  setAssignHours('');
                  setAssignStartDate('');
                  setSelectedWorker(null);
                  setWorkerSearch('');
                }
              }}
            >Asignar</Button>
          </div>
        </div>
      )}

      {/* Modal de resolución de conflicto */}
      {resolveModal.open && resolveModal.conflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Resolver conflicto">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <div className="font-bold text-lg">Resolver conflicto</div>
              <button onClick={() => setResolveModal({ open: false, conflict: null })} className="p-2 rounded-full hover:bg-slate-100" aria-label="Cerrar">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mb-4 text-sm text-slate-700">{resolveModal.conflict.description}</div>
            <div className="space-y-3 mb-4">
              {resolveModal.conflict.assignments.map((a: Assignment) => (
                <div key={a.id} className="border rounded px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-medium">{a.user?.name} {a.user?.surname} - {a.worker?.name} {a.worker?.surname}</div>
                    <div className="text-xs text-slate-500">Inicio: {a.start_date} | Horas/sem: {a.assigned_hours_per_week}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => window.location.href = `/dashboard/assignments/${a.id}/edit`}>Editar</Button>
                    <Button size="sm" variant="danger" loading={deletingAssignmentId === a.id} disabled={deletingAssignmentId === a.id}
                      onClick={() => setDeleteConfirm({ open: true, assignment: a })}
                    >Eliminar</Button>
                    <Button size="sm" variant="success" onClick={() => setReassignState({ assignmentId: a.id, workerId: '', loading: false })}>Reasignar</Button>
                  </div>
                  {/* Combobox de reasignación */}
                  {reassignState.assignmentId === a.id && (
                    <div className="mt-2 flex flex-col gap-2">
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={reassignState.workerId}
                        onChange={e => setReassignState(s => ({ ...s, workerId: e.target.value }))}
                      >
                        <option value="">Selecciona nueva trabajadora</option>
                        {workers.filter(w => w.id !== a.worker_id).map(w => (
                          <option key={w.id} value={w.id}>{w.name} {w.surname}</option>
                        ))}
                      </select>
                      <Button size="sm" variant="success" loading={reassignState.loading} disabled={!reassignState.workerId || reassignState.loading}
                        onClick={async () => {
                          setReassignState(s => ({ ...s, loading: true }));
                          const { error } = await updateAssignment(a.id, { worker_id: reassignState.workerId });
                          setReassignState({ assignmentId: null, workerId: '', loading: false });
                          if (error) {
                            showToast(error, 'error');
                          } else {
                            showToast('Trabajadora reasignada correctamente', 'success');
                            setResolveModal({ open: false, conflict: null });
                          }
                        }}
                      >Confirmar reasignación</Button>
                      <Button size="sm" variant="secondary" onClick={() => setReassignState({ assignmentId: null, workerId: '', loading: false })}>Cancelar</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button className="w-full" variant="secondary" onClick={() => setResolveModal({ open: false, conflict: null })}>Cerrar</Button>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, assignment: null })}
        title="Eliminar asignación"
        message={`¿Seguro que quieres eliminar la asignación de ${deleteConfirm.assignment?.user?.name} ${deleteConfirm.assignment?.user?.surname} - ${deleteConfirm.assignment?.worker?.name} ${deleteConfirm.assignment?.worker?.surname}? Esta acción no se puede deshacer.`}
        type="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={async () => {
          if (!deleteConfirm.assignment) return;
          setDeletingAssignmentId(deleteConfirm.assignment.id);
          const { error } = await deleteAssignment(deleteConfirm.assignment.id);
          setDeletingAssignmentId(null);
          setDeleteConfirm({ open: false, assignment: null });
          if (error) {
            showToast(error, 'error');
          } else {
            showToast('Asignación eliminada', 'success');
            setResolveModal({ open: false, conflict: null });
          }
        }}
        icon={undefined}
      />

      {ToastComponent}
      </main>
    </div>
  )
} 