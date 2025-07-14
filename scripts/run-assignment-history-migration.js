const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
// // console.log('🔧 Ejecutando migración de tabla de historial...');

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../supabase/migration-create-assignment-history.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

// // console.log('📋 Contenido del archivo SQL:');
// // console.log(sqlContent);
// // console.log('\n⚠️  IMPORTANTE: Ejecuta este SQL en el Supabase Dashboard');
// // console.log('🔗 Ve a: https://supabase.com/dashboard/project/[TU_PROJECT]/sql/new');
// // console.log('📝 Copia y pega el contenido SQL de arriba');
// // console.log('✅ Ejecuta la consulta');
// // console.log('\n💡 Alternativamente, puedes ejecutar cada comando por separado:');

    // Dividir el SQL en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    commands.forEach((command, index) => {
      if (command.trim()) {
// // console.log(`\n${index + 1}. ${command};`);
      }
    });

// // console.log('\n✅ Una vez ejecutado, la tabla assignment_history estará lista para usar');

  } catch (error) {
    console.error('❌ Error al leer archivo SQL:', error);
  }
}

runMigration(); 