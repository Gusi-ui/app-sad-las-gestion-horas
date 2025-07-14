const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function enableSecureRLS() {
// // console.log('🔒 Habilitando políticas RLS seguras para producción...\n')

  try {
    // Habilitar RLS en todas las tablas
// // console.log('📋 Habilitando RLS en todas las tablas...')
    
    const tables = [
      'admins',
      'workers', 
      'users',
      'assignments',
      'monthly_plans',
      'service_days',
      'holidays',
      'system_alerts'
    ]

    for (const table of tables) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
        })
        
        if (error) {
          console.warn(`⚠️ No se pudo habilitar RLS en ${table}:`, error.message)
        } else {
// // console.log(`✅ RLS habilitado en ${table}`)
        }
      } catch (err) {
        console.warn(`⚠️ Error procesando ${table}:`, err.message)
      }
    }

// // console.log('\n📋 Creando políticas seguras...')

    // Políticas para Super Admin (acceso total)
    const superAdminPolicies = [
      'CREATE POLICY "super_admin_all_access" ON admins FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id = (SELECT id FROM system_roles WHERE name = \'super_admin\')));',
      'CREATE POLICY "super_admin_workers_access" ON workers FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id = (SELECT id FROM system_roles WHERE name = \'super_admin\')));',
      'CREATE POLICY "super_admin_users_access" ON users FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id = (SELECT id FROM system_roles WHERE name = \'super_admin\')));',
      'CREATE POLICY "super_admin_assignments_access" ON assignments FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id = (SELECT id FROM system_roles WHERE name = \'super_admin\')));',
      'CREATE POLICY "super_admin_monthly_plans_access" ON monthly_plans FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id = (SELECT id FROM system_roles WHERE name = \'super_admin\')));',
      'CREATE POLICY "super_admin_service_days_access" ON service_days FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id = (SELECT id FROM system_roles WHERE name = \'super_admin\')));',
      'CREATE POLICY "super_admin_holidays_access" ON holidays FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id = (SELECT id FROM system_roles WHERE name = \'super_admin\')));',
      'CREATE POLICY "super_admin_system_alerts_access" ON system_alerts FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id = (SELECT id FROM system_roles WHERE name = \'super_admin\')));'
    ]

    // Políticas para Administradores (acceso limitado)
    const adminPolicies = [
      'CREATE POLICY "admin_workers_access" ON workers FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id IN (SELECT id FROM system_roles WHERE name IN (\'super_admin\', \'admin\'))));',
      'CREATE POLICY "admin_users_access" ON users FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id IN (SELECT id FROM system_roles WHERE name IN (\'super_admin\', \'admin\'))));',
      'CREATE POLICY "admin_assignments_access" ON assignments FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id IN (SELECT id FROM system_roles WHERE name IN (\'super_admin\', \'admin\'))));',
      'CREATE POLICY "admin_monthly_plans_access" ON monthly_plans FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id IN (SELECT id FROM system_roles WHERE name IN (\'super_admin\', \'admin\'))));',
      'CREATE POLICY "admin_service_days_access" ON service_days FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id IN (SELECT id FROM system_roles WHERE name IN (\'super_admin\', \'admin\'))));',
      'CREATE POLICY "admin_holidays_access" ON holidays FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id IN (SELECT id FROM system_roles WHERE name IN (\'super_admin\', \'admin\'))));',
      'CREATE POLICY "admin_system_alerts_access" ON system_alerts FOR ALL USING (auth.uid() IN (SELECT id FROM admins WHERE role_id IN (SELECT id FROM system_roles WHERE name IN (\'super_admin\', \'admin\'))));'
    ]

    // Políticas para Trabajadoras (solo su información)
    const workerPolicies = [
      'CREATE POLICY "worker_own_profile" ON workers FOR SELECT USING (auth_user_id = auth.uid());',
      'CREATE POLICY "worker_update_own_profile" ON workers FOR UPDATE USING (auth_user_id = auth.uid());',
      'CREATE POLICY "worker_own_assignments" ON assignments FOR SELECT USING (worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid()));',
      'CREATE POLICY "worker_own_monthly_plans" ON monthly_plans FOR SELECT USING (worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid()));',
      'CREATE POLICY "worker_own_service_days" ON service_days FOR SELECT USING (monthly_plan_id IN (SELECT id FROM monthly_plans WHERE worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid())));',
      'CREATE POLICY "worker_update_own_service_days" ON service_days FOR UPDATE USING (monthly_plan_id IN (SELECT id FROM monthly_plans WHERE worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid())));'
    ]

    // Aplicar políticas de Super Admin
// // console.log('🔑 Aplicando políticas de Super Admin...')
    for (const policy of superAdminPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy })
        if (error) {
          console.warn(`⚠️ Error en política Super Admin:`, error.message)
        } else {
// // console.log(`✅ Política Super Admin creada`)
        }
      } catch (err) {
        console.warn(`⚠️ Error aplicando política:`, err.message)
      }
    }

    // Aplicar políticas de Administradores
// // console.log('👨‍💼 Aplicando políticas de Administradores...')
    for (const policy of adminPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy })
        if (error) {
          console.warn(`⚠️ Error en política Admin:`, error.message)
        } else {
// // console.log(`✅ Política Admin creada`)
        }
      } catch (err) {
        console.warn(`⚠️ Error aplicando política:`, err.message)
      }
    }

    // Aplicar políticas de Trabajadoras
// // console.log('👩‍💼 Aplicando políticas de Trabajadoras...')
    for (const policy of workerPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy })
        if (error) {
          console.warn(`⚠️ Error en política Worker:`, error.message)
        } else {
// // console.log(`✅ Política Worker creada`)
        }
      } catch (err) {
        console.warn(`⚠️ Error aplicando política:`, err.message)
      }
    }

// // console.log('\n✅ Políticas RLS seguras habilitadas')
// // console.log('\n🔒 Niveles de acceso configurados:')
// // console.log('• Super Admin: Acceso total a todas las tablas')
// // console.log('• Admin: Acceso a workers, users, assignments, etc.')
// // console.log('• Worker: Solo su perfil y asignaciones')
    
// // console.log('\n⚠️ IMPORTANTE:')
// // console.log('• Las políticas están configuradas para máxima seguridad')
// // console.log('• Solo usuarios autenticados con roles apropiados pueden acceder')
// // console.log('• Verifica que los usuarios tengan los roles correctos asignados')

  } catch (error) {
    console.error('❌ Error inesperado:', error)
  }
}

enableSecureRLS() 