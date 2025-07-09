-- =====================================================
-- DATOS DE PRUEBA - SAD LAS V2
-- =====================================================

-- =====================================================
-- ROLES DEL SISTEMA
-- =====================================================

-- Insertar roles del sistema
INSERT INTO system_roles (id, name, description, permissions) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  'super_admin',
  'Super Administrador con acceso total al sistema',
  '{"can_manage_admins": true, "can_manage_workers": true, "can_manage_users": true, "can_manage_assignments": true, "can_view_reports": true, "can_manage_system": true}'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'admin',
  'Administrador con acceso a gestión de trabajadoras y usuarios',
  '{"can_manage_admins": false, "can_manage_workers": true, "can_manage_users": true, "can_manage_assignments": true, "can_view_reports": true, "can_manage_system": false}'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ADMINISTRADORES DE PRUEBA
-- =====================================================

-- Super Administrador
INSERT INTO admins (id, email, full_name, role_id, is_active, created_by) VALUES
(
  '550e8400-e29b-41d4-a716-446655440003',
  'superadmin@sadlas.com',
  'María García López',
  '550e8400-e29b-41d4-a716-446655440001',
  true,
  null
);

-- Administrador
INSERT INTO admins (id, email, full_name, role_id, is_active, created_by) VALUES
(
  '550e8400-e29b-41d4-a716-446655440004',
  'admin@sadlas.com',
  'Ana Martínez Rodríguez',
  '550e8400-e29b-41d4-a716-446655440002',
  true,
  '550e8400-e29b-41d4-a716-446655440003'
);

-- =====================================================
-- TRABAJADORAS DE PRUEBA
-- =====================================================

-- Trabajadora 1
INSERT INTO workers (id, employee_code, name, surname, email, phone, dni, social_security_number, address, hire_date, is_active, worker_type, hourly_rate, max_weekly_hours, max_monthly_hours, specializations, certifications, availability_days, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship) VALUES
(
  '550e8400-e29b-41d4-a716-446655440005',
  'TR001',
  'Carmen',
  'Fernández Ruiz',
  'carmen.fernandez@sadlas.com',
  '+34 600 123 456',
  '12345678A',
  '123456789012345',
  'Calle Mayor 123, Mataró',
  '2024-01-15',
  true,
  'regular',
  12.50,
  40,
  160,
  '{"cuidado_ancianos", "limpieza_domestica", "cocina"}',
  '{"certificado_geriatria", "manipulacion_alimentos"}',
  '{"lunes", "martes", "miercoles", "jueves", "viernes"}',
  'Juan Fernández',
  '+34 600 123 457',
  'Esposo'
);

-- Trabajadora 2
INSERT INTO workers (id, employee_code, name, surname, email, phone, dni, social_security_number, address, hire_date, is_active, worker_type, hourly_rate, max_weekly_hours, max_monthly_hours, specializations, certifications, availability_days, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship) VALUES
(
  '550e8400-e29b-41d4-a716-446655440006',
  'TR002',
  'Isabel',
  'González Moreno',
  'isabel.gonzalez@sadlas.com',
  '+34 600 234 567',
  '23456789B',
  '234567890123456',
  'Avenida Catalunya 45, Mataró',
  '2024-02-01',
  true,
  'weekend',
  15.00,
  20,
  80,
  '{"cuidado_ancianos", "acompañamiento"}',
  '{"certificado_geriatria", "primeros_auxilios"}',
  '{"sabado", "domingo"}',
  'Pedro González',
  '+34 600 234 568',
  'Hermano'
);

-- Trabajadora 3
INSERT INTO workers (id, employee_code, name, surname, email, phone, dni, social_security_number, address, hire_date, is_active, worker_type, hourly_rate, max_weekly_hours, max_monthly_hours, specializations, certifications, availability_days, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship) VALUES
(
  '550e8400-e29b-41d4-a716-446655440007',
  'TR003',
  'Rosa',
  'López Sánchez',
  'rosa.lopez@sadlas.com',
  '+34 600 345 678',
  '34567890C',
  '345678901234567',
  'Calle Sant Josep 78, Mataró',
  '2024-01-20',
  true,
  'holiday',
  18.00,
  30,
  120,
  '{"cuidado_ancianos", "limpieza_domestica", "cocina", "acompañamiento"}',
  '{"certificado_geriatria", "manipulacion_alimentos", "primeros_auxilios"}',
  '{"lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"}',
  'Carlos López',
  '+34 600 345 679',
  'Hijo'
);

-- =====================================================
-- USUARIOS DE PRUEBA
-- =====================================================

-- Usuario 1
INSERT INTO users (id, client_code, name, surname, phone, email, address, postal_code, city, province, monthly_hours, service_type, special_requirements, medical_conditions, allergies, medications, emergency_contacts, is_active, status) VALUES
(
  '550e8400-e29b-41d4-a716-446655440008',
  'US001',
  'José',
  'Pérez García',
  '+34 600 456 789',
  'jose.perez@email.com',
  'Calle Barcelona 12, 1º 2ª',
  '08301',
  'Mataró',
  'Barcelona',
  40,
  'cuidado_completo',
  '{"movilidad_reducida", "dieta_sin_gluten"}',
  '{"diabetes", "hipertension"}',
  '{"polvo", "mariscos"}',
  '{"metformina", "enalapril"}',
  '{"nombre": "María Pérez", "telefono": "+34 600 456 790", "relacion": "Hija"}',
  true,
  'active'
);

-- Usuario 2
INSERT INTO users (id, client_code, name, surname, phone, email, address, postal_code, city, province, monthly_hours, service_type, special_requirements, medical_conditions, allergies, medications, emergency_contacts, is_active, status) VALUES
(
  '550e8400-e29b-41d4-a716-446655440009',
  'US002',
  'Antonia',
  'Martínez López',
  '+34 600 567 890',
  'antonia.martinez@email.com',
  'Avenida Maresme 34, 3º 1ª',
  '08302',
  'Mataró',
  'Barcelona',
  30,
  'limpieza_cocina',
  '{"acompañamiento_medico"}',
  '{"artritis"}',
  '{"lacteos"}',
  '{"ibuprofeno"}',
  '{"nombre": "Luis Martínez", "telefono": "+34 600 567 891", "relacion": "Hijo"}',
  true,
  'active'
);

-- Usuario 3
INSERT INTO users (id, client_code, name, surname, phone, email, address, postal_code, city, province, monthly_hours, service_type, special_requirements, medical_conditions, allergies, medications, emergency_contacts, is_active, status) VALUES
(
  '550e8400-e29b-41d4-a716-446655440010',
  'US003',
  'Francisco',
  'Rodríguez Fernández',
  '+34 600 678 901',
  'francisco.rodriguez@email.com',
  'Calle Sant Andreu 56, 2º 3ª',
  '08303',
  'Mataró',
  'Barcelona',
  25,
  'cuidado_basico',
  '{"dieta_blanda"}',
  '{"demencia_leve"}',
  '{}',
  '{"donepezilo"}',
  '{"nombre": "Carmen Rodríguez", "telefono": "+34 600 678 902", "relacion": "Hija"}',
  true,
  'active'
);

-- =====================================================
-- ASIGNACIONES DE PRUEBA
-- =====================================================

-- Asignación 1: Carmen - José
INSERT INTO assignments (id, worker_id, user_id, assignment_type, start_date, end_date, weekly_hours, schedule, status, priority, notes) VALUES
(
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440008',
  'regular',
  '2025-01-01',
  null,
  8,
  '{"lunes": {"start": "09:00", "end": "13:00"}, "martes": {"start": "09:00", "end": "13:00"}, "miercoles": {"start": "09:00", "end": "13:00"}, "jueves": {"start": "09:00", "end": "13:00"}, "viernes": {"start": "09:00", "end": "13:00"}}',
  'active',
  1,
  'Cuidado completo incluyendo limpieza y cocina'
);

-- Asignación 2: Isabel - Antonia
INSERT INTO assignments (id, worker_id, user_id, assignment_type, start_date, end_date, weekly_hours, schedule, status, priority, notes) VALUES
(
  '550e8400-e29b-41d4-a716-446655440012',
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440009',
  'weekend',
  '2025-01-01',
  null,
  6,
  '{"sabado": {"start": "10:00", "end": "13:00"}, "domingo": {"start": "10:00", "end": "13:00"}}',
  'active',
  2,
  'Limpieza y acompañamiento médico los fines de semana'
);

-- Asignación 3: Rosa - Francisco
INSERT INTO assignments (id, worker_id, user_id, assignment_type, start_date, end_date, weekly_hours, schedule, status, priority, notes) VALUES
(
  '550e8400-e29b-41d4-a716-446655440013',
  '550e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440010',
  'holiday',
  '2025-01-01',
  null,
  5,
  '{"lunes": {"start": "15:00", "end": "18:00"}, "miercoles": {"start": "15:00", "end": "18:00"}, "viernes": {"start": "15:00", "end": "18:00"}}',
  'active',
  3,
  'Cuidado básico y compañía por las tardes'
);

-- =====================================================
-- PLANES MENSUALES DE PRUEBA
-- =====================================================

-- Plan mensual Enero 2025 - Carmen
INSERT INTO monthly_plans (id, worker_id, user_id, assignment_id, month, year, planned_hours, actual_hours, schedule_config, status) VALUES
(
  '550e8400-e29b-41d4-a716-446655440014',
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440008',
  '550e8400-e29b-41d4-a716-446655440011',
  1,
  2025,
  160,
  0,
  '{"lunes": {"start": "09:00", "end": "13:00"}, "martes": {"start": "09:00", "end": "13:00"}, "miercoles": {"start": "09:00", "end": "13:00"}, "jueves": {"start": "09:00", "end": "13:00"}, "viernes": {"start": "09:00", "end": "13:00"}}',
  'active'
);

-- Plan mensual Enero 2025 - Isabel
INSERT INTO monthly_plans (id, worker_id, user_id, assignment_id, month, year, planned_hours, actual_hours, schedule_config, status) VALUES
(
  '550e8400-e29b-41d4-a716-446655440015',
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440009',
  '550e8400-e29b-41d4-a716-446655440012',
  1,
  2025,
  48,
  0,
  '{"sabado": {"start": "10:00", "end": "13:00"}, "domingo": {"start": "10:00", "end": "13:00"}}',
  'active'
);

-- Plan mensual Enero 2025 - Rosa
INSERT INTO monthly_plans (id, worker_id, user_id, assignment_id, month, year, planned_hours, actual_hours, schedule_config, status) VALUES
(
  '550e8400-e29b-41d4-a716-446655440016',
  '550e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440013',
  1,
  2025,
  60,
  0,
  '{"lunes": {"start": "15:00", "end": "18:00"}, "miercoles": {"start": "15:00", "end": "18:00"}, "viernes": {"start": "15:00", "end": "18:00"}}',
  'active'
);

-- =====================================================
-- DÍAS DE SERVICIO DE PRUEBA
-- =====================================================

-- Días de servicio para Carmen (Enero 2025)
INSERT INTO service_days (id, monthly_plan_id, service_date, day_of_week, start_time, end_time, hours, status) VALUES
-- Semana 1
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440014', '2025-01-06', 1, '09:00', '13:00', 4, 'scheduled'),
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440014', '2025-01-07', 2, '09:00', '13:00', 4, 'scheduled'),
('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440014', '2025-01-08', 3, '09:00', '13:00', 4, 'scheduled'),
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440014', '2025-01-09', 4, '09:00', '13:00', 4, 'scheduled'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440014', '2025-01-10', 5, '09:00', '13:00', 4, 'scheduled'),

-- Semana 2
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440014', '2025-01-13', 1, '09:00', '13:00', 4, 'scheduled'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440014', '2025-01-14', 2, '09:00', '13:00', 4, 'scheduled'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014', '2025-01-15', 3, '09:00', '13:00', 4, 'scheduled'),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440014', '2025-01-16', 4, '09:00', '13:00', 4, 'scheduled'),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440014', '2025-01-17', 5, '09:00', '13:00', 4, 'scheduled');

-- Días de servicio para Isabel (Enero 2025)
INSERT INTO service_days (id, monthly_plan_id, service_date, day_of_week, start_time, end_time, hours, status) VALUES
-- Fines de semana
('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440015', '2025-01-04', 6, '10:00', '13:00', 3, 'scheduled'),
('550e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440015', '2025-01-05', 0, '10:00', '13:00', 3, 'scheduled'),
('550e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440015', '2025-01-11', 6, '10:00', '13:00', 3, 'scheduled'),
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440015', '2025-01-12', 0, '10:00', '13:00', 3, 'scheduled');

-- =====================================================
-- ALERTAS DEL SISTEMA DE PRUEBA
-- =====================================================

-- Alerta de conflicto de horarios
INSERT INTO system_alerts (id, type, severity, title, description, affected_workers, affected_users, affected_assignments, alert_date, status) VALUES
(
  '550e8400-e29b-41d4-a716-446655440031',
  'conflict',
  'medium',
  'Posible conflicto de horarios',
  'La trabajadora Carmen Fernández tiene asignaciones que se solapan en horarios',
  '{"550e8400-e29b-41d4-a716-446655440005"}',
  '{"550e8400-e29b-41d4-a716-446655440008"}',
  '{"550e8400-e29b-41d4-a716-446655440011"}',
  '2025-01-15',
  'open'
);

-- =====================================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- =====================================================

-- Mostrar resumen de datos insertados
SELECT 'system_roles' as tabla, COUNT(*) as total FROM system_roles
UNION ALL
SELECT 'admins' as tabla, COUNT(*) as total FROM admins
UNION ALL
SELECT 'workers' as tabla, COUNT(*) as total FROM workers
UNION ALL
SELECT 'users' as tabla, COUNT(*) as total FROM users
UNION ALL
SELECT 'assignments' as tabla, COUNT(*) as total FROM assignments
UNION ALL
SELECT 'monthly_plans' as tabla, COUNT(*) as total FROM monthly_plans
UNION ALL
SELECT 'service_days' as tabla, COUNT(*) as total FROM service_days
UNION ALL
SELECT 'system_alerts' as tabla, COUNT(*) as total FROM system_alerts
ORDER BY tabla; 