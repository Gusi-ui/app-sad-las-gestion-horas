const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno desde el archivo .env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findJoseMartinez() {
  try {
// // console.log('🔍 Buscando usuarios llamados José Martínez...\n');

    // Buscar todos los usuarios con nombre José y apellido Martínez
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or('name.eq.José,name.eq.Jose')
      .or('surname.eq.Martínez,surname.eq.Martinez');

    if (error) {
      console.error('❌ Error al buscar usuarios:', error.message);
      return;
    }

// // console.log(`✅ Encontrados ${users.length} usuarios:`);
    users.forEach((user, index) => {
// // console.log(`${index + 1}. ID: ${user.id}`);
// // console.log(`   Nombre: ${user.name} ${user.surname}`);
// // console.log(`   Dirección: ${user.address || 'No especificada'}`);
// // console.log(`   Teléfono: ${user.phone || 'No especificado'}`);
// // console.log('');
    });

    // Buscar específicamente José Martínez
    const { data: joseMartinez, error: joseError } = await supabase
      .from('users')
      .select('*')
      .eq('name', 'José')
      .eq('surname', 'Martínez');

    if (joseError) {
      console.error('❌ Error al buscar José Martínez específicamente:', joseError.message);
      return;
    }

// // console.log(`\n🎯 Usuarios exactamente llamados "José Martínez": ${joseMartinez.length}`);
    joseMartinez.forEach((user, index) => {
// // console.log(`${index + 1}. ID: ${user.id}`);
// // console.log(`   Nombre: ${user.name} ${user.surname}`);
// // console.log(`   Dirección: ${user.address || 'No especificada'}`);
// // console.log(`   Teléfono: ${user.phone || 'No especificado'}`);
// // console.log('');
    });

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

findJoseMartinez(); 