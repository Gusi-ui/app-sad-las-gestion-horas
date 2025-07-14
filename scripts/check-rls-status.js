const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRLSStatus() {
  console.log('🔍 Verificando estado de RLS y políticas...\n')

  try {
    // =====================================================
    // 1. VERIFICAR TABLAS Y RLS
    // =====================================================
    console.log('📋 Verificando tablas y estado RLS...')

    const tables = ['admins', 'workers', 'users', 'assignments', 'assignment_history']
    
    for (const table of tables) {
      try {
        // Verificar si la tabla existe
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error) {
          console.log(`❌ Tabla ${table}: ${error.message}`)
        } else {
          console.log(`✅ Tabla ${table}: Existe`)
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: No existe`)
      }
    }

    // =====================================================
    // 2. VERIFICAR POLÍTICAS RLS
    // =====================================================
    console.log('\n🔒 Verificando políticas RLS...')

    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
      `
    })

    if (policiesError) {
      console.log('⚠️  No se pudieron obtener las políticas RLS')
      console.log('💡 Ejecutando consulta directa...')
      
      // Consulta directa
      const { data: directPolicies, error: directError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'public')

      if (directError) {
        console.log('❌ Error obteniendo políticas:', directError.message)
      } else {
        console.log(`✅ Políticas encontradas: ${directPolicies.length}`)
        directPolicies.forEach(policy => {
          console.log(`  - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`)
        })
      }
    } else {
      console.log(`✅ Políticas encontradas: ${policies.length}`)
      policies.forEach(policy => {
        console.log(`  - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`)
      })
    }

    // =====================================================
    // 3. VERIFICAR SUPER ADMIN
    // =====================================================
    console.log('\n👑 Verificando Super Admin...')

    const { data: superAdmin, error: adminError } = await supabase
      .from('admins')
      .select(`
        id,
        email,
        full_name,
        is_active,
        system_roles(name)
      `)
      .eq('email', 'gusideveloper@gmail.com')
      .single()

    if (adminError) {
      console.log('❌ Error verificando Super Admin:', adminError.message)
    } else if (superAdmin) {
      console.log('✅ Super Admin encontrado:')
      console.log(`  📧 Email: ${superAdmin.email}`)
      console.log(`  👤 Nombre: ${superAdmin.full_name}`)
      console.log(`  🎭 Rol: ${superAdmin.system_roles.name}`)
      console.log(`  ✅ Activo: ${superAdmin.is_active ? 'Sí' : 'No'}`)
    } else {
      console.log('❌ Super Admin no encontrado')
    }

    // =====================================================
    // 4. PROBAR ACCESO CON SERVICE ROLE
    // =====================================================
    console.log('\n🔑 Probando acceso con Service Role...')

    const { data: testData, error: testError } = await supabase
      .from('admins')
      .select('*')
      .limit(5)

    if (testError) {
      console.log('❌ Error accediendo a admins:', testError.message)
    } else {
      console.log(`✅ Acceso exitoso a admins: ${testData.length} registros`)
    }

    // =====================================================
    // 5. VERIFICAR ROLES DEL SISTEMA
    // =====================================================
    console.log('\n🎭 Verificando roles del sistema...')

    const { data: roles, error: rolesError } = await supabase
      .from('system_roles')
      .select('*')

    if (rolesError) {
      console.log('❌ Error obteniendo roles:', rolesError.message)
    } else {
      console.log(`✅ Roles encontrados: ${roles.length}`)
      roles.forEach(role => {
        console.log(`  - ${role.name}: ${role.description}`)
      })
    }

    // =====================================================
    // 6. DIAGNÓSTICO Y RECOMENDACIONES
    // =====================================================
    console.log('\n🔍 Diagnóstico...')

    if (superAdmin && superAdmin.system_roles.name === 'super_admin') {
      console.log('✅ Super Admin configurado correctamente')
      console.log('⚠️  El problema puede ser:')
      console.log('  1. Las políticas RLS están bloqueando el acceso')
      console.log('  2. El usuario no está autenticado correctamente')
      console.log('  3. Las políticas no están funcionando como esperado')
      
      console.log('\n💡 Recomendaciones:')
      console.log('  1. Verificar que el usuario esté autenticado en Supabase Auth')
      console.log('  2. Revisar las políticas RLS en el dashboard de Supabase')
      console.log('  3. Temporalmente deshabilitar RLS para pruebas')
    } else {
      console.log('❌ Super Admin no está configurado correctamente')
      console.log('💡 Ejecuta: node scripts/create-super-admin-interactive.js')
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message)
  }
}

checkRLSStatus()
  .then(() => {
    console.log('\n✅ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error en la verificación:', error.message)
    process.exit(1)
  }) 