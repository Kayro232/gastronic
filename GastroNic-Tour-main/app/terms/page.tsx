import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Mail,
  ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Términos de servicio | GastroNic Tour',
  description:
    'Términos de servicio para el uso de GastroNic Tour y sus funcionalidades de turismo gastronómico en Nicaragua.',
};

const sections = [
  {
    title: '1. Aceptación de los términos',
    paragraphs: [
      'Al crear una cuenta, acceder o utilizar GastroNic Tour, aceptas estos términos de servicio. Si no estás de acuerdo con ellos, debes dejar de utilizar la plataforma.',
      'Estos términos aplican al uso de las funciones disponibles para turistas, usuarios registrados, restaurantes, emprendimientos y demás participantes de la plataforma.',
    ],
  },
  {
    title: '2. Qué ofrece GastroNic Tour',
    paragraphs: [
      'GastroNic Tour es una plataforma de turismo gastronómico enfocada en Nicaragua. Permite descubrir restaurantes, experiencias, rutas y contenido relacionado con la gastronomía local, además de facilitar funciones como favoritos, recomendaciones, reseñas y reservaciones cuando estén disponibles.',
      'La disponibilidad de cada función puede variar según el establecimiento, la ubicación, el tipo de cuenta y el estado de desarrollo de la plataforma.',
    ],
  },
  {
    title: '3. Cuentas y seguridad',
    paragraphs: [
      'Debes proporcionar información veraz y mantener actualizados los datos necesarios para utilizar tu cuenta. Eres responsable de proteger tus credenciales y de las acciones realizadas desde tu cuenta mientras se mantenga bajo tu control.',
      'No está permitido suplantar a otras personas, crear cuentas con fines fraudulentos ni intentar acceder a cuentas, paneles o información que no te correspondan.',
    ],
  },
  {
    title: '4. Restaurantes y contenido de terceros',
    paragraphs: [
      'Los restaurantes y negocios son responsables de la información que proporcionan sobre su establecimiento, incluyendo horarios, precios, menú, disponibilidad, imágenes, datos de contacto y condiciones de atención.',
      'GastroNic Tour puede moderar, rechazar, ocultar o solicitar correcciones cuando un contenido sea incompleto, engañoso, inapropiado o contrario a estos términos.',
    ],
  },
  {
    title: '5. Reservaciones',
    paragraphs: [
      'Cuando un restaurante acepte reservaciones mediante GastroNic Tour, la plataforma facilitará el registro y seguimiento de la solicitud. La confirmación, atención y prestación final del servicio corresponden al establecimiento.',
      'Las reservaciones pueden estar sujetas a disponibilidad y a cambios de estado. Los usuarios deben cancelar con responsabilidad cuando sepan que no podrán asistir.',
    ],
  },
  {
    title: '6. Reseñas y contenido de usuarios',
    paragraphs: [
      'Las reseñas, comentarios y demás aportes deben reflejar experiencias reales y expresarse de forma respetuosa. No se permite publicar contenido falso, difamatorio, discriminatorio, ilegal, automatizado o destinado a manipular valoraciones.',
      'La plataforma puede moderar o retirar contenido que incumpla estas reglas o que afecte la seguridad e integridad del servicio.',
    ],
  },
  {
    title: '7. Uso permitido de la plataforma',
    paragraphs: [
      'No puedes intentar vulnerar la seguridad de GastroNic Tour, interferir con su funcionamiento, evadir controles de acceso, extraer datos de manera abusiva, manipular funciones protegidas ni utilizar la plataforma para actividades fraudulentas o ilegales.',
      'El acceso a funciones de administración, owner o gestión de restaurantes está limitado a las cuentas que cuenten con los permisos correspondientes.',
    ],
  },
  {
    title: '8. Disponibilidad y cambios',
    paragraphs: [
      'GastroNic Tour puede actualizar, mejorar, suspender o retirar temporalmente funciones por mantenimiento, seguridad, disponibilidad técnica o evolución del proyecto.',
      'Aunque se procura mantener información y servicios disponibles, pueden ocurrir interrupciones o errores técnicos. Cuando sea posible, se trabajará para restablecer el servicio y corregir incidencias.',
    ],
  },
  {
    title: '9. Propiedad intelectual',
    paragraphs: [
      'La identidad, diseño, software y contenido propio de GastroNic Tour están protegidos por los derechos que correspondan a sus respectivos titulares. El contenido aportado por restaurantes o usuarios continúa sujeto a los derechos de quien lo haya creado o proporcionado.',
      'El uso de la plataforma no concede autorización para copiar, revender, explotar o redistribuir sus elementos fuera de los usos permitidos por el servicio.',
    ],
  },
  {
    title: '10. Suspensión o cierre de cuentas',
    paragraphs: [
      'Una cuenta puede ser restringida o suspendida cuando existan indicios razonables de fraude, abuso, incumplimiento de estos términos, riesgos de seguridad o uso no autorizado de funciones protegidas.',
      'Cuando las condiciones del servicio lo permitan, el usuario podrá dejar de utilizar la plataforma y solicitar las acciones disponibles sobre su cuenta y sus datos.',
    ],
  },
  {
    title: '11. Actualizaciones de estos términos',
    paragraphs: [
      'Estos términos pueden actualizarse para reflejar cambios en la plataforma, nuevas funcionalidades o ajustes operativos. La versión publicada en esta página será la versión vigente dentro del servicio.',
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F7] text-ink">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-white hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a GastroNic Tour
        </Link>

        <section className="mt-6 overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
          <div className="border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-white to-[#F4B942]/[0.08] px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-action text-white shadow-overlay">
              <FileText className="h-6 w-6" />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.08em] text-action">
              Información del servicio
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Términos de servicio
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Estas condiciones describen las reglas básicas para utilizar
              GastroNic Tour y ayudan a mantener una experiencia segura,
              transparente y útil para usuarios y establecimientos.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white px-3 py-2">
                <CalendarDays className="h-3.5 w-3.5 text-action" />
                Última actualización: 13 de septiembre de 2026
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white px-3 py-2">
                <ShieldCheck className="h-3.5 w-3.5 text-action" />
                Uso responsable y seguro
              </div>
            </div>
          </div>

          <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-10">
            {sections.map((section) => (
              <section key={section.title} className="scroll-mt-24">
                <h2 className="text-lg font-bold text-ink sm:text-xl">
                  {section.title}
                </h2>

                <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground sm:text-[15px]">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <section className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-action">
                  <Mail className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="font-bold text-ink">12. Contacto</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Si tienes preguntas relacionadas con estos términos o con
                    el funcionamiento de GastroNic Tour, puedes escribir a{' '}
                    <a
                      href="mailto:info@gastronictour.com"
                      className="font-semibold text-action hover:underline"
                    >
                      info@gastronictour.com
                    </a>
                    .
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-muted-foreground">
          Esta página describe las condiciones operativas actuales de
          GastroNic Tour y puede actualizarse conforme evolucione el servicio.
        </p>
      </div>
    </main>
  );
}
