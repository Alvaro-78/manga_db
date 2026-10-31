# Mi Mangateca

Aplicación web para catalogar tus mangas (ficha, colección, tags, notas y portada) desde cualquier dispositivo.

- **Frontend:** React + Vite
- **Backend:** [Supabase](https://supabase.com): Postgres para los datos, Storage para las imágenes y Auth para el inicio de sesión. La biblioteca es un catálogo común: todos los usuarios la ven y solo los admins la gestionan (Row Level Security).

## Vistas

| Zona | Ruta | Para qué |
|------|------|----------|
| **Biblioteca** (consulta) | `/` | Cuadrícula de mangas con buscador y filtros por estado y tag |
| | `/manga/:id` | Ficha del manga: estado, colección, tags, descripción |
| **Administrar** | `/admin` | Lista de mangas para editar o borrar |
| | `/admin/nuevo` | Crear un manga (título, autor, estado, colección, tags, descripción, portada) |
| | `/admin/manga/:id` | Editar o borrar el manga |
| | `/admin/tags` | Crear, renombrar y borrar tags (solo admins) |
| **Pedidos** | `/pedidos` | Mangas pedidos a tiendas: título, autor, tomo, editorial (solo admins) |
| **Segunda mano** | `/segunda-mano` | Igual que Pedidos, para mangas de segunda mano (solo admins) |

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Crea una cuenta en <https://supabase.com> y un proyecto nuevo (el plan gratuito sirve).
2. Abre **SQL Editor → New query**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
   Esto crea las tablas, las políticas de seguridad y el bucket privado `manga-images`.
   Después haz lo mismo, en este orden, con [`supabase/roles.sql`](supabase/roles.sql) (roles de usuario) y [`supabase/tags.sql`](supabase/tags.sql) (tags) , [`supabase/orders.sql`](supabase/orders.sql) (pedidos y segunda mano) y [`supabase/shared_catalog.sql`](supabase/shared_catalog.sql) (catálogo común, solo admins escriben).
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
| `mangas`   | título, autor, descripción, estado, colección (tomo / tomos), portada |
| `tags`     | nombre del tag (comunes a todos; solo un admin los crea)   |
| `manga_tags` | qué tags lleva cada manga                                |
| `orders`   | pedidos a tiendas: título, autor, tomo, editorial (solo admins) |
| `second_hand` | mangas de segunda mano, mismos campos (solo admins) |
| `profiles` | email y rol de cada cuenta: `user` o `admin` (se crea solo al registrarse) |

### Roles

El primer usuario que se registra es `admin`; el resto, `user`. Cada uno puede leer su rol pero no cambiarlo; solo un admin puede cambiar roles. Un usuario normal solo ve la **Biblioteca** (y la ficha de cada manga). Todo lo demás (Administrar, Tags, Pedidos, Segunda mano) es solo para admins, tanto en la app como en los permisos de la base de datos. Para hacer admin a alguien a mano:

```sql
update public.profiles set role = 'admin' where email = 'correo@ejemplo.com';
```

Las portadas se guardan en Storage bajo `<user_id>/covers/...`.

## Límites del plan gratuito de Supabase

Alrededor de 1 GB de almacenamiento de archivos y 500 MB de base de datos. Para portadas es de sobra.
