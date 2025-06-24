-- Script completo de configuración inicial + migración
-- Este script crea todas las tablas necesarias si no existen y luego aplica la migración

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla worker_profiles si no existe
CREATE TABLE IF NOT EXISTS worker_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  worker_id UUID REFERENCES worker_profiles(id) NOT NULL,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Crear tabla service_cards si no existe
CREATE TABLE IF NOT EXISTS service_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2024),
  total_hours DECIMAL(5,2) NOT NULL CHECK (total_hours >= 0),
  used_hours DECIMAL(5,2) DEFAULT 0 CHECK (used_hours >= 0)
);

-- Crear tabla service_days si no existe
CREATE TABLE IF NOT EXISTS service_days (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  card_id UUID REFERENCES service_cards(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hours DECIMAL(4,2) NOT NULL CHECK (hours >= 0)
);

-- Añadir worker_type a worker_profiles si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worker_profiles' AND column_name = 'worker_type'
    ) THEN
        ALTER TABLE worker_profiles 
        ADD COLUMN worker_type TEXT DEFAULT 'regular' CHECK (worker_type IN ('regular', 'holidays', 'weekends'));
    END IF;
END $$;

-- Añadir worker_type a service_cards si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_cards' AND column_name = 'worker_type'
    ) THEN
        ALTER TABLE service_cards 
        ADD COLUMN worker_type TEXT DEFAULT 'regular' CHECK (worker_type IN ('regular', 'holidays', 'weekends'));
    END IF;
END $$;

-- Añadir specific_dates a service_cards si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_cards' AND column_name = 'specific_dates'
    ) THEN
        ALTER TABLE service_cards 
        ADD COLUMN specific_dates JSONB;
    END IF;
END $$;

-- Añadir weekend_config a service_cards si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_cards' AND column_name = 'weekend_config'
    ) THEN
        ALTER TABLE service_cards 
        ADD COLUMN weekend_config JSONB;
    END IF;
END $$;

-- Añadir specific_date a service_days si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_days' AND column_name = 'specific_date'
    ) THEN
        ALTER TABLE service_days 
        ADD COLUMN specific_date DATE;
    END IF;
END $$;

-- Actualizar constraint única para service_cards
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_cards_user_id_month_year_key'
    ) THEN
        ALTER TABLE service_cards DROP CONSTRAINT service_cards_user_id_month_year_key;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_cards_user_id_month_year_worker_type_key'
    ) THEN
        ALTER TABLE service_cards 
        ADD CONSTRAINT service_cards_user_id_month_year_worker_type_key 
        UNIQUE(user_id, month, year, worker_type);
    END IF;
END $$;

-- Crear función para updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Habilitar RLS
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_days ENABLE ROW LEVEL SECURITY;

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.worker_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mensaje final
DO $$ 
BEGIN
    RAISE NOTICE 'Setup completo ejecutado con éxito.';
END $$;