-- MIGRACIÓN NECESARIA PARA CORREGIR ERRORES
-- Ejecuta este SQL en tu panel de Supabase (SQL Editor)

-- 1. Actualizar tabla de bookings para incluir campos faltantes
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_time TIME;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guests INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time TIME;

-- 2. Crear tabla de horarios ocupados
CREATE TABLE IF NOT EXISTS occupied_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  event_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_occupied_slots_date ON occupied_slots(date);
CREATE INDEX IF NOT EXISTS idx_occupied_slots_time ON occupied_slots(start_time, end_time);

-- 4. Habilitar RLS
ALTER TABLE occupied_slots ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para occupied_slots
CREATE POLICY "Allow all operations on occupied_slots" ON occupied_slots
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Insertar algunos datos de ejemplo
INSERT INTO occupied_slots (date, start_time, end_time, event_name, notes) VALUES
  (CURRENT_DATE + INTERVAL '1 day', '18:00', '22:00', 'Boda de María y Juan', 'Evento confirmado'),
  (CURRENT_DATE + INTERVAL '2 days', '12:00', '16:00', 'Cumpleaños de Ana', 'Celebración familiar'),
  (CURRENT_DATE + INTERVAL '5 days', '20:00', '01:00', 'Fiesta Privada', 'Evento nocturno')
ON CONFLICT DO NOTHING;







