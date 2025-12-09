-- Añadir campos de facturación a la tabla occupied_slots
-- Ejecuta este SQL en tu panel de Supabase (SQL Editor)

ALTER TABLE occupied_slots 
  ADD COLUMN IF NOT EXISTS is_invoiced BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS invoice_method TEXT,
  ADD COLUMN IF NOT EXISTS invoice_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS invoice_date DATE,
  ADD COLUMN IF NOT EXISTS invoice_notes TEXT;

-- Crear índice para búsquedas rápidas de eventos facturados
CREATE INDEX IF NOT EXISTS idx_occupied_slots_invoiced ON occupied_slots(is_invoiced);

-- Comentarios para documentación
COMMENT ON COLUMN occupied_slots.is_invoiced IS 'Indica si el evento ha sido facturado';
COMMENT ON COLUMN occupied_slots.invoice_method IS 'Método de facturación (Efectivo, Transferencia, Bizum, etc.)';
COMMENT ON COLUMN occupied_slots.invoice_amount IS 'Monto facturado en euros';
COMMENT ON COLUMN occupied_slots.invoice_date IS 'Fecha en que se facturó el evento';
COMMENT ON COLUMN occupied_slots.invoice_notes IS 'Notas adicionales sobre la facturación';






