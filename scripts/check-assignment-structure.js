const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAssignmentStructure() {
  console.log('🔍 Verificando estructura de la tabla assignments...\n');
  
  try {
    // Obtener una muestra de asignaciones para ver la estructura
    const { data: sampleAssignments, error: sampleError } = await supabase
      .from('assignments')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.log('❌ Error obteniendo muestra:', sampleError.message);
      return;
    }
    
    if (sampleAssignments && sampleAssignments.length > 0) {
      console.log('📋 Estructura de la tabla assignments:');
      console.log('Columnas disponibles:', Object.keys(sampleAssignments[0]));
      console.log('\n📊 Muestra de datos:');
      sampleAssignments.forEach((assignment, index) => {
        console.log(`\n--- Asignación ${index + 1} ---`);
        console.log('ID:', assignment.id);
        console.log('Worker ID:', assignment.worker_id);
        console.log('User ID:', assignment.user_id);
        console.log('Status:', assignment.status);
        console.log('Assignment Type:', assignment.assignment_type);
        console.log('Schedule:', assignment.schedule);
        console.log('Specific Schedule:', assignment.specific_schedule);
        console.log('Start Date:', assignment.start_date);
        console.log('End Date:', assignment.end_date);
      });
    } else {
      console.log('ℹ️  La tabla assignments está vacía');
    }
    
    // Verificar si hay asignaciones activas para una trabajadora específica
    console.log('\n🔍 Buscando asignaciones activas...');
    const { data: activeAssignments, error: activeError } = await supabase
      .from('assignments')
      .select('*')
      .eq('status', 'active')
      .limit(5);
    
    if (activeError) {
      console.log('❌ Error obteniendo asignaciones activas:', activeError.message);
    } else if (activeAssignments && activeAssignments.length > 0) {
      console.log(`✅ Encontradas ${activeAssignments.length} asignaciones activas`);
      activeAssignments.forEach((assignment, index) => {
        console.log(`\n--- Asignación Activa ${index + 1} ---`);
        console.log('ID:', assignment.id);
        console.log('Worker ID:', assignment.worker_id);
        console.log('User ID:', assignment.user_id);
        console.log('Schedule:', assignment.schedule);
        console.log('Specific Schedule:', assignment.specific_schedule);
      });
    } else {
      console.log('ℹ️  No hay asignaciones activas');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkAssignmentStructure(); 