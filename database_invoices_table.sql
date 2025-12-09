-- Crear tabla para facturas independientes (no asociadas a eventos)
-- Ejecuta este SQL en tu panel de Supabase (SQL Editor)

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT,
  description TEXT NOT NULL,
  invoice_method TEXT NOT NULL,
  invoice_amount DECIMAL(10, 2) NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_method ON invoices(invoice_method);

-- Habilitar RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Políticas para invoices (permitir todo)
DROP POLICY IF EXISTS "Allow all operations on invoices" ON invoices;
CREATE POLICY "Allow all operations on invoices" ON invoices
  FOR ALL USING (true) WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE invoices IS 'Facturas independientes que no están asociadas a eventos específicos';
COMMENT ON COLUMN invoices.invoice_number IS 'Número de factura (opcional)';
COMMENT ON COLUMN invoices.description IS 'Descripción de lo facturado';
COMMENT ON COLUMN invoices.invoice_method IS 'Método de facturación (Efectivo, Transferencia, Bizum, etc.)';
COMMENT ON COLUMN invoices.invoice_amount IS 'Monto facturado en euros';
COMMENT ON COLUMN invoices.invoice_date IS 'Fecha de la factura';
COMMENT ON COLUMN invoices.invoice_notes IS 'Notas adicionales sobre la facturación';






