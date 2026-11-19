/** @type {import('next').NextConfig} */

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

/*
 * Dominios externos permitidos para next/image.
 * Lista cerrada a propósito (hallazgo GN-15 de la auditoría):
 * no agregar comodines ni dominios que controlen terceros.
 * Unsplash se usa en imágenes de demostración; lo ideal es migrar
 * esas imágenes a Supabase Storage y quitar esta entrada.
 */
const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
    pathname: '/**',
  },
];

if (supabaseUrl) {
  try {
    const parsedUrl = new URL(supabaseUrl);

    remotePatterns.push({
      protocol: parsedUrl.protocol.replace(':', ''),
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      pathname: '/storage/v1/object/public/**',
    });
  } catch {
    console.warn(
      'NEXT_PUBLIC_SUPABASE_URL no es una URL válida; no se configuró optimización remota de imágenes.'
    );
  }
}

/*
 * Cabeceras de seguridad (hallazgo GN-36).
 * - frame-ancestors / X-Frame-Options: nadie puede incrustar la app en un
 *   iframe (evita clickjacking sobre el panel de admin y de dueño).
 * - La CSP solo incluye directivas que no rompen scripts, mapas ni
 *   imágenes. Restringir script-src requiere nonces: queda para después.
 * - geolocation=(self) porque la app usa la ubicación del usuario.
 */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), payment=(), geolocation=(self)',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns,
  },

  allowedDevOrigins: ['192.168.1.57'],
};

export default nextConfig;
