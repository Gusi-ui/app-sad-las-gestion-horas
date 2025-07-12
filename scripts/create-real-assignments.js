const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Datos de las asignaciones reales
const realAssignments = [
  {
    worker_name: 'Rosa María Robles Muñoz',
    user_name: 'Jose Martínez Blanquez',
    assignment_type: 'laborables',
    start_date: '2025-01-01',
    end_date: null, // Sin fecha de fin (asignación continua)
    weekly_hours: 12, // 12 horas semanales (lunes a viernes)
    schedule: {
      monday: { enabled: true, timeSlots: [{ start: '09:00', end: '11:00' }] },
      tuesday: { enabled: true, timeSlots: [{ start: '09:00', end: '11:00' }] },
      wednesday: { enabled: true, timeSlots: [{ start: '09:00', end: '11:00' }] },
      thursday: { enabled: true, timeSlots: [{ start: '09:00', end: '11:00' }] },
      friday: { enabled: true, timeSlots: [{ start: '09:00', end: '11:00' }] },
      saturday: { enabled: false, timeSlots: [{ start: '08:00', end: '09:00' }] },
      sunday: { enabled: false, timeSlots: [{ start: '08:00', end: '09:00' }] }
    },
    notes: 'Asignación principal para cuidado de discapacidad. Horario de mañana estable.'
  },
  {
    worker_name: 'Graciela Petri',
    user_name: 'Maria Caparros',
    assignment_type: 'flexible',
    start_date: '2025-01-01',
    end_date: null,
    weekly_hours: 7, // 7 horas semanales (martes y jueves)
    schedule: {
      monday: { enabled: false, timeSlots: [{ start: '08:00', end: '09:00' }] },
      tuesday: { enabled: true, timeSlots: [{ start: '10:00', end: '13:30' }] },
      wednesday: { enabled: false, timeSlots: [{ start: '08:00', end: '09:00' }] },
      thursday: { enabled: true, timeSlots: [{ start: '10:00', end: '13:30' }] },
      friday: { enabled: false, timeSlots: [{ start: '08:00', end: '09:00' }] },
      saturday: { enabled: false, timeSlots: [{ start: '08:00', end: '09:00' }] },
      sunday: { enabled: false, timeSlots: [{ start: '08:00', end: '09:00' }] }
    },
    notes: 'Ayuda doméstica para persona con fibromialgia. Horario flexible de mañana.'
  }
]

async function createRealAssignments() {
  console.log('🚀 Creando asignaciones reales entre trabajadoras y usuarios...\n')

  try {
    // Obtener trabajadoras
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, surname, is_active')
      .eq('is_active', true)

    if (workersError) {
      console.error('❌ Error al obtener trabajadoras:', workersError)
      return
    }

    // Obtener usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, surname, is_active')
      .eq('is_active', true)

    if (usersError) {
      console.error('❌ Error al obtener usuarios:', usersError)
      return
    }

    console.log(`👥 Trabajadoras disponibles: ${workers.length}`)
    workers.forEach(w => console.log(`   - ${w.name} ${w.surname}`))
    
    console.log(`\n👤 Usuarios disponibles: ${users.length}`)
    users.forEach(u => console.log(`   - ${u.name} ${u.surname}`))
    
    console.log('\n' + '─'.repeat(80))

    // Crear cada asignación
    for (const assignment of realAssignments) {
      console.log(`\n🔗 Creando asignación: ${assignment.worker_name} → ${assignment.user_name}`)
      
      // Encontrar trabajadora
      const worker = workers.find(w => 
        `${w.name} ${w.surname}` === assignment.worker_name
      )
      
      if (!worker) {
        console.error(`   ❌ Trabajadora no encontrada: ${assignment.worker_name}`)
        continue
      }

      // Encontrar usuario
      const user = users.find(u => 
        `${u.name} ${u.surname}` === assignment.user_name
      )
      
      if (!user) {
        console.error(`   ❌ Usuario no encontrado: ${assignment.user_name}`)
        continue
      }

      // Verificar si ya existe la asignación
      const { data: existingAssignment } = await supabase
        .from('assignments')
        .select('id')
        .eq('worker_id', worker.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (existingAssignment) {
        console.log(`   ⚠️ Asignación ya existe entre ${assignment.worker_name} y ${assignment.user_name}`)
        continue
      }

      // Crear la asignación
      const { data: newAssignment, error: createError } = await supabase
        .from('assignments')
        .insert({
          worker_id: worker.id,
          user_id: user.id,
          assignment_type: assignment.assignment_type,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          weekly_hours: assignment.weekly_hours,
          schedule: assignment.schedule,
          status: 'active',
          priority: 2,
          notes: assignment.notes
        })
        .select()
        .single()

      if (createError) {
        console.error(`   ❌ Error al crear asignación:`, createError)
        continue
      }

      console.log(`   ✅ Asignación creada correctamente`)
      console.log(`      📅 Tipo: ${assignment.assignment_type}`)
      console.log(`      ⏰ Horas semanales: ${assignment.weekly_hours}h`)
      console.log(`      🗓️ Fecha inicio: ${assignment.start_date}`)
      console.log(`      📝 Notas: ${assignment.notes}`)
      
      // Mostrar horario detallado
      const enabledDays = Object.entries(assignment.schedule)
        .filter(([day, config]) => config.enabled)
        .map(([day, config]) => {
          const dayNames = {
            monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
            thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
          }
          const timeSlots = config.timeSlots.map(slot => `${slot.start}-${slot.end}`).join(', ')
          return `${dayNames[day]}: ${timeSlots}`
        })
      
      console.log(`      📋 Horario: ${enabledDays.join(', ')}`)
    }

    console.log('\n🎉 Proceso de creación de asignaciones completado!')
    console.log('💡 Ejecuta "node scripts/check-assignments.js" para verificar los resultados')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

createRealAssignments() 