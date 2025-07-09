-- =====================================================
-- NUEVO ESQUEMA DE BASE DE DATOS - SAD LAS
-- Arquitectura robusta para gestión de ayuda a domicilio
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA DE ROLES DEL SISTEMA
-- =====================================================
CREATE TABLE system_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar roles por defecto
INSERT INTO system_roles (name, description, permissions) VALUES
('super_admin', 'Super Administrador - Control total del sistema', 
 '{"manage_admins": true, "view_all": true, "system_config": true}'),
('admin', 'Administrador - Gestión de trabajadoras, usuarios y asignaciones', 
 '{"manage_workers": true, "manage_users": true, "manage_assignments": true, "view_reports": true}'),
('worker', 'Trabajadora - Acceso solo a su planning personal', 
 '{"view_own_schedule": true, "update_own_status": true}');

-- =====================================================
-- TABLA DE ADMINISTRADORES
-- =====================================================
CREATE TABLE admins (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role_id UUID REFERENCES system_roles(id) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA DE TRABAJADORAS
-- =====================================================
CREATE TABLE workers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) UNIQUE,
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  dni VARCHAR(20) UNIQUE,
  social_security_number VARCHAR(50),
  address TEXT,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Configuración de trabajo
  worker_type VARCHAR(20) NOT NULL CHECK (worker_type IN ('regular', 'holidays', 'weekends', 'flexible')),
  hourly_rate DECIMAL(5,2) DEFAULT 15.00,
  max_weekly_hours INTEGER DEFAULT 40,
  max_monthly_hours INTEGER DEFAULT 160,
  
  -- Especializaciones
  specializations TEXT[] DEFAULT ARRAY[],
  certifications TEXT[] DEFAULT ARRAY[],
  
  -- Disponibilidad
  availability_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  preferred_hours JSONB, -- {"start": "08:00", "end": "18:00"}
  
  -- Contacto de emergencia
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(50),
  
  -- Metadatos
  profile_photo_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA DE USUARIOS (CLIENTES)
-- =====================================================
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address TEXT NOT NULL,
  postal_code VARCHAR(10),
  city VARCHAR(100) DEFAULT 'Mataró',
  province VARCHAR(100) DEFAULT 'Barcelona',
  
  -- Información del servicio
  monthly_hours DECIMAL(5,2) DEFAULT 0,
  service_type VARCHAR(50), -- 'elderly_care', 'disability_care', 'medical_assistance'
  special_requirements TEXT[],
  
  -- Información médica
  medical_conditions TEXT[],
  allergies TEXT[],
  medications TEXT[],
  
  -- Contactos de emergencia
  emergency_contacts JSONB, -- [{"name": "...", "phone": "...", "relationship": "..."}]
  
  -- Estado
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  
  -- Metadatos
  notes TEXT,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA DE ASIGNACIONES
-- =====================================================
CREATE TABLE assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Configuración de la asignación
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('regular', 'holidays', 'weekends', 'temporary')),
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Horarios
  weekly_hours DECIMAL(4,1) NOT NULL,
  schedule JSONB, -- {"monday": {"start": "09:00", "end": "11:00"}, ...}
  
  -- Estado y prioridad
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 2 CHECK (priority IN (1, 2, 3)), -- 1=alta, 2=media, 3=baja
  
  -- Metadatos
  notes TEXT,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(worker_id, user_id, assignment_type, start_date),
  CHECK (end_date IS NULL OR end_date >= start_date),
  CHECK (weekly_hours > 0 AND weekly_hours <= 40)
);

-- =====================================================
-- TABLA DE PLANIFICACIÓN MENSUAL
-- =====================================================
CREATE TABLE monthly_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  
  -- Período
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2024),
  
  -- Horas planificadas
  planned_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  actual_hours DECIMAL(5,2) DEFAULT 0,
  
  -- Configuración específica del mes
  schedule_config JSONB, -- Configuración detallada del horario
  holiday_hours JSONB, -- Horas específicas para festivos
  weekend_hours JSONB, -- Horas específicas para fines de semana
  
  -- Estado
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_progress', 'completed')),
  
  -- Metadatos
  notes TEXT,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(worker_id, user_id, month, year)
);

-- =====================================================
-- TABLA DE DÍAS DE SERVICIO
-- =====================================================
CREATE TABLE service_days (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  monthly_plan_id UUID REFERENCES monthly_plans(id) ON DELETE CASCADE,
  
  -- Fecha específica
  service_date DATE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Horarios
  start_time TIME,
  end_time TIME,
  hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  
  -- Estado del servicio
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Notas de la trabajadora
  worker_notes TEXT,
  admin_notes TEXT,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(monthly_plan_id, service_date)
);

-- =====================================================
-- TABLA DE FESTIVOS
-- =====================================================
CREATE TABLE holidays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('national', 'regional', 'local')),
  region VARCHAR(50) DEFAULT 'Catalunya',
  city VARCHAR(50) DEFAULT 'Mataró',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA DE CONFLICTOS Y ALERTAS
-- =====================================================
CREATE TABLE system_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'conflict', 'warning', 'info', 'error'
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Entidades afectadas
  affected_workers UUID[],
  affected_users UUID[],
  affected_assignments UUID[],
  
  -- Fechas
  alert_date DATE NOT NULL,
  resolved_date DATE,
  resolved_by UUID REFERENCES admins(id),
  
  -- Estado
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  
  -- Metadatos
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a todas las tablas
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_plans_updated_at BEFORE UPDATE ON monthly_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_days_updated_at BEFORE UPDATE ON service_days FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_alerts_updated_at BEFORE UPDATE ON system_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil de trabajadora automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_worker()
RETURNS TRIGGER AS $$
BEGIN
  -- Generar código de empleado único
  INSERT INTO public.workers (auth_user_id, employee_code, email, name, surname, phone)
  VALUES (
    NEW.id, 
    'EMP' || EXTRACT(YEAR FROM NOW()) || LPAD(NEW.id::text, 6, '0'),
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'surname', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear trabajadora automáticamente
CREATE TRIGGER on_auth_worker_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_worker();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para Super Admin (acceso total)
CREATE POLICY "Super admin access all" ON admins FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin'))
);

CREATE POLICY "Super admin access all workers" ON workers FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin'))
);

CREATE POLICY "Super admin access all users" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id = (SELECT id FROM system_roles WHERE name = 'super_admin'))
);

-- Políticas para Administradores
CREATE POLICY "Admin access all workers" ON workers FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id IN (
    SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
  ))
);

CREATE POLICY "Admin access all users" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id IN (
    SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
  ))
);

CREATE POLICY "Admin access all assignments" ON assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role_id IN (
    SELECT id FROM system_roles WHERE name IN ('super_admin', 'admin')
  ))
);

-- Políticas para Trabajadoras (solo su información)
CREATE POLICY "Workers can view own profile" ON workers FOR SELECT USING (
  auth_user_id = auth.uid()
);

CREATE POLICY "Workers can update own profile" ON workers FOR UPDATE USING (
  auth_user_id = auth.uid()
);

CREATE POLICY "Workers can view own assignments" ON assignments FOR SELECT USING (
  worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Workers can view own monthly plans" ON monthly_plans FOR SELECT USING (
  worker_id IN (SELECT id FROM workers WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Workers can view own service days" ON service_days FOR SELECT USING (
  monthly_plan_id IN (
    SELECT id FROM monthly_plans WHERE worker_id IN (
      SELECT id FROM workers WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Workers can update own service days" ON service_days FOR UPDATE USING (
  monthly_plan_id IN (
    SELECT id FROM monthly_plans WHERE worker_id IN (
      SELECT id FROM workers WHERE auth_user_id = auth.uid()
    )
  )
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX idx_workers_auth_user_id ON workers(auth_user_id);
CREATE INDEX idx_workers_worker_type ON workers(worker_type);
CREATE INDEX idx_workers_is_active ON workers(is_active);
CREATE INDEX idx_assignments_worker_id ON assignments(worker_id);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_monthly_plans_worker_user ON monthly_plans(worker_id, user_id);
CREATE INDEX idx_monthly_plans_month_year ON monthly_plans(month, year);
CREATE INDEX idx_service_days_date ON service_days(service_date);
CREATE INDEX idx_service_days_status ON service_days(status);
CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_system_alerts_status ON system_alerts(status);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar festivos básicos de Mataró
INSERT INTO holidays (date, name, type) VALUES
('2025-01-01', 'Año Nuevo', 'national'),
('2025-01-06', 'Epifanía del Señor', 'national'),
('2025-04-18', 'Viernes Santo', 'national'),
('2025-04-20', 'Domingo de Resurrección', 'national'),
('2025-05-01', 'Día del Trabajo', 'national'),
('2025-06-24', 'San Juan', 'regional'),
('2025-08-15', 'Asunción de la Virgen', 'national'),
('2025-09-11', 'Diada Nacional de Catalunya', 'regional'),
('2025-10-12', 'Fiesta Nacional de España', 'national'),
('2025-11-01', 'Todos los Santos', 'national'),
('2025-12-06', 'Día de la Constitución', 'national'),
('2025-12-08', 'Inmaculada Concepción', 'national'),
('2025-12-25', 'Navidad', 'national'),
('2025-12-26', 'San Esteban', 'regional');

-- Mensaje de confirmación
DO $$ 
BEGIN
    RAISE NOTICE 'Nuevo esquema de base de datos creado exitosamente!';
    RAISE NOTICE 'Tablas creadas: system_roles, admins, workers, users, assignments, monthly_plans, service_days, holidays, system_alerts';
    RAISE NOTICE 'Triggers y políticas RLS configurados';
    RAISE NOTICE 'Festivos básicos insertados';
END $$; 