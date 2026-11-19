import { Navbar } from './navbar';
import { Footer } from './footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

/*
 * GastroNic DS · Estructura del área de viajeros (etapa 3)
 *
 * - Enlace "Saltar al contenido" para teclado y lectores de pantalla.
 * - En celular se reserva el alto de la barra inferior para que no
 *   tape el final de la página ni el pie.
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[80] focus:rounded-control focus:bg-ink focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>

      <Navbar />

      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>

      <Footer />
    </div>
  );
}
