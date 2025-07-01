-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de perfiles de trabajadoras
CREATE TABLE worker_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de usuarios (clientes)
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  monthly_hours DECIMAL(5,2) DEFAULT 0 CHECK (monthly_hours >= 0)
);

-- Tabla de trabajadoras
CREATE TABLE workers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    dni VARCHAR(20) UNIQUE,
    social_security_number VARCHAR(50),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(5,2) DEFAULT 15.00,
    max_weekly_hours INTEGER DEFAULT 40,
    specializations TEXT[],
    availability_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    notes TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de asignaciones (relación trabajadora-usuario)
CREATE TABLE assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_hours_per_week DECIMAL(4,1) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    specific_schedule JSONB,
    priority INTEGER DEFAULT 2,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(worker_id, user_id, start_date),
    CHECK (assigned_hours_per_week > 0 AND assigned_hours_per_week <= 40),
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Tabla de tarjetas de servicio mensuales
CREATE TABLE service_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2024),
  total_hours DECIMAL(5,2) NOT NULL CHECK (total_hours >= 0),
  used_hours DECIMAL(5,2) DEFAULT 0 CHECK (used_hours >= 0),
  includes_holidays BOOLEAN DEFAULT FALSE,
  includes_weekends BOOLEAN DEFAULT FALSE,
  holiday_hours JSONB,
  weekend_hours JSONB,
  UNIQUE(user_id, month, year)
);

-- Tabla de días de servicio por semana
CREATE TABLE service_days (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  card_id UUID REFERENCES service_cards(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hours DECIMAL(4,2) NOT NULL CHECK (hours >= 0),
  UNIQUE(card_id, day_of_week)
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_worker_profiles_updated_at 
  BEFORE UPDATE ON worker_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at 
  BEFORE UPDATE ON workers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at 
  BEFORE UPDATE ON assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_cards_updated_at 
  BEFORE UPDATE ON service_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_days ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para worker_profiles
CREATE POLICY "Los trabajadores pueden ver su propio perfil" ON worker_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los trabajadores pueden actualizar su propio perfil" ON worker_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Permitir inserción de perfil en signup" ON worker_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas RLS para users (sin worker_id)
CREATE POLICY "Permitir acceso completo a usuarios" ON users
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas RLS para workers
CREATE POLICY "Permitir acceso completo a trabajadoras" ON workers
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas RLS para assignments
CREATE POLICY "Permitir acceso completo a asignaciones" ON assignments
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas RLS para service_cards
CREATE POLICY "Permitir acceso completo a tarjetas de servicio" ON service_cards
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas RLS para service_days
CREATE POLICY "Permitir acceso completo a días de servicio" ON service_days
  FOR ALL USING (auth.role() = 'authenticated');

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.worker_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
