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
CREATE POLICY "admin_all_monthly_balances" ON public.monthly_balances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Trabajadoras pueden ver solo sus propios balances
CREATE POLICY "worker_own_monthly_balances" ON public.monthly_balances
    FOR SELECT USING (
        worker_id IN (
            SELECT id FROM public.workers 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Usuarios pueden ver solo sus propios balances
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
CREATE TRIGGER update_monthly_balances_updated_at 
    BEFORE UPDATE ON public.monthly_balances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 