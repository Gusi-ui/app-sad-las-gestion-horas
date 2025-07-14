const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
  console.log('👥 Listando usuarios de la base de datos...\n');

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, surname, monthly_hours')
      .order('name');

    if (error) {
      console.error('❌ Error al obtener usuarios:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No se encontraron usuarios');
      return;
    }

    console.log(`📊 Total usuarios encontrados: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} ${user.surname} - ${user.monthly_hours}h/mes`);
    });

  } catch (error) {
    console.error('❌ Error durante la consulta:', error);
  }
}

listUsers(); 