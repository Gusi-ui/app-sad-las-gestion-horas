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
  worker_id UUID REFERENCES worker_profiles(id) NOT NULL,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE
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
  holiday_hours JSONB, -- Horas específicas por fecha de festivo: {"2024-12-25": 3.5}
  weekend_hours JSONB, -- Horas de fines de semana: {"saturday": 2, "sunday": 1.5}
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

CREATE TRIGGER update_service_cards_updated_at 
  BEFORE UPDATE ON service_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_days ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para worker_profiles
CREATE POLICY "Los trabajadores pueden ver su propio perfil" ON worker_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los trabajadores pueden actualizar su propio perfil" ON worker_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Permitir inserción de perfil en signup" ON worker_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas RLS para users
CREATE POLICY "Los trabajadores solo ven sus usuarios" ON users
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Los trabajadores solo pueden crear usuarios para sí mismos" ON users
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Los trabajadores solo pueden actualizar sus usuarios" ON users
  FOR UPDATE USING (auth.uid() = worker_id);

CREATE POLICY "Los trabajadores solo pueden eliminar sus usuarios" ON users
  FOR DELETE USING (auth.uid() = worker_id);

-- Políticas RLS para service_cards
CREATE POLICY "Los trabajadores ven tarjetas de sus usuarios" ON service_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = service_cards.user_id AND users.worker_id = auth.uid()
    )
  );

CREATE POLICY "Los trabajadores crean tarjetas para sus usuarios" ON service_cards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = service_cards.user_id AND users.worker_id = auth.uid()
    )
  );

CREATE POLICY "Los trabajadores actualizan tarjetas de sus usuarios" ON service_cards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = service_cards.user_id AND users.worker_id = auth.uid()
    )
  );

CREATE POLICY "Los trabajadores eliminan tarjetas de sus usuarios" ON service_cards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = service_cards.user_id AND users.worker_id = auth.uid()
    )
  );

-- Políticas RLS para service_days
CREATE POLICY "Los trabajadores ven días de servicio de sus tarjetas" ON service_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM service_cards 
      JOIN users ON users.id = service_cards.user_id 
      WHERE service_cards.id = service_days.card_id AND users.worker_id = auth.uid()
    )
  );

CREATE POLICY "Los trabajadores crean días de servicio para sus tarjetas" ON service_days
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_cards 
      JOIN users ON users.id = service_cards.user_id 
      WHERE service_cards.id = service_days.card_id AND users.worker_id = auth.uid()
    )
  );

CREATE POLICY "Los trabajadores actualizan días de servicio de sus tarjetas" ON service_days
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM service_cards 
      JOIN users ON users.id = service_cards.user_id 
      WHERE service_cards.id = service_days.card_id AND users.worker_id = auth.uid()
    )
  );

CREATE POLICY "Los trabajadores eliminan días de servicio de sus tarjetas" ON service_days
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM service_cards 
      JOIN users ON users.id = service_cards.user_id 
      WHERE service_cards.id = service_days.card_id AND users.worker_id = auth.uid()
    )
  );

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