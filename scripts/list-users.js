const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno desde el archivo .env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
  try {
    console.log('🔍 Listando todos los usuarios...\n');

    // Obtener todos los usuarios
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error al obtener usuarios:', error.message);
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuarios:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Nombre: ${user.name} ${user.surname}`);
      console.log(`   Dirección: ${user.address || 'No especificada'}`);
      console.log(`   Teléfono: ${user.phone || 'No especificado'}`);
      console.log('');
    });

    // Buscar usuarios que contengan "José" o "Jose" en el nombre
    const joseUsers = users.filter(user => 
      user.name?.toLowerCase().includes('josé') || 
      user.name?.toLowerCase().includes('jose')
    );

    if (joseUsers.length > 0) {
      console.log(`\n🎯 Usuarios con "José" en el nombre: ${joseUsers.length}`);
      joseUsers.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Nombre: ${user.name} ${user.surname}`);
        console.log(`   Dirección: ${user.address || 'No especificada'}`);
        console.log('');
      });
    }

    // Buscar usuarios que contengan "Martínez" o "Martinez" en el apellido
    const martinezUsers = users.filter(user => 
      user.surname?.toLowerCase().includes('martínez') || 
      user.surname?.toLowerCase().includes('martinez')
    );

    if (martinezUsers.length > 0) {
      console.log(`\n🎯 Usuarios con "Martínez" en el apellido: ${martinezUsers.length}`);
      martinezUsers.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Nombre: ${user.name} ${user.surname}`);
        console.log(`   Dirección: ${user.address || 'No especificada'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

listUsers(); 