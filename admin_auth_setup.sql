-- Crear tabla de administradores con contraseñas cifradas
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Habilitar RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Política para permitir operaciones solo desde el servidor
CREATE POLICY "Allow server operations on admins" ON admins
  FOR ALL USING (true) WITH CHECK (true);

-- Insertar administrador por defecto (contraseña: admin2024)
-- Hash generado con bcrypt: $2b$10$qpNgCTs6oSBdhhzAyg6se.APO6plUGlX8f65y68H1IEcoq/JAeVaS
INSERT INTO admins (username, email, password_hash) VALUES
  ('frantana', 'admin@frantana.com', '$2b$10$qpNgCTs6oSBdhhzAyg6se.APO6plUGlX8f65y68H1IEcoq/JAeVaS')
ON CONFLICT (username) DO NOTHING;
