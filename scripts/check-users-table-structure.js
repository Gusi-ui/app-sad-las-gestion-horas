const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsersTableStructure() {
  console.log('🔍 Verificando estructura de la tabla users...\n');

  try {
    // Obtener información de la tabla users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error al consultar tabla users:', error);
      return;
    }

    if (users && users.length > 0) {
      console.log('📋 Columnas de la tabla users:');
      const columns = Object.keys(users[0]);
      columns.forEach(column => {
        console.log(`   - ${column}: ${typeof users[0][column]}`);
      });
    } else {
      console.log('⚠️ No hay usuarios en la tabla');
    }

    // Verificar si existe la columna role
    const { data: roleCheck, error: roleError } = await supabase
      .from('users')
      .select('role')
      .limit(1);

    if (roleError) {
      console.log('\n❌ La columna "role" no existe en la tabla users');
      console.log('💡 Necesitamos agregar la columna role o usar otra lógica para identificar administradores');
    } else {
      console.log('\n✅ La columna "role" existe en la tabla users');
    }

    // Verificar si hay algún usuario que sea administrador
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');

    if (adminError) {
      console.log('❌ Error al buscar administradores:', adminError);
    } else {
      console.log(`\n👥 Usuarios administradores encontrados: ${adminUsers?.length || 0}`);
      if (adminUsers && adminUsers.length > 0) {
        adminUsers.forEach(user => {
          console.log(`   - ${user.name} ${user.surname} (${user.email})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

checkUsersTableStructure(); 