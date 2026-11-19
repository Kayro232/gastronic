'use client';

import {
  FormEvent,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  CalendarDays,
  Check,
  Clock3,
  Globe2,
  LoaderCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  Store,
  Users,
} from 'lucide-react';

import {
  Button,
} from '@/components/ui/button';

import {
  createClient,
} from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

export interface EditableRestaurant {
  id: string;

  name: string;

  short_description:
    string | null;

  description:
    string | null;

  municipality_id:
    number | null;

  address:
    string | null;

  phone:
    string | null;

  whatsapp:
    string | null;

  email:
    string | null;

  website_url:
    string | null;

  facebook_url:
    string | null;

  instagram_url:
    string | null;

  price_level:
    number;

  status:
    string;

  accepts_reservations:
    boolean;

  reservation_min_party_size:
    number;

  reservation_max_party_size:
    number;

  reservation_min_notice_minutes:
    number;

  reservation_max_advance_days:
    number;

  reservation_duration_minutes:
    number;

  reservation_instructions:
    string | null;
}

interface DepartmentOption {
  id: number;
  name: string;
}

export interface MunicipalityOption {
  id: number;

  name: string;

  department:
    | DepartmentOption
    | DepartmentOption[]
    | null;
}

interface EditRestaurantFormProps {
  restaurant:
    EditableRestaurant;

  municipalities:
    MunicipalityOption[];
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function EditRestaurantForm({
  restaurant,
  municipalities,
}: EditRestaurantFormProps) {
  const router =
    useRouter();

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState('');

  /* ======================================================== */
  /* BASIC                                                    */
  /* ======================================================== */

  const [
    name,
    setName,
  ] =
    useState(
      restaurant.name
    );

  const [
    shortDescription,
    setShortDescription,
  ] =
    useState(
      restaurant.short_description ??
        ''
    );

  const [
    description,
    setDescription,
  ] =
    useState(
      restaurant.description ??
        ''
    );

  const [
    municipalityId,
    setMunicipalityId,
  ] =
    useState(
      restaurant.municipality_id
        ? String(
            restaurant.municipality_id
          )
        : ''
    );

  const [
    address,
    setAddress,
  ] =
    useState(
      restaurant.address ??
        ''
    );

  const [
    priceLevel,
    setPriceLevel,
  ] =
    useState(
      restaurant.price_level
    );

  /* ======================================================== */
  /* CONTACT                                                  */
  /* ======================================================== */

  const [
    phone,
    setPhone,
  ] =
    useState(
      restaurant.phone ??
        ''
    );

  const [
    whatsapp,
    setWhatsapp,
  ] =
    useState(
      restaurant.whatsapp ??
        ''
    );

  const [
    email,
    setEmail,
  ] =
    useState(
      restaurant.email ??
        ''
    );

  const [
    websiteUrl,
    setWebsiteUrl,
  ] =
    useState(
      restaurant.website_url ??
        ''
    );

  const [
    facebookUrl,
    setFacebookUrl,
  ] =
    useState(
      restaurant.facebook_url ??
        ''
    );

  const [
    instagramUrl,
    setInstagramUrl,
  ] =
    useState(
      restaurant.instagram_url ??
        ''
    );

  /* ======================================================== */
  /* RESERVATIONS                                             */
  /* ======================================================== */

  const [
    acceptsReservations,
    setAcceptsReservations,
  ] =
    useState(
      restaurant.accepts_reservations
    );

  const [
    minPartySize,
    setMinPartySize,
  ] =
    useState(
      restaurant.reservation_min_party_size ??
        1
    );

  const [
    maxPartySize,
    setMaxPartySize,
  ] =
    useState(
      restaurant.reservation_max_party_size ??
        12
    );

  const [
    minNoticeMinutes,
    setMinNoticeMinutes,
  ] =
    useState(
      restaurant.reservation_min_notice_minutes ??
        60
    );

  const [
    maxAdvanceDays,
    setMaxAdvanceDays,
  ] =
    useState(
      restaurant.reservation_max_advance_days ??
        30
    );

  const [
    durationMinutes,
    setDurationMinutes,
  ] =
    useState(
      restaurant.reservation_duration_minutes ??
        90
    );

  const [
    reservationInstructions,
    setReservationInstructions,
  ] =
    useState(
      restaurant.reservation_instructions ??
        ''
    );

  /* ======================================================== */
  /* SUBMIT                                                   */
  /* ======================================================== */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      isSaving
    ) {
      return;
    }

    setErrorMessage(
      ''
    );

    setSuccessMessage(
      ''
    );

    /* ====================================================== */
    /* VALIDATION                                             */
    /* ====================================================== */

    const cleanName =
      name.trim();

    if (
      cleanName.length <
      2
    ) {
      setErrorMessage(
        'Escribe un nombre válido para el restaurante.'
      );

      return;
    }

    if (
      minPartySize <
      1
    ) {
      setErrorMessage(
        'El grupo mínimo debe ser de al menos 1 persona.'
      );

      return;
    }

    if (
      maxPartySize <
      minPartySize
    ) {
      setErrorMessage(
        'El grupo máximo no puede ser menor que el grupo mínimo.'
      );

      return;
    }

    if (
      maxPartySize >
      100
    ) {
      setErrorMessage(
        'El grupo máximo no puede superar las 100 personas.'
      );

      return;
    }

    if (
      minNoticeMinutes <
      0
    ) {
      setErrorMessage(
        'La anticipación mínima no puede ser negativa.'
      );

      return;
    }

    if (
      maxAdvanceDays <
      1
    ) {
      setErrorMessage(
        'Debes permitir reservaciones al menos con 1 día de anticipación máxima.'
      );

      return;
    }

    if (
      durationMinutes <
      15
    ) {
      setErrorMessage(
        'La duración estimada debe ser de al menos 15 minutos.'
      );

      return;
    }

    /* ====================================================== */
    /* SAVE                                                   */
    /* ====================================================== */

    setIsSaving(
      true
    );

    try {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (
        !user
      ) {
        setErrorMessage(
          'Tu sesión expiró. Inicia sesión nuevamente.'
        );

        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'restaurants'
          )
          .update({
            name:
              cleanName,

            short_description:
              nullIfEmpty(
                shortDescription
              ),

            description:
              nullIfEmpty(
                description
              ),

            municipality_id:
              municipalityId
                ? Number(
                    municipalityId
                  )
                : null,

            address:
              nullIfEmpty(
                address
              ),

            phone:
              nullIfEmpty(
                phone
              ),

            whatsapp:
              nullIfEmpty(
                whatsapp
              ),

            email:
              nullIfEmpty(
                email
              ),

            website_url:
              nullIfEmpty(
                websiteUrl
              ),

            facebook_url:
              nullIfEmpty(
                facebookUrl
              ),

            instagram_url:
              nullIfEmpty(
                instagramUrl
              ),

            price_level:
              priceLevel,

            accepts_reservations:
              acceptsReservations,

            reservation_min_party_size:
              minPartySize,

            reservation_max_party_size:
              maxPartySize,

            reservation_min_notice_minutes:
              minNoticeMinutes,

            reservation_max_advance_days:
              maxAdvanceDays,

            reservation_duration_minutes:
              durationMinutes,

            reservation_instructions:
              nullIfEmpty(
                reservationInstructions
              ),
          })
          .eq(
            'id',
            restaurant.id
          )
          .eq(
            'created_by',
            user.id
          )
          .select('id')
          .maybeSingle();

      if (
        error
      ) {
        console.error(
          'Error actualizando restaurante:',
          error
        );

        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudieron guardar los cambios.')
        );

        return;
      }

      if (!data) {
        setErrorMessage(
          'No se pudo actualizar el restaurante. Verifica que todavía tengas permisos para administrarlo.'
        );

        return;
      }

      setSuccessMessage(
        'Los cambios se guardaron correctamente.'
      );

      router.refresh();
    } catch (
      error
    ) {
      console.error(
        'Error inesperado guardando restaurante:',
        error
      );

      setErrorMessage(
        'Ocurrió un error inesperado al guardar los cambios.'
      );
    } finally {
      setIsSaving(
        false
      );
    }
  }

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-6"
    >
      {/* ====================================================== */}
      {/* GENERAL                                                */}
      {/* ====================================================== */}

      <FormCard
        icon={
          Store
        }
        eyebrow="Información pública"
        title="Datos del restaurante"
        description="Esta información será visible para las personas que encuentren tu restaurante en GastroNic."
      >
        <div className="grid gap-5">
          <Field
            label="Nombre del restaurante"
            required
          >
            <input
              type="text"
              value={
                name
              }
              onChange={(
                event
              ) =>
                setName(
                  event.target.value
                )
              }
              maxLength={
                120
              }
              className={inputClass}
            />
          </Field>

          <Field
            label="Descripción corta"
            hint="Una frase breve para tarjetas y resultados de búsqueda."
          >
            <input
              type="text"
              value={
                shortDescription
              }
              onChange={(
                event
              ) =>
                setShortDescription(
                  event.target.value
                )
              }
              maxLength={
                180
              }
              className={inputClass}
            />
          </Field>

          <Field
            label="Descripción completa"
          >
            <textarea
              value={
                description
              }
              onChange={(
                event
              ) =>
                setDescription(
                  event.target.value
                )
              }
              rows={
                6
              }
              className={`${inputClass} min-h-[140px] resize-y py-3`}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Municipio"
            >
              <select
                value={
                  municipalityId
                }
                onChange={(
                  event
                ) =>
                  setMunicipalityId(
                    event.target.value
                  )
                }
                className={inputClass}
              >
                <option value="">
                  Seleccionar municipio
                </option>

                {municipalities.map(
                  (
                    municipality
                  ) => {
                    const department =
                      getDepartment(
                        municipality.department
                      );

                    return (
                      <option
                        key={
                          municipality.id
                        }
                        value={
                          municipality.id
                        }
                      >
                        {
                          municipality.name
                        }

                        {department
                          ? ` — ${department.name}`
                          : ''}
                      </option>
                    );
                  }
                )}
              </select>
            </Field>

            <Field
              label="Nivel de precio"
            >
              <select
                value={
                  priceLevel
                }
                onChange={(
                  event
                ) =>
                  setPriceLevel(
                    Number(
                      event.target.value
                    )
                  )
                }
                className={inputClass}
              >
                <option value={1}>
                  $ · Económico
                </option>

                <option value={2}>
                  $$ · Moderado
                </option>

                <option value={3}>
                  $$$ · Alto
                </option>

                <option value={4}>
                  $$$$ · Premium
                </option>
              </select>
            </Field>
          </div>

          <Field
            label="Dirección"
          >
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />

              <input
                type="text"
                value={
                  address
                }
                onChange={(
                  event
                ) =>
                  setAddress(
                    event.target.value
                  )
                }
                className={`${inputClass} pl-10`}
              />
            </div>
          </Field>
        </div>
      </FormCard>

      {/* ====================================================== */}
      {/* CONTACT                                                */}
      {/* ====================================================== */}

      <FormCard
        icon={
          Phone
        }
        eyebrow="Contacto"
        title="Canales del restaurante"
        description="Mantén actualizados los medios por los que los clientes pueden comunicarse contigo."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <IconField
            label="Teléfono"
            icon={
              Phone
            }
            value={
              phone
            }
            onChange={
              setPhone
            }
            placeholder="8888 8888"
          />

          <IconField
            label="WhatsApp"
            icon={
              MessageCircle
            }
            value={
              whatsapp
            }
            onChange={
              setWhatsapp
            }
            placeholder="8888 8888"
          />

          <IconField
            label="Correo"
            icon={
              Mail
            }
            value={
              email
            }
            onChange={
              setEmail
            }
            type="email"
            placeholder="restaurante@correo.com"
          />

          <IconField
            label="Sitio web"
            icon={
              Globe2
            }
            value={
              websiteUrl
            }
            onChange={
              setWebsiteUrl
            }
            type="url"
            placeholder="https://..."
          />

          <Field label="Facebook">
            <input
              type="url"
              value={
                facebookUrl
              }
              onChange={(
                event
              ) =>
                setFacebookUrl(
                  event.target.value
                )
              }
              placeholder="https://facebook.com/..."
              className={inputClass}
            />
          </Field>

          <Field label="Instagram">
            <input
              type="url"
              value={
                instagramUrl
              }
              onChange={(
                event
              ) =>
                setInstagramUrl(
                  event.target.value
                )
              }
              placeholder="https://instagram.com/..."
              className={inputClass}
            />
          </Field>
        </div>
      </FormCard>

      {/* ====================================================== */}
      {/* RESERVATIONS                                           */}
      {/* ====================================================== */}

      <FormCard
        icon={
          CalendarDays
        }
        eyebrow="Reservaciones"
        title="Configura cómo recibes reservaciones"
        description="Estas reglas se utilizarán para controlar qué solicitudes pueden realizar los clientes."
      >
        {/* Toggle */}

        <button
          type="button"
          onClick={() =>
            setAcceptsReservations(
              (
                current
              ) =>
                !current
            )
          }
          className={`flex w-full items-center justify-between gap-5 rounded-2xl border p-4 text-left transition ${
            acceptsReservations
              ? 'border-primary/20 bg-primary/[0.045]'
              : 'border-border bg-canvas'
          }`}
        >
          <div>
            <p className="text-sm font-bold text-ink">
              Aceptar reservaciones
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Permite que los usuarios soliciten una mesa directamente desde
              GastroNic.
            </p>
          </div>

          <div
            className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${
              acceptsReservations
                ? 'bg-action'
                : 'bg-[#D7DEDC]'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                acceptsReservations
                  ? 'left-6'
                  : 'left-1'
              }`}
            />
          </div>
        </button>

        {acceptsReservations && (
          <div className="mt-6 space-y-6">
            {/* Party */}

            <div>
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-action" />

                <p className="text-xs font-bold text-ink">
                  Tamaño del grupo
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <NumberField
                  label="Mínimo de personas"
                  value={
                    minPartySize
                  }
                  onChange={
                    setMinPartySize
                  }
                  min={
                    1
                  }
                  max={
                    100
                  }
                />

                <NumberField
                  label="Máximo de personas"
                  value={
                    maxPartySize
                  }
                  onChange={
                    setMaxPartySize
                  }
                  min={
                    1
                  }
                  max={
                    100
                  }
                />
              </div>
            </div>

            {/* Rules */}

            <div className="border-t border-border/60 pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-action" />

                <p className="text-xs font-bold text-ink">
                  Reglas de tiempo
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <NumberField
                  label="Anticipación mínima"
                  hint="Minutos"
                  value={
                    minNoticeMinutes
                  }
                  onChange={
                    setMinNoticeMinutes
                  }
                  min={
                    0
                  }
                  max={
                    10080
                  }
                />

                <NumberField
                  label="Reservar hasta"
                  hint="Días hacia adelante"
                  value={
                    maxAdvanceDays
                  }
                  onChange={
                    setMaxAdvanceDays
                  }
                  min={
                    1
                  }
                  max={
                    365
                  }
                />

                <NumberField
                  label="Duración estimada"
                  hint="Minutos"
                  value={
                    durationMinutes
                  }
                  onChange={
                    setDurationMinutes
                  }
                  min={
                    15
                  }
                  max={
                    720
                  }
                />
              </div>
            </div>

            {/* Instructions */}

            <div className="border-t border-border/60 pt-6">
              <Field
                label="Instrucciones para el cliente"
                hint="Por ejemplo: tolerancia de llegada, indicaciones especiales o políticas del establecimiento."
              >
                <textarea
                  value={
                    reservationInstructions
                  }
                  onChange={(
                    event
                  ) =>
                    setReservationInstructions(
                      event.target.value
                    )
                  }
                  rows={
                    4
                  }
                  maxLength={
                    1000
                  }
                  placeholder="Ej. Conservamos la mesa durante 15 minutos después de la hora reservada."
                  className={`${inputClass} min-h-[110px] resize-y py-3`}
                />

                <p className="mt-2 text-right text-xs text-muted-foreground">
                  {
                    reservationInstructions.length
                  }
                  /1000
                </p>
              </Field>
            </div>
          </div>
        )}
      </FormCard>

      {/* ====================================================== */}
      {/* MESSAGES                                               */}
      {/* ====================================================== */}

      {errorMessage && (
        <div className="rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm leading-6 text-danger">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-success/25 bg-success-soft px-4 py-3 text-sm font-medium text-success">
          <Check className="h-4 w-4 flex-shrink-0" />

          {successMessage}
        </div>
      )}

      {/* ====================================================== */}
      {/* SAVE                                                   */}
      {/* ====================================================== */}

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-border/80 bg-white/95 p-4 shadow-raised backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Los cambios se reflejarán en el perfil del restaurante.
        </p>

        <Button
          type="submit"
          disabled={
            isSaving
          }
          className="h-11 rounded-xl px-6 font-bold"
        >
          {isSaving ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />

              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

/* ========================================================== */
/* FORM CARD                                                  */
/* ========================================================== */

function FormCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon:
    typeof Store;

  eyebrow:
    string;

  title:
    string;

  description:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-card border border-border/70 bg-white shadow-sm">
      <div className="border-b border-border/60 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-4 w-4 text-action" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              {eyebrow}
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-ink">
              {title}
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

/* ========================================================== */
/* FIELD                                                      */
/* ========================================================== */

function Field({
  label,
  hint,
  required = false,
  children,
}: {
  label:
    string;

  hint?:
    string;

  required?:
    boolean;

  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-ink">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {hint && (
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      )}

      <div className="mt-2">
        {children}
      </div>
    </label>
  );
}

/* ========================================================== */
/* ICON FIELD                                                 */
/* ========================================================== */

function IconField({
  label,
  icon: Icon,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label:
    string;

  icon:
    typeof Phone;

  value:
    string;

  onChange:
    (
      value:
        string
    ) => void;

  type?:
    string;

  placeholder?:
    string;
}) {
  return (
    <Field
      label={
        label
      }
    >
      <div className="relative">
        <Icon className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />

        <input
          type={
            type
          }
          value={
            value
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          placeholder={
            placeholder
          }
          className={`${inputClass} pl-10`}
        />
      </div>
    </Field>
  );
}

/* ========================================================== */
/* NUMBER FIELD                                               */
/* ========================================================== */

function NumberField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
}: {
  label:
    string;

  hint?:
    string;

  value:
    number;

  onChange:
    (
      value:
        number
    ) => void;

  min:
    number;

  max:
    number;
}) {
  return (
    <Field
      label={
        label
      }
      hint={
        hint
      }
    >
      <input
        type="number"
        value={
          value
        }
        min={
          min
        }
        max={
          max
        }
        onChange={(
          event
        ) => {
          const parsed =
            Number(
              event.target.value
            );

          onChange(
            Number.isFinite(
              parsed
            )
              ? parsed
              : min
          );
        }}
        className={inputClass}
      />
    </Field>
  );
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

const inputClass =
  'h-11 w-full rounded-xl border border-border bg-canvas px-3.5 text-sm text-ink outline-none transition placeholder:text-muted-foreground/50 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/10';

function nullIfEmpty(
  value: string
) {
  const cleaned =
    value.trim();

  return cleaned
    ? cleaned
    : null;
}

function getDepartment(
  department:
    | DepartmentOption
    | DepartmentOption[]
    | null
) {
  if (
    Array.isArray(
      department
    )
  ) {
    return (
      department[0] ??
      null
    );
  }

  return department;
}