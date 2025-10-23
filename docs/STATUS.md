# Estado del Proyecto — 2025-10-22 20:40 -05:00

Commit: 718737c

## Resumen
- Integración con Appwrite en marcha: autenticación anónima, base de datos (Profile), y storage funcionando.
- Página de diagnóstico unificada en `/debug` con salida tipo consola y botón de copia.
- Creados endpoints auxiliares: `GET /api/health` y `GET /api/admin/collection` (este último requiere `APPWRITE_API_KEY`).

## Snapshot de entorno (público)
- `NEXT_PUBLIC_APPWRITE_URL`: https://sfo.cloud.appwrite.io/v1
- `NEXT_PUBLIC_APPWRITE_PROJECT`: 68f947cd0031ce04b21f
- `NEXT_PUBLIC_DATABASE_ID`: 68f953d8001f871da06e
- `NEXT_PUBLIC_COLLECTION_ID_PROFILE`: profile
- `NEXT_PUBLIC_BUCKET_ID`: 68f95b9f0024057133b1
- `NEXT_PUBLIC_PLACEHOLDER_DEFAULT_IMAGE_ID`: 68f95d14000cc52ad797

Nota: No versionar `.env.local` con secretos. Para inspección de esquema desde el servidor, definir `APPWRITE_API_KEY` (solo servidor).

## Matriz de funcionalidades
- Autenticación
  - Anónimo: OK. Manejo de `localStorage` endurecido (evita QuotaExceeded). Fallback REST cuando es necesario.
- Consola `/debug`
  - Muestra: health, sesión, listado de documentos (DB) y archivos (Storage), URLs de preview/view. Botones: Copy y Refresh.
- Base de datos
  - Colección `profile`: creación y lectura OK. Campos requeridos actuales: `userid` (string), `firstName`, `lastName`.
  - En la prueba de creación se usa `documentId = user.$id` para perfilar 1:1.
- Storage
  - Listado y subida de archivos OK. Para imágenes se usa fallback a `view` cuando `preview` está bloqueado por plan.

## Rutas añadidas
- `app/api/health/route.ts`: Proxy de salud del backend.
- `app/api/admin/collection/route.ts`: Inspección de esquema (requiere `APPWRITE_API_KEY` en `.env.local`).

## Pendientes (prioridad práctica)
1) Flujo de Post (video)
   - Definir esquema `post` (p.ej. `userid:string`, `videoId:string`, `caption:string`, `createdAt:datetime`).
   - Activar Document Security; Permisos: Create/Read para `role:users`.
2) Bucket de videos
   - Permitir `video/*`, habilitar File Security.
   - Permisos: Create para `role:users`; Read para `role:any` o `role:users` según visibilidad.
3) UI
   - Componente de subida de video, creación del documento `post` y feed básico de reproducción.
4) (Opcional) Auto-creación de `profile` en primer login.
5) (Opcional) “Inspect schema” desde `/debug` habilitando `APPWRITE_API_KEY`.

## Cómo probar rápido
1. `npm run dev` y abrir `http://localhost:3000/debug`.
2. Verificar líneas: `health: OK`, `session: logged in as …`.
3. Confirmar `db.list` y `storage.list` devuelven totales esperados.
4. Usar “Copy” para compartir el log.

## Notas
- La salida puede duplicarse en desarrollo por Strict Mode de React (ejecución doble de efectos).
- Evitar transformar imágenes en `preview` en plan gratuito; usar `view` cuando sea posible.

