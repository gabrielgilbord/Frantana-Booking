# 🔍 Verificación de la Tabla `occupied_slots`

Si los eventos confirmados no aparecen, verifica lo siguiente:

## 1. Verificar que la tabla existe en Supabase

1. Ve a tu panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Table Editor**
4. Busca la tabla `occupied_slots`

Si **NO existe**, ejecuta este SQL en el **SQL Editor**:

```sql
-- Crear tabla de horarios ocupados
CREATE TABLE IF NOT EXISTS occupied_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  event_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_occupied_slots_date ON occupied_slots(date);
CREATE INDEX IF NOT EXISTS idx_occupied_slots_time ON occupied_slots(start_time, end_time);

-- Habilitar RLS
ALTER TABLE occupied_slots ENABLE ROW LEVEL SECURITY;

-- Políticas para occupied_slots (permitir todo)
DROP POLICY IF EXISTS "Allow all operations on occupied_slots" ON occupied_slots;
CREATE POLICY "Allow all operations on occupied_slots" ON occupied_slots
  FOR ALL USING (true) WITH CHECK (true);
```

## 2. Verificar permisos RLS

Si la tabla existe pero no puedes insertar/leer, verifica las políticas RLS:

```sql
-- Ver políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'occupied_slots';

-- Si no hay políticas o están bloqueando, crear una nueva:
DROP POLICY IF EXISTS "Allow all operations on occupied_slots" ON occupied_slots;
CREATE POLICY "Allow all operations on occupied_slots" ON occupied_slots
  FOR ALL USING (true) WITH CHECK (true);
```

## 3. Insertar un evento de prueba manualmente

```sql
INSERT INTO occupied_slots (date, start_time, end_time, event_name, notes)
VALUES (CURRENT_DATE + INTERVAL '1 day', '18:00:00', '20:00:00', 'Evento de Prueba', 'Test manual');
```

## 4. Verificar datos existentes

```sql
SELECT * FROM occupied_slots ORDER BY date, start_time;
```

Si esta query devuelve datos pero la app muestra 0, el problema está en el código de la app.

## 5. Revisar logs en la consola del navegador

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Eventos Confirmados"
3. Busca estos mensajes:
   - "Fetching occupied slots..."
   - "Occupied slots obtenidos: X"
   - Cualquier error en rojo

Si ves errores, compártelos para poder solucionarlos.






