# Mi Mangateca

Aplicación web para guardar tus mangas (fichas, capítulos, notas e imágenes) y leerlos desde cualquier dispositivo.

- **Frontend:** React + Vite
- **Backend:** [Supabase](https://supabase.com): Postgres para los datos, Storage para las imágenes y Auth para el inicio de sesión. Cada usuario solo puede ver sus propios datos (Row Level Security).

## Vistas

| Zona | Ruta | Para qué |
|------|------|----------|
| **Biblioteca** (consulta) | `/` | Cuadrícula de mangas con buscador y filtro por estado |
| | `/manga/:id` | Ficha del manga y lista de capítulos |
| | `/manga/:id/capitulo/:id` | Lector con scroll vertical y navegación entre capítulos |
| **Administrar** | `/admin` | Lista de mangas para editar o borrar |
| | `/admin/nuevo` | Crear un manga (título, autor, estado, descripción, portada) |
| | `/admin/manga/:id` | Editar el manga y añadir o borrar capítulos (con sus imágenes) |
| | `/admin/manga/:id/capitulo/:id` | Editar el capítulo y añadir, reordenar o borrar páginas |

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Crea una cuenta en <https://supabase.com> y un proyecto nuevo (el plan gratuito sirve).
2. Abre **SQL Editor → New query**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
   Esto crea las tablas, las políticas de seguridad y el bucket privado `manga-images`.
   Después haz lo mismo con [`supabase/roles.sql`](supabase/roles.sql) para activar los roles de usuario.
3. *(Opcional)* Si no quieres confirmar el correo al registrarte: **Authentication → Sign In / Providers → Email** y desactiva "Confirm email".

### 2. Conectar la app

```bash
cp .env.example .env.local
```

Rellena `.env.local` con los valores de **Project Settings → API** (Project URL y la clave `anon` / publishable).

### 3. Ejecutar

```bash
npm install
npm run dev
```

Abre <http://localhost:5173>, crea tu cuenta y empieza a añadir mangas.

## Usarlo desde otros dispositivos

Mientras desarrollas, `npm run dev -- --host` permite abrirla desde el móvil en la misma red Wi-Fi.

Para tenerla siempre disponible, publícala gratis en **Vercel** o **Netlify**:

1. Sube el proyecto a GitHub.
2. Impórtalo en Vercel/Netlify (detectan Vite solos: build `npm run build`, salida `dist`).
3. Añade las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en la configuración del sitio.
4. Como es una SPA, configura que todas las rutas sirvan `index.html` (en Netlify ya está incluido `public/_redirects`; en Vercel lo resuelve `vercel.json`).
5. En Supabase, **Authentication → URL Configuration**, añade la URL de tu sitio.

## Estructura de datos

| Tabla      | Contenido                                                  |
|------------|------------------------------------------------------------|
| `mangas`   | título, autor, descripción, estado, portada                |
| `chapters` | número, título, notas (pertenece a un manga)               |
| `pages`    | número de página y ruta de la imagen (pertenece a un capítulo) |
| `profiles` | email y rol de cada cuenta: `user` o `admin` (se crea solo al registrarse) |

### Roles

El primer usuario que se registra es `admin`; el resto, `user`. Cada uno puede leer su rol pero no cambiarlo; solo un admin puede cambiar roles. Por ahora el rol solo se muestra en la cabecera: no cambia qué datos ve cada usuario. Para hacer admin a alguien a mano:

```sql
update public.profiles set role = 'admin' where email = 'correo@ejemplo.com';
```

Las imágenes se guardan en Storage bajo `<user_id>/covers/...` y `<user_id>/mangas/<manga>/<capítulo>/...`.

## Límites del plan gratuito de Supabase

Alrededor de 1 GB de almacenamiento de archivos y 500 MB de base de datos. Para una colección grande de capítulos escaneados quizá necesites el plan de pago o comprimir las imágenes (WebP) antes de subirlas.
