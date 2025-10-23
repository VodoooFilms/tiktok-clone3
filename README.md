This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Project Status (ES)

Fecha y hora: 2025-10-22 20:34 -05:00

### Qué funciona

- Cliente Appwrite configurado (libs/AppWriteClient.tsx) usando `NEXT_PUBLIC_APPWRITE_URL` y `NEXT_PUBLIC_APPWRITE_PROJECT`.
- Autenticación anónima funcionando y robusta contra QuotaExceededError (app/context/user.tsx):
  - Usa fallback REST si el `localStorage` está bloqueado.
  - Manejo seguro de caché local.
- Consola de depuración en `/debug` (app/debug/page.tsx):
  - Muestra `health`, sesión actual, listado de documentos (DB) y archivos (Storage).
  - Expone URLs de `preview` y `view` para archivos.
  - Botón “Copy” para copiar todo el log y “Refresh” para recargar pruebas.
- Base de datos: creación y lectura de documentos de `profile` con los campos requeridos (`userid`, `firstName`, `lastName`).
- Storage: listado de archivos y subida de archivos de prueba OK (revisar permisos según bucket).

### Pendiente / Siguientes pasos

- Definir y cablear el flujo de “Post” (subida de video + documento `post`).
- Confirmar esquema y permisos de la colección `post` (Create/Read para `role:users`).
- Bucket de videos: permitir `video/*`, habilitar “File Security”, Create para `role:users`, Read para `role:users` o `role:any`.
- (Opcional) Auto-crear documento de `profile` en el primer login.
- (Opcional) Ruta de servidor para inspeccionar esquemas (`app/api/admin/collection/route.ts`): requiere `APPWRITE_API_KEY` en `.env.local` (no commitear).

### Cómo probar rápido

1. `npm run dev` y abrir `http://localhost:3000/debug`.
2. Verificar:
   - `health: OK`, `session: logged in as ...`.
   - `db.list: total=...` y `storage.list: total=...`.
3. Usar botón “Copy” para compartir el estado.

### Notas

- No subir `.env.local` ni llaves al repositorio.
- En desarrollo, Next ejecuta efectos dos veces (Strict Mode), por eso algunas líneas se repiten en la consola de `/debug`.
