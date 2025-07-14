-- Crear tabla de historial de asignaciones
CREATE TABLE IF NOT EXISTS assignment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  previous_worker_id UUID REFERENCES workers(id),
  new_worker_id UUID NOT NULL REFERENCES workers(id),
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para mejor rendimiento
  CONSTRAINT fk_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_previous_worker FOREIGN KEY (previous_worker_id) REFERENCES workers(id) ON DELETE SET NULL,
  CONSTRAINT fk_new_worker FOREIGN KEY (new_worker_id) REFERENCES workers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_changed_by FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE RESTRICT
);

-- Crear índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_assignment_history_assignment_id ON assignment_history(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_created_at ON assignment_history(created_at);
CREATE INDEX IF NOT EXISTS idx_assignment_history_worker_id ON assignment_history(new_worker_id);

-- Habilitar RLS
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admins
CREATE POLICY "Admins can view all assignment history" ON assignment_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can insert assignment history" ON assignment_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE assignment_history IS 'Historial de cambios de trabajadores en asignaciones';
COMMENT ON COLUMN assignment_history.assignment_id IS 'ID de la asignación modificada';
COMMENT ON COLUMN assignment_history.previous_worker_id IS 'ID del trabajador anterior (NULL si es nueva asignación)';
COMMENT ON COLUMN assignment_history.new_worker_id IS 'ID del nuevo trabajador asignado';
COMMENT ON COLUMN assignment_history.changed_by IS 'ID del usuario que realizó el cambio';
COMMENT ON COLUMN assignment_history.change_reason IS 'Motivo del cambio (opcional)';
COMMENT ON COLUMN assignment_history.created_at IS 'Fecha y hora del cambio'; 