import Image from 'next/image';
import Link from 'next/link';

/*
 * GastroNic DS · Pie de página (etapa 3)
 *
 * - Visible también en celular (antes se ocultaba).
 * - Solo enlaces que llevan a páginas existentes. Los antiguos
 *   "Centro de ayuda", "Contáctanos", "Privacidad", "Cookies" y
 *   las redes sociales apuntaban a "/" o "#" y se retiraron hasta
 *   que existan esas páginas y perfiles reales.
 * - Contraste AA sobre el fondo de tinta profunda.
 */

const EXPLORE_LINKS: [string, string][] = [
  ['Inicio', '/home'],
  ['Explorar restaurantes', '/explore'],
  ['Mapa', '/home#mapa'],
  ['Rutas gastronómicas', '/home#rutas'],
  ['Para ti', '/recommendations'],
];

const ACCOUNT_LINKS: [string, string][] = [
  ['Mi perfil', '/profile'],
  ['Favoritos', '/favorites'],
  ['Mis reservas', '/reservations'],
  ['Mis rutas', '/routes/my-routes'],
];

const BUSINESS_LINKS: [string, string][] = [
  ['Registrar mi restaurante', '/owner/register'],
  ['Acceso para restaurantes', '/owner/login'],
  ['Términos de servicio', '/terms'],
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-ink-deep pb-[calc(4rem+env(safe-area-inset-bottom))] text-white sm:mt-20 md:pb-0">
      {/* ==================================================== */}
      {/* PIE PRINCIPAL                                        */}
      {/* ==================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-10">
          <div className="col-span-2 max-w-sm lg:col-span-1">
            <Link href="/home" className="inline-flex items-center gap-3 rounded-control" aria-label="GastroNic Tour, ir al inicio">
              <span className="flex size-11 items-center justify-center overflow-hidden rounded-control bg-white">
                <Image src="/logo.jpeg" alt="" width={44} height={44} className="h-full w-full object-contain p-0.5" />
              </span>
              <span className="font-display text-lg font-semibold">GastroNic Tour</span>
            </Link>

            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Restaurantes, rutas y experiencias gastronómicas de Nicaragua en un solo lugar.
            </p>
          </div>

          <FooterColumn title="Explorar" links={EXPLORE_LINKS} />
          <FooterColumn title="Tu cuenta" links={ACCOUNT_LINKS} />
          <FooterColumn title="Negocios y legal" links={BUSINESS_LINKS} className="col-span-2 sm:col-span-1" />
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-[13px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} GastroNic Tour. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  className,
}: {
  title: string;
  links: [string, string][];
  className?: string;
}) {
  return (
    <nav aria-label={title} className={className}>
      <h2 className="text-overline text-white/60">{title}</h2>
      <ul className="mt-3 space-y-1">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="inline-flex min-h-9 items-center rounded-chip text-sm text-white/80 transition-colors hover:text-white focus-visible:outline-white"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
