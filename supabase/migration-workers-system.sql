-- Migration: Workers System
-- Create table for managing workers/employees

-- Create workers table
CREATE TABLE IF NOT EXISTS public.workers (
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
    specializations TEXT[], -- Array de especializaciones: ['elderly_care', 'disability_care', 'medical_assistance']
    availability_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], -- Días disponibles
    notes TEXT, -- Notas internas sobre la trabajadora
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create assignments table (relación trabajadora-usuario)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_hours_per_week DECIMAL(4,1) NOT NULL, -- Horas asignadas por semana
    start_date DATE NOT NULL,
    end_date DATE, -- NULL significa asignación indefinida
    specific_schedule JSONB, -- Horario específico: {"monday": ["09:00", "11:00"], "wednesday": ["15:00", "17:00"]}
    priority INTEGER DEFAULT 1, -- 1=alta, 2=media, 3=baja
    status VARCHAR(20) DEFAULT 'active', -- active, paused, completed, cancelled
    notes TEXT, -- Notas específicas de esta asignación
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constrainst
    UNIQUE(worker_id, user_id, start_date), -- Una trabajadora no puede tener múltiples asignaciones activas con el mismo usuario
    CHECK (assigned_hours_per_week > 0 AND assigned_hours_per_week <= 40),
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Create worker_availability table (para horarios específicos)
CREATE TABLE IF NOT EXISTS public.worker_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL, -- monday, tuesday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    UNIQUE(worker_id, day_of_week, start_time),
    CHECK (end_time > start_time),
    CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workers_active ON public.workers(is_active);
CREATE INDEX IF NOT EXISTS idx_workers_phone ON public.workers(phone);
CREATE INDEX IF NOT EXISTS idx_assignments_worker ON public.assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_dates ON public.assignments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_worker_availability_worker ON public.worker_availability(worker_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_availability ENABLE ROW LEVEL SECURITY;

-- Policies for workers table
CREATE POLICY "Allow authenticated users to view workers" ON public.workers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert workers" ON public.workers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update workers" ON public.workers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete workers" ON public.workers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for assignments table
CREATE POLICY "Allow authenticated users to view assignments" ON public.assignments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert assignments" ON public.assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update assignments" ON public.assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete assignments" ON public.assignments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for worker_availability table
CREATE POLICY "Allow authenticated users to view worker availability" ON public.worker_availability
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert worker availability" ON public.worker_availability
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update worker availability" ON public.worker_availability
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete worker availability" ON public.worker_availability
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some sample data
INSERT INTO public.workers (name, surname, phone, email, dni, specializations, availability_days, hourly_rate, notes) VALUES
('María', 'García López', '654321987', 'maria.garcia@email.com', '12345678A', ARRAY['elderly_care', 'medical_assistance'], ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], 16.50, 'Especialista en cuidado de personas mayores con más de 5 años de experiencia.'),
('Carmen', 'Rodríguez Pérez', '612345678', 'carmen.rodriguez@email.com', '87654321B', ARRAY['disability_care', 'elderly_care'], ARRAY['monday', 'wednesday', 'friday', 'saturday'], 15.00, 'Experiencia en cuidado de personas con discapacidad. Disponible fines de semana.'),
('Ana', 'Martínez Ruiz', '698765432', 'ana.martinez@email.com', '45678912C', ARRAY['elderly_care'], ARRAY['tuesday', 'thursday', 'saturday', 'sunday'], 15.50, 'Trabajadora de confianza, muy puntual y responsable.');

-- Update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON public.workers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for easier querying
CREATE OR REPLACE VIEW worker_stats AS
SELECT 
    w.id,
    w.name,
    w.surname,
    w.is_active,
    COUNT(a.id) as total_assignments,
    COUNT(CASE WHEN a.status = 'active' THEN 1 END) as active_assignments,
    COALESCE(SUM(CASE WHEN a.status = 'active' THEN a.assigned_hours_per_week ELSE 0 END), 0) as total_weekly_hours,
    w.max_weekly_hours,
    (w.max_weekly_hours - COALESCE(SUM(CASE WHEN a.status = 'active' THEN a.assigned_hours_per_week ELSE 0 END), 0)) as available_hours
FROM workers w
LEFT JOIN assignments a ON w.id = a.worker_id
GROUP BY w.id, w.name, w.surname, w.is_active, w.max_weekly_hours;

COMMENT ON TABLE public.workers IS 'Tabla de trabajadoras del servicio de atención domiciliaria';
COMMENT ON TABLE public.assignments IS 'Asignaciones de trabajadoras a usuarios específicos';
COMMENT ON TABLE public.worker_availability IS 'Disponibilidad horaria específica de cada trabajadora';
COMMENT ON VIEW worker_stats IS 'Vista con estadísticas de carga de trabajo de cada trabajadora'; 