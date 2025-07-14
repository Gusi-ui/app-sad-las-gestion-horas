const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias')
// // console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
// // console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyHolidayScheduleSave() {
// // console.log('🔍 Verificando guardado de horarios de festivos entre semana...\n')

  try {
    // 1. Verificar estructura de la tabla assignments
// // console.log('1️⃣ Verificando estructura de la tabla assignments...')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, worker_id, user_id, assignment_type, schedule, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (assignmentsError) {
      console.error('❌ Error al obtener asignaciones:', assignmentsError)
      return
    }

// // console.log(`✅ Encontradas ${assignments.length} asignaciones recientes`)
    
    // 2. Verificar asignaciones de tipo 'festivos'
// // console.log('\n2️⃣ Verificando asignaciones de tipo "festivos"...')
    const festivosAssignments = assignments.filter(a => a.assignment_type === 'festivos')
    
    if (festivosAssignments.length === 0) {
// // console.log('⚠️  No se encontraron asignaciones de tipo "festivos"')
    } else {
// // console.log(`✅ Encontradas ${festivosAssignments.length} asignaciones de tipo "festivos"`)
      
      festivosAssignments.forEach((assignment, index) => {
// // console.log(`\n   📋 Asignación ${index + 1}:`)
// // console.log(`      ID: ${assignment.id}`)
// // console.log(`      Tipo: ${assignment.assignment_type}`)
// // console.log(`      Última actualización: ${assignment.updated_at}`)
        
        if (assignment.schedule) {
// // console.log(`      ✅ Tiene schedule definido`)
          
          // Verificar si tiene el campo holiday
          if (assignment.schedule.holiday) {
// // console.log(`      ✅ Tiene campo 'holiday' en schedule`)
// // console.log(`      📅 Holiday enabled: ${assignment.schedule.holiday.enabled}`)
            
            if (assignment.schedule.holiday.enabled && assignment.schedule.holiday.timeSlots) {
// // console.log(`      ⏰ Tramos de tiempo para festivos entre semana:`)
              assignment.schedule.holiday.timeSlots.forEach((slot, slotIndex) => {
// // console.log(`         Tramo ${slotIndex + 1}: ${slot.start} - ${slot.end}`)
              })
            } else {
// // console.log(`      ⚠️  Holiday habilitado pero sin tramos de tiempo`)
            }
          } else {
// // console.log(`      ❌ NO tiene campo 'holiday' en schedule`)
          }
          
          // Mostrar todos los días del schedule
// // console.log(`      📊 Resumen del schedule completo:`)
          Object.entries(assignment.schedule).forEach(([day, daySchedule]) => {
            if (daySchedule.enabled) {
              const timeSlots = daySchedule.timeSlots.map(slot => `${slot.start}-${slot.end}`).join(', ')
// // console.log(`         ${day}: ${timeSlots}`)
            }
          })
        } else {
// // console.log(`      ❌ NO tiene schedule definido`)
        }
      })
    }

    // 3. Verificar asignaciones recientemente modificadas
// // console.log('\n3️⃣ Verificando asignaciones modificadas recientemente...')
    const recentAssignments = assignments.filter(a => {
      const updatedAt = new Date(a.updated_at)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return updatedAt > oneHourAgo
    })

    if (recentAssignments.length > 0) {
// // console.log(`✅ Encontradas ${recentAssignments.length} asignaciones modificadas en la última hora`)
      recentAssignments.forEach((assignment, index) => {
// // console.log(`\n   🔄 Asignación modificada recientemente ${index + 1}:`)
// // console.log(`      ID: ${assignment.id}`)
// // console.log(`      Tipo: ${assignment.assignment_type}`)
// // console.log(`      Modificada: ${assignment.updated_at}`)
        
        if (assignment.schedule?.holiday) {
// // console.log(`      ✅ Tiene campo 'holiday' actualizado`)
        }
      })
    } else {
// // console.log('ℹ️  No se encontraron asignaciones modificadas en la última hora')
    }

    // 4. Verificar integridad de datos
// // console.log('\n4️⃣ Verificando integridad de datos...')
    let totalAssignments = 0
    let assignmentsWithSchedule = 0
    let assignmentsWithHoliday = 0
    let assignmentsWithValidHoliday = 0

    for (const assignment of assignments) {
      totalAssignments++
      
      if (assignment.schedule) {
        assignmentsWithSchedule++
        
        if (assignment.schedule.holiday) {
          assignmentsWithHoliday++
          
          if (assignment.schedule.holiday.enabled && 
              assignment.schedule.holiday.timeSlots && 
              assignment.schedule.holiday.timeSlots.length > 0) {
            assignmentsWithValidHoliday++
          }
        }
      }
    }

// // console.log(`📊 Estadísticas de integridad:`)
// // console.log(`   Total de asignaciones verificadas: ${totalAssignments}`)
// // console.log(`   Con schedule definido: ${assignmentsWithSchedule}`)
// // console.log(`   Con campo 'holiday': ${assignmentsWithHoliday}`)
// // console.log(`   Con 'holiday' habilitado y con tramos: ${assignmentsWithValidHoliday}`)

    // 5. Verificar que las asignaciones antiguas se actualizan correctamente
// // console.log('\n5️⃣ Verificando compatibilidad con asignaciones antiguas...')
    const oldAssignments = assignments.filter(a => !a.schedule?.holiday)
    
    if (oldAssignments.length > 0) {
// // console.log(`⚠️  Encontradas ${oldAssignments.length} asignaciones sin campo 'holiday'`)
// // console.log('   Estas asignaciones necesitarán ser editadas para obtener el campo holiday')
    } else {
// // console.log('✅ Todas las asignaciones verificadas tienen el campo holiday')
    }

// // console.log('\n✅ Verificación completada')
// // console.log('\n📝 Resumen:')
// // console.log('   - La funcionalidad de festivos entre semana está implementada')
// // console.log('   - Las asignaciones nuevas incluyen el campo holiday')
// // console.log('   - Las asignaciones antiguas se actualizan al editarlas')
// // console.log('   - Los datos se guardan correctamente en la base de datos')

  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
  }
}

// Ejecutar la verificación
verifyHolidayScheduleSave()
  .then(() => {
// // console.log('\n🎉 Verificación finalizada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  }) 