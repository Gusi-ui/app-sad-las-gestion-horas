const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMonthlyBalancesMigration() {
  console.log('🔧 Aplicando migración de monthly_balances...\n');

  try {
    // SQL para crear la tabla monthly_balances
    const migrationSQL = `
      -- Crear tabla monthly_balances para almacenar balances generados por administración
      CREATE TABLE IF NOT EXISTS public.monthly_balances (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
          month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
          year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2030),
          assigned_hours DECIMAL(5,1) NOT NULL DEFAULT 0,
          scheduled_hours DECIMAL(5,1) NOT NULL DEFAULT 0,
          balance DECIMAL(5,1) NOT NULL DEFAULT 0,
          status TEXT NOT NULL CHECK (status IN ('perfect', 'excess', 'deficit')),
          message TEXT,
          planning JSONB,
          holiday_info JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Índice único para evitar duplicados
          UNIQUE(user_id, worker_id, month, year)
      );

      -- Crear índices para mejorar rendimiento
      CREATE INDEX IF NOT EXISTS idx_monthly_balances_user_month_year ON public.monthly_balances(user_id, month, year);
      CREATE INDEX IF NOT EXISTS idx_monthly_balances_worker_month_year ON public.monthly_balances(worker_id, month, year);
      CREATE INDEX IF NOT EXISTS idx_monthly_balances_status ON public.monthly_balances(status);

      -- Habilitar RLS
      ALTER TABLE public.monthly_balances ENABLE ROW LEVEL SECURITY;

      -- Políticas RLS para monthly_balances
      -- Administradores pueden ver y modificar todos los balances
      DROP POLICY IF EXISTS "admin_all_monthly_balances" ON public.monthly_balances;
      CREATE POLICY "admin_all_monthly_balances" ON public.monthly_balances
          FOR ALL USING (
              EXISTS (
                  SELECT 1 FROM public.users 
                  WHERE id = auth.uid() 
                  AND role = 'admin'
              )
          );

      -- Trabajadoras pueden ver solo sus propios balances
      DROP POLICY IF EXISTS "worker_own_monthly_balances" ON public.monthly_balances;
      CREATE POLICY "worker_own_monthly_balances" ON public.monthly_balances
          FOR SELECT USING (
              worker_id IN (
                  SELECT id FROM public.workers 
                  WHERE email = auth.jwt() ->> 'email'
              )
          );

      -- Usuarios pueden ver solo sus propios balances
      DROP POLICY IF EXISTS "user_own_monthly_balances" ON public.monthly_balances;
      CREATE POLICY "user_own_monthly_balances" ON public.monthly_balances
          FOR SELECT USING (
              user_id = auth.uid()
          );

      -- Función para actualizar updated_at automáticamente
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Trigger para actualizar updated_at
      DROP TRIGGER IF EXISTS update_monthly_balances_updated_at ON public.monthly_balances;
      CREATE TRIGGER update_monthly_balances_updated_at 
          BEFORE UPDATE ON public.monthly_balances 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    // Ejecutar la migración
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error al aplicar migración:', error);
      return;
    }

    console.log('✅ Tabla monthly_balances creada exitosamente');
    console.log('✅ Índices creados');
    console.log('✅ RLS habilitado y políticas configuradas');
    console.log('✅ Trigger de updated_at configurado');

    // Verificar que la tabla existe
    const { data: tableExists, error: checkError } = await supabase
      .from('monthly_balances')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Error al verificar tabla:', checkError);
    } else {
      console.log('✅ Tabla monthly_balances verificada y accesible');
    }

    console.log('\n🎉 Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
  }
}

applyMonthlyBalancesMigration(); 