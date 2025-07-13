-- Crear tabla de historial de asignaciones
CREATE TABLE IF NOT EXISTS assignment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  previous_worker_id UUID REFERENCES workers(id),
  new_worker_id UUID REFERENCES workers(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'reassigned', 'paused', 'resumed', 'deleted')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_assignment_history_assignment_id ON assignment_history(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_created_at ON assignment_history(created_at);
CREATE INDEX IF NOT EXISTS idx_assignment_history_action ON assignment_history(action);

-- Crear RLS policies
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;

-- Policy para permitir lectura a administradores
CREATE POLICY "assignment_history_select_policy" ON assignment_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@sadlas.com'
    )
  );

-- Policy para permitir inserción a administradores
CREATE POLICY "assignment_history_insert_policy" ON assignment_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@sadlas.com'
    )
  );

-- Comentarios
COMMENT ON TABLE assignment_history IS 'Historial de cambios en asignaciones para auditoría';
COMMENT ON COLUMN assignment_history.action IS 'Tipo de acción realizada: created, updated, reassigned, paused, resumed, deleted';
COMMENT ON COLUMN assignment_history.notes IS 'Notas adicionales sobre la acción realizada'; 