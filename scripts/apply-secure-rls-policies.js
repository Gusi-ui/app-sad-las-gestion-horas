const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearExistingPolicies() {
  console.log('🧹 Limpiando políticas RLS existentes...');
  
  const policiesToDrop = [
    // Políticas de admins
    'admins_select_policy',
    'admins_insert_policy', 
    'admins_update_policy',
    'admins_delete_policy',
    
    // Políticas de workers
    'workers_select_policy',
    'workers_insert_policy',
    'workers_update_policy', 
    'workers_delete_policy',
    
    // Políticas de users
    'users_select_policy',
    'users_insert_policy',
    'users_update_policy',
    'users_delete_policy',
    
    // Políticas de assignments
    'assignments_select_policy',
    'assignments_insert_policy',
    'assignments_update_policy',
    'assignments_delete_policy',
    
    // Políticas de assignment_history
    'assignment_history_select_policy',
    'assignment_history_insert_policy',
    'assignment_history_update_policy',
    'assignment_history_delete_policy'
  ];

  for (const policyName of policiesToDrop) {
    try {
      await supabase.rpc('drop_policy_if_exists', { policy_name: policyName });
      console.log(`✅ Política ${policyName} eliminada`);
    } catch (error) {
      console.log(`ℹ️  Política ${policyName} no existía o ya fue eliminada`);
    }
  }
}

async function applySecurePolicies() {
  console.log('🔒 Aplicando políticas RLS seguras...');
  
  try {
    // 1. Políticas para admins (solo super admins pueden gestionar)
    console.log('📋 Aplicando políticas para tabla admins...');
    
    await supabase.rpc('create_policy', {
      policy_name: 'admins_select_policy',
      table_name: 'admins',
      definition: `
        SELECT ON admins FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins WHERE role = 'super_admin'
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'admins_insert_policy', 
      table_name: 'admins',
      definition: `
        INSERT ON admins FOR ALL WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM admins WHERE role = 'super_admin'
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'admins_update_policy',
      table_name: 'admins', 
      definition: `
        UPDATE ON admins FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins WHERE role = 'super_admin'
          )
        ) WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM admins WHERE role = 'super_admin'
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'admins_delete_policy',
      table_name: 'admins',
      definition: `
        DELETE ON admins FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins WHERE role = 'super_admin'
          )
        )
      `
    });
    
    console.log('✅ Políticas de admins aplicadas');
    
    // 2. Políticas para workers (admins y super admins pueden gestionar)
    console.log('👷 Aplicando políticas para tabla workers...');
    
    await supabase.rpc('create_policy', {
      policy_name: 'workers_select_policy',
      table_name: 'workers',
      definition: `
        SELECT ON workers FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins
          ) OR
          auth.uid() IN (
            SELECT user_id FROM workers
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'workers_insert_policy',
      table_name: 'workers', 
      definition: `
        INSERT ON workers FOR ALL WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'workers_update_policy',
      table_name: 'workers',
      definition: `
        UPDATE ON workers FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins
          ) OR
          auth.uid() = user_id
        ) WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM admins
          ) OR
          auth.uid() = user_id
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'workers_delete_policy',
      table_name: 'workers',
      definition: `
        DELETE ON workers FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        )
      `
    });
    
    console.log('✅ Políticas de workers aplicadas');
    
    // 3. Políticas para users (admins y super admins pueden gestionar)
    console.log('👥 Aplicando políticas para tabla users...');
    
    await supabase.rpc('create_policy', {
      policy_name: 'users_select_policy',
      table_name: 'users',
      definition: `
        SELECT ON users FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'users_insert_policy',
      table_name: 'users',
      definition: `
        INSERT ON users FOR ALL WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'users_update_policy',
      table_name: 'users',
      definition: `
        UPDATE ON users FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        ) WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'users_delete_policy',
      table_name: 'users',
      definition: `
        DELETE ON users FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        )
      `
    });
    
    console.log('✅ Políticas de users aplicadas');
    
    // 4. Políticas para assignments (admins pueden gestionar, workers pueden ver sus asignaciones)
    console.log('📅 Aplicando políticas para tabla assignments...');
    
    await supabase.rpc('create_policy', {
      policy_name: 'assignments_select_policy',
      table_name: 'assignments',
      definition: `
        SELECT ON assignments FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins
          ) OR
          worker_id IN (
            SELECT id FROM workers WHERE user_id = auth.uid()
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'assignments_insert_policy',
      table_name: 'assignments',
      definition: `
        INSERT ON assignments FOR ALL WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'assignments_update_policy',
      table_name: 'assignments',
      definition: `
        UPDATE ON assignments FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        ) WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'assignments_delete_policy',
      table_name: 'assignments',
      definition: `
        DELETE ON assignments FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        )
      `
    });
    
    console.log('✅ Políticas de assignments aplicadas');
    
    // 5. Políticas para assignment_history (misma lógica que assignments)
    console.log('📚 Aplicando políticas para tabla assignment_history...');
    
    await supabase.rpc('create_policy', {
      policy_name: 'assignment_history_select_policy',
      table_name: 'assignment_history',
      definition: `
        SELECT ON assignment_history FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins
          ) OR
          worker_id IN (
            SELECT id FROM workers WHERE user_id = auth.uid()
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'assignment_history_insert_policy',
      table_name: 'assignment_history',
      definition: `
        INSERT ON assignment_history FOR ALL WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'assignment_history_update_policy',
      table_name: 'assignment_history',
      definition: `
        UPDATE ON assignment_history FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        ) WITH CHECK (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        )
      `
    });
    
    await supabase.rpc('create_policy', {
      policy_name: 'assignment_history_delete_policy',
      table_name: 'assignment_history',
      definition: `
        DELETE ON assignment_history FOR ALL USING (
          auth.uid() IN (
            SELECT user_id FROM admins
          )
        )
      `
    });
    
    console.log('✅ Políticas de assignment_history aplicadas');
    
    console.log('🎉 Todas las políticas RLS seguras han sido aplicadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error aplicando políticas:', error.message);
    throw error;
  }
}

async function verifyPolicies() {
  console.log('🔍 Verificando políticas aplicadas...');
  
  try {
    const { data: policies, error } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_schema', 'public');
    
    if (error) {
      console.error('❌ Error verificando políticas:', error.message);
      return;
    }
    
    console.log(`✅ Se encontraron ${policies.length} políticas activas:`);
    policies.forEach(policy => {
      console.log(`  - ${policy.policy_name} en ${policy.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando aplicación de políticas RLS seguras...\n');
    
    await clearExistingPolicies();
    console.log('');
    
    await applySecurePolicies();
    console.log('');
    
    await verifyPolicies();
    console.log('');
    
    console.log('✅ Proceso completado exitosamente');
    console.log('🔐 La aplicación ahora tiene políticas RLS seguras para producción');
    console.log('👤 El super admin puede gestionar admins y acceder a todas las funcionalidades');
    console.log('👷 Los admins pueden gestionar workers, users y assignments');
    console.log('👤 Los workers solo pueden ver sus propias asignaciones');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
    process.exit(1);
  }
}

main(); 