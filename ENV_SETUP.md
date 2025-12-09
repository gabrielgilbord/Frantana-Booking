# Configuración de Variables de Entorno

## Crear archivo .env.local

Crea un archivo llamado `.env.local` en la raíz del proyecto `frantana-booking` con el siguiente contenido:

```env
# Supabase Configuration
# Obtén estos valores desde tu proyecto de Supabase: https://app.supabase.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Gmail Configuration for Email Sending
# Usa una contraseña de aplicación de Google (no tu contraseña normal)
GMAIL_USER=appfrantana@gmail.com
GMAIL_APP_PASSWORD=zlhj nthy xtcy anvr
```

## Instrucciones

1. **Supabase**: Reemplaza `your_supabase_url_here` y `your_supabase_anon_key_here` con los valores reales de tu proyecto de Supabase.

2. **Gmail**: Las credenciales ya están configuradas:
   - Usuario: `appfrantana@gmail.com`
   - Contraseña de aplicación: `zlhj nthy xtcy anvr` (sin espacios)

## Nota Importante

- El archivo `.env.local` está en `.gitignore` y no se subirá al repositorio por seguridad.
- Después de crear o modificar `.env.local`, reinicia el servidor de desarrollo (`npm run dev`).

