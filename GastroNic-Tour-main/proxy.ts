import { type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/proxy';

/*
 * Se ejecuta antes de cada petición para mantener viva la sesión.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto archivos estáticos e imágenes,
     * que no necesitan sesión.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
};
