-- Migration: monthly_balances table for planning and hour balances

CREATE TABLE IF NOT EXISTS public.monthly_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    assigned_hours DECIMAL(5,2) NOT NULL,
    scheduled_hours DECIMAL(5,2) NOT NULL,
    balance DECIMAL(5,2) NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('perfect', 'excess', 'deficit')),
    message TEXT NOT NULL,
    planning JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, worker_id, month, year)
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_monthly_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_monthly_balances_updated_at ON public.monthly_balances;

CREATE TRIGGER set_monthly_balances_updated_at
BEFORE UPDATE ON public.monthly_balances
FOR EACH ROW
EXECUTE PROCEDURE update_monthly_balances_updated_at(); 