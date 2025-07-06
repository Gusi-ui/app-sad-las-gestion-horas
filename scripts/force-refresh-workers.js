const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function forceRefreshWorkers() {
  try {
    console.log('🔄 Forzando actualización de trabajadoras...\n');

    // 1. Verificar si hay algún problema con la consulta básica
    console.log('📋 Consulta básica a tabla workers:');
    console.log('===================================');
    
    const { data: basicWorkers, error: basicError } = await supabase
      .from('workers')
      .select('id, name, surname, email, created_at')
      .order('created_at', { ascending: false });

    if (basicError) {
      console.log('   ❌ Error en consulta básica:', basicError.message);
      console.log('   Código de error:', basicError.code);
      console.log('   Detalles:', basicError.details);
      console.log('   Sugerencia:', basicError.hint);
    } else {
      console.log(`   ✅ Consulta básica exitosa. Trabajadoras encontradas: ${basicWorkers.length}`);
      if (basicWorkers.length > 0) {
        basicWorkers.forEach((worker, index) => {
          console.log(`   ${index + 1}. ${worker.name} ${worker.surname} (${worker.email})`);
        });
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Verificar si hay problemas de permisos RLS
    console.log('🔐 Verificando permisos RLS:');
    console.log('=============================');
    
    // Intentar una consulta con diferentes contextos
    const { data: { user } } = await supabase.auth.getUser();
    console.log('   Usuario autenticado:', user ? 'Sí' : 'No');
    if (user) {
      console.log('   ID de usuario:', user.id);
      console.log('   Email:', user.email);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 3. Verificar si hay datos en otras tablas relacionadas
    console.log('🔍 Verificando tablas relacionadas:');
    console.log('===================================');
    
    // Verificar si existe la tabla worker_profiles
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('worker_profiles')
        .select('*')
        .limit(1);
      
      if (profilesError) {
        console.log('   ❌ Error accediendo a worker_profiles:', profilesError.message);
      } else {
        console.log('   ✅ Tabla worker_profiles accesible');
        console.log('   Datos encontrados:', profiles ? profiles.length : 0);
      }
    } catch (e) {
      console.log('   ❌ Tabla worker_profiles no existe o no es accesible');
    }

    // Verificar si existe la tabla worker_stats
    try {
      const { data: stats, error: statsError } = await supabase
        .from('worker_stats')
        .select('*')
        .limit(1);
      
      if (statsError) {
        console.log('   ❌ Error accediendo a worker_stats:', statsError.message);
      } else {
        console.log('   ✅ Tabla worker_stats accesible');
        console.log('   Datos encontrados:', stats ? stats.length : 0);
      }
    } catch (e) {
      console.log('   ❌ Tabla worker_stats no existe o no es accesible');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 4. Verificar estructura de la tabla workers
    console.log('🏗️ Verificando estructura de tabla workers:');
    console.log('===========================================');
    
    // Intentar obtener información de la estructura
    const { data: structureTest, error: structureError } = await supabase
      .from('workers')
      .select('*')
      .limit(0);

    if (structureError) {
      console.log('   ❌ Error accediendo a la estructura:', structureError.message);
    } else {
      console.log('   ✅ Tabla workers accesible');
      console.log('   Estructura válida');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 5. Recomendaciones
    console.log('💡 Recomendaciones:');
    console.log('===================');
    console.log('   1. Si ves trabajadoras en la interfaz pero no en los scripts:');
    console.log('      - Refrescar la página con Ctrl+F5 (Windows) o Cmd+Shift+R (Mac)');
    console.log('      - Limpiar caché del navegador');
    console.log('      - Reiniciar el servidor de desarrollo (Ctrl+C y npm run dev)');
    console.log('');
    console.log('   2. Si hay errores de permisos:');
    console.log('      - Verificar las políticas RLS en Supabase');
    console.log('      - Asegurar que el usuario tiene permisos de lectura');
    console.log('');
    console.log('   3. Si la tabla no existe:');
    console.log('      - Ejecutar las migraciones necesarias');
    console.log('      - Verificar el esquema de la base de datos');

  } catch (error) {
    console.error('Error general:', error);
  }
}

forceRefreshWorkers(); 