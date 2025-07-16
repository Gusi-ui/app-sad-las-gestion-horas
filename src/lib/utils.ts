import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export function calculateRemainingHours(
  totalHours: number,
  usedHours: number
): number {
  return Math.max(0, totalHours - usedHours)
}

// Función para ordenar los días de la semana correctamente (lunes a domingo)
export function getOrderedWeekDays(): string[] {
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
}

// Función para formatear horarios ordenados cronológicamente
export function formatScheduleOrdered(schedule: Record<string, unknown[]> | undefined, dayNames: Record<string, string>): string {
  if (!schedule) return 'No configurado'
  
  const dayOrder = getOrderedWeekDays()
  
  const formattedDays = dayOrder
    .filter(day => {
      const hasData = schedule[day] && Array.isArray(schedule[day]) && schedule[day].length > 0;
      return hasData;
    })
    .map(day => {
      const slots = schedule[day]
      
      // Caso 1: Array de strings (formato antiguo) - ['08:00', '10:00', '13:00', '15:00']
      if (Array.isArray(slots) && slots.length > 0 && typeof slots[0] === 'string') {
        if (slots.length === 2) {
          // Un solo tramo: ['08:00', '10:00']
          return `${dayNames[day]}: ${slots[0]} - ${slots[1]}`
        } else if (slots.length > 2 && slots.length % 2 === 0) {
          const timeSlots = [];
          for (let i = 0; i < slots.length; i += 2) {
            if (typeof slots[i] === 'string' && typeof slots[i+1] === 'string') {
              timeSlots.push(`${slots[i]} - ${slots[i+1]}`);
            }
          }
          return `${dayNames[day]}: ${timeSlots.join(' y ')}`
        } else {
          // Formato desconocido, mostrar como está
          return `${dayNames[day]}: ${slots.join(', ')}`
        }
      } 
      // Caso 2: Array de objetos {start, end} (formato nuevo)
      else if (Array.isArray(slots) && slots.length > 0 && typeof slots[0] === 'object' && slots[0] !== null && 'start' in slots[0] && 'end' in slots[0]) {
        const timeSlots = (slots as { start: string; end: string }[]).map((slot) => `${slot.start} - ${slot.end}`);
        return `${dayNames[day]}: ${timeSlots.join(' y ')}`
      } 
      // Caso 3: Otros formatos
      else {
        return `${dayNames[day]}: ${JSON.stringify(slots)}`
      }
    })
    .filter(Boolean)
  
  return formattedDays.join(' | ')
}

// Funciones para cálculo de horas
export interface HoursCalculation {
  weeklyHours: number;
  monthlyHours: number;
  usedHours: number;
  remainingHours: number;
  status: 'excess' | 'deficit' | 'perfect';
  percentage: number;
}

/**
 * Calcula las horas semanales basadas en el horario específico
 */
export function calculateWeeklyHours(schedule: Record<string, unknown[]> | undefined): number {
  if (!schedule) return 0;
  
  let totalHours = 0;
  
  Object.values(schedule).forEach(daySchedule => {
    if (!Array.isArray(daySchedule) || daySchedule.length === 0) return;
    
    // Caso 1: Array de objetos {start, end} (formato nuevo)
    if (typeof daySchedule[0] === 'object' && daySchedule[0] !== null && 'start' in daySchedule[0] && 'end' in daySchedule[0]) {
      (daySchedule as { start: string; end: string }[]).forEach((slot) => {
        const [startHour, startMin] = slot.start.split(':').map(Number);
        const [endHour, endMin] = slot.end.split(':').map(Number);
        const startTime = startHour + startMin / 60;
        const endTime = endHour + endMin / 60;
        totalHours += Math.max(0, endTime - startTime);
      });
    }
    // Caso 2: Array de strings (formato antiguo) - ['08:00', '10:00']
    else if (daySchedule.length === 2 && typeof daySchedule[0] === 'string' && typeof daySchedule[1] === 'string') {
      const [startHour, startMin] = (daySchedule[0] as string).split(':').map(Number);
      const [endHour, endMin] = (daySchedule[1] as string).split(':').map(Number);
      const startTime = startHour + startMin / 60;
      const endTime = endHour + endMin / 60;
      totalHours += Math.max(0, endTime - startTime);
    }
    // Caso 3: Array de strings múltiples - ['08:00-10:00', '13:00-15:00']
    else if (Array.isArray(daySchedule) && daySchedule.length > 0 && typeof daySchedule[0] === 'string') {
      (daySchedule as string[]).forEach((slot) => {
        if (slot.includes('-')) {
          const parts = slot.split('-');
          if (parts.length === 2) {
            const [startHour, startMin] = parts[0].split(':').map(Number);
            const [endHour, endMin] = parts[1].split(':').map(Number);
            const startTime = startHour + startMin / 60;
            const endTime = endHour + endMin / 60;
            totalHours += Math.max(0, endTime - startTime);
          }
        }
      });
    }
  });
  
  return Math.round(totalHours * 10) / 10; // Redondear a 1 decimal
}

/**
 * Calcula las horas mensuales basadas en las horas semanales
 */
export function calculateMonthlyHours(weeklyHours: number): number {
  // Aproximadamente 4.3 semanas por mes
  return Math.round(weeklyHours * 4.3 * 10) / 10;
}

/**
 * Calcula el estado completo de horas para un usuario
 */
export function calculateUserHoursStatus(
  monthlyHours: number,
  usedHours: number
): HoursCalculation {
  const remainingHours = monthlyHours - usedHours;
  const percentage = monthlyHours > 0 ? (usedHours / monthlyHours) * 100 : 0;
  
  let status: 'excess' | 'deficit' | 'perfect';
  if (Math.abs(remainingHours) < 0.1) {
    status = 'perfect';
  } else if (remainingHours < 0) {
    status = 'excess';
  } else {
    status = 'deficit';
  }
  
  return {
    weeklyHours: Math.round((usedHours / 4.3) * 10) / 10,
    monthlyHours,
    usedHours,
    remainingHours,
    status,
    percentage: Math.round(percentage * 10) / 10
  };
}

/**
 * Calcula las horas utilizadas hasta el día actual del mes
 */
export function calculateUsedHoursUntilToday(
  schedule: Record<string, unknown[]> | undefined,
  year: number,
  month: number
): number {
  if (!schedule) return 0;
  
  const today = new Date();
  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();
  const lastDayToCount = isCurrentMonth ? today.getDate() : new Date(year, month, 0).getDate();
  
  let totalUsedHours = 0;
  
  // Iterar por cada día del mes hasta hoy (si es el mes actual) o hasta el final del mes
  for (let day = 1; day <= lastDayToCount; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek] as keyof typeof schedule;
    
    const daySchedule = schedule[dayName];
    if (daySchedule && daySchedule.length > 0) {
      // Calcular horas para este día
      let dayHours = 0;
      
      // Caso 1: Array de objetos {start, end}
      if (typeof daySchedule[0] === 'object' && daySchedule[0] !== null && 'start' in daySchedule[0] && 'end' in daySchedule[0]) {
        (daySchedule as { start: string; end: string }[]).forEach((slot) => {
          const [startHour, startMin] = slot.start.split(':').map(Number);
          const [endHour, endMin] = slot.end.split(':').map(Number);
          const startTime = startHour + startMin / 60;
          const endTime = endHour + endMin / 60;
          dayHours += Math.max(0, endTime - startTime);
        });
      }
      // Caso 2: Array de strings - ['08:00', '10:00']
      else if (daySchedule.length === 2 && typeof daySchedule[0] === 'string' && typeof daySchedule[1] === 'string') {
        const [startHour, startMin] = (daySchedule[0] as string).split(':').map(Number);
        const [endHour, endMin] = (daySchedule[1] as string).split(':').map(Number);
        const startTime = startHour + startMin / 60;
        const endTime = endHour + endMin / 60;
        dayHours = Math.max(0, endTime - startTime);
      }
      // Caso 3: Array de strings múltiples - ['08:00-10:00', '13:00-15:00']
      else if (Array.isArray(daySchedule) && daySchedule.length > 0 && typeof daySchedule[0] === 'string') {
        (daySchedule as string[]).forEach((slot) => {
          if (slot.includes('-')) {
            const parts = slot.split('-');
            if (parts.length === 2) {
              const [startHour, startMin] = parts[0].split(':').map(Number);
              const [endHour, endMin] = parts[1].split(':').map(Number);
              const startTime = startHour + startMin / 60;
              const endTime = endHour + endMin / 60;
              dayHours += Math.max(0, endTime - startTime);
            }
          }
        });
      }
      
      totalUsedHours += dayHours;
    }
  }
  
  return Math.round(totalUsedHours * 10) / 10;
} 

// =====================================================
// VALIDACIÓN DE DNI ESPAÑOL
// =====================================================

// Letras válidas del DNI español
const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

// Validar formato de DNI (8 dígitos + 1 letra)
export function isValidDNIFormat(dni: string): boolean {
  if (!dni) return true // Permitir vacío
  return /^\d{8}[A-Z]$/.test(dni.trim().toUpperCase())
}

// Calcular letra de control del DNI
export function calculateDNILetter(numbers: string): string {
  const num = parseInt(numbers)
  return DNI_LETTERS[num % 23]
}

// Validar DNI completo (números + letra correcta)
export function isValidDNI(dni: string): boolean {
  if (!dni) return true // Permitir vacío
  
  const cleanDNI = dni.trim().toUpperCase()
  
  // Verificar formato
  if (!isValidDNIFormat(cleanDNI)) {
    return false
  }
  
  // Extraer números y letra
  const numbers = cleanDNI.substring(0, 8)
  const letter = cleanDNI.substring(8)
  
  // Calcular letra correcta
  const correctLetter = calculateDNILetter(numbers)
  
  return letter === correctLetter
}

// Obtener letra correcta para un DNI
export function getCorrectDNILetter(numbers: string): string {
  if (!/^\d{8}$/.test(numbers)) {
    return ''
  }
  return calculateDNILetter(numbers)
}

// Formatear DNI (añadir guiones, espacios, etc.)
export function formatDNI(dni: string): string {
  if (!dni) return ''
  
  const cleanDNI = dni.replace(/[^0-9A-Z]/gi, '').toUpperCase()
  
  if (cleanDNI.length === 8) {
    // Solo números, añadir letra calculada
    return `${cleanDNI}-${calculateDNILetter(cleanDNI)}`
  } else if (cleanDNI.length === 9) {
    // Números + letra, formatear con guión
    return `${cleanDNI.substring(0, 8)}-${cleanDNI.substring(8)}`
  }
  
  return cleanDNI
}

// =====================================================
// VALIDACIÓN DE CÓDIGOS POSTALES ESPAÑOLES
// =====================================================

// Rangos de códigos postales por provincia
export const POSTAL_CODE_RANGES = {
  'Alicante': [3000, 3699],
  'Almería': [4000, 4999],
  'Asturias': [33000, 33999],
  'Ávila': [5000, 5999],
  'Badajoz': [6000, 6999],
  'Baleares': [7000, 7999],
  'Barcelona': [8000, 8999],
  'Burgos': [9000, 9999],
  'Cáceres': [10000, 10999],
  'Cádiz': [11000, 11999],
  'Cantabria': [39000, 39999],
  'Castellón': [12000, 12999],
  'Ciudad Real': [13000, 13999],
  'Córdoba': [14000, 14999],
  'Cuenca': [16000, 16999],
  'Girona': [17000, 17999],
  'Granada': [18000, 18999],
  'Guadalajara': [19000, 19999],
  'Guipúzcoa': [20000, 20999],
  'Huelva': [21000, 21999],
  'Huesca': [22000, 22999],
  'Jaén': [23000, 23999],
  'La Coruña': [15000, 15999],
  'La Rioja': [26000, 26999],
  'Las Palmas': [35000, 35999],
  'León': [24000, 24999],
  'Lleida': [25000, 25999],
  'Lugo': [27000, 27999],
  'Madrid': [28000, 28999],
  'Málaga': [29000, 29999],
  'Murcia': [30000, 30999],
  'Navarra': [31000, 31999],
  'Ourense': [32000, 32999],
  'Palencia': [34000, 34999],
  'Pontevedra': [36000, 36999],
  'Salamanca': [37000, 37999],
  'Santa Cruz de Tenerife': [38000, 38999],
  'Segovia': [40000, 40999],
  'Sevilla': [41000, 41999],
  'Soria': [42000, 42999],
  'Tarragona': [43000, 43999],
  'Teruel': [44000, 44999],
  'Toledo': [45000, 45999],
  'Valencia': [46000, 46999],
  'Valladolid': [47000, 47999],
  'Vizcaya': [48000, 48999],
  'Zamora': [49000, 49999],
  'Zaragoza': [50000, 50999],
  'Ceuta': [51000, 51999],
  'Melilla': [52000, 52999]
} as const

// Validar formato de código postal (5 dígitos)
export function isValidPostalCodeFormat(postalCode: string): boolean {
  if (!postalCode) return true // Permitir vacío
  return /^\d{5}$/.test(postalCode.trim())
}

// Validar que el código postal existe en España
export function isValidSpanishPostalCode(postalCode: string): boolean {
  if (!postalCode) return true // Permitir vacío
  
  const code = parseInt(postalCode.trim())
  if (isNaN(code)) return false
  
  // Verificar que esté en algún rango válido
  return Object.values(POSTAL_CODE_RANGES).some(([min, max]) => 
    code >= min && code <= max
  )
}

// Obtener provincia por código postal
export function getProvinceByPostalCode(postalCode: string): string | null {
  if (!postalCode) return null
  
  const code = parseInt(postalCode.trim())
  if (isNaN(code)) return null
  
  for (const [province, [min, max]] of Object.entries(POSTAL_CODE_RANGES)) {
    if (code >= min && code <= max) {
      return province
    }
  }
  
  return null
}

// Validar código postal para una provincia específica
export function isValidPostalCodeForProvince(postalCode: string, province: string): boolean {
  if (!postalCode || !province) return true // Permitir vacío
  
  const code = parseInt(postalCode.trim())
  if (isNaN(code)) return false
  
  const range = POSTAL_CODE_RANGES[province as keyof typeof POSTAL_CODE_RANGES]
  if (!range) return false
  
  const [min, max] = range
  return code >= min && code <= max
}

// Obtener sugerencias de códigos postales para una provincia
export function getPostalCodeSuggestions(province: string): string[] {
  const range = POSTAL_CODE_RANGES[province as keyof typeof POSTAL_CODE_RANGES]
  if (!range) return []
  
  const [min, max] = range
  const suggestions = []
  
  // Generar algunos códigos postales comunes para la provincia
  for (let i = min; i <= Math.min(min + 99, max); i += 10) {
    suggestions.push(i.toString().padStart(5, '0'))
  }
  
  return suggestions.slice(0, 5) // Máximo 5 sugerencias
}

// Validación completa de dirección
export function validateAddress(address: {
  street_address?: string
  postal_code?: string
  city?: string
  province?: string
}): {
  isValid: boolean
  errors: {
    street_address?: string
    postal_code?: string
    city?: string
    province?: string
  }
} {
  const errors: {
    street_address?: string
    postal_code?: string
    city?: string
    province?: string
  } = {}
  
  // Validar código postal
  if (address.postal_code) {
    if (!isValidPostalCodeFormat(address.postal_code)) {
      errors.postal_code = 'El código postal debe tener 5 dígitos'
    } else if (!isValidSpanishPostalCode(address.postal_code)) {
      errors.postal_code = 'Código postal no válido en España'
    } else if (address.province && !isValidPostalCodeForProvince(address.postal_code, address.province)) {
      errors.postal_code = `El código postal no corresponde a la provincia seleccionada`;
    }
  }

  // Validar dirección
  if (address.street_address && address.street_address.length < 5) {
    errors.street_address = 'La dirección es demasiado corta';
  }

  // Validar ciudad
  if (address.city && address.city.length < 2) {
    errors.city = 'La ciudad es demasiado corta';
  }

  // Validar provincia
  if (address.province && !(address.province in POSTAL_CODE_RANGES)) {
    errors.province = 'Provincia no válida';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}