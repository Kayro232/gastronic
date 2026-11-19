'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Edit3,
  LoaderCircle,
  Moon,
  Plus,
  Save,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useConfirm } from '@/components/common/confirm-dialog';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase =
  createClient();

interface RestaurantHour {
  id?: string;
  restaurant_id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
}

interface RestaurantSpecialHour {
  id: string;
  restaurant_id: string;
  special_date: string;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  note: string | null;
}

interface RestaurantHoursFormProps {
  restaurantId: string;
  restaurantName: string;
  initialHours: RestaurantHour[];
  initialSpecialHours: RestaurantSpecialHour[];
}

interface DayState {
  dayOfWeek: number;
  name: string;
  shortName: string;
  isClosed: boolean;
  opensAt: string;
  closesAt: string;
}

interface SpecialHourForm {
  id: string | null;
  specialDate: string;
  isClosed: boolean;
  opensAt: string;
  closesAt: string;
  note: string;
}

const days = [
  { dayOfWeek: 0, name: 'Domingo', shortName: 'Dom' },
  { dayOfWeek: 1, name: 'Lunes', shortName: 'Lun' },
  { dayOfWeek: 2, name: 'Martes', shortName: 'Mar' },
  { dayOfWeek: 3, name: 'Miércoles', shortName: 'Mié' },
  { dayOfWeek: 4, name: 'Jueves', shortName: 'Jue' },
  { dayOfWeek: 5, name: 'Viernes', shortName: 'Vie' },
  { dayOfWeek: 6, name: 'Sábado', shortName: 'Sáb' },
];

const emptySpecialForm: SpecialHourForm = {
  id: null,
  specialDate: '',
  isClosed: false,
  opensAt: '08:00',
  closesAt: '22:00',
  note: '',
};

export function RestaurantHoursForm({
  restaurantId,
  restaurantName,
  initialHours,
  initialSpecialHours,
}: RestaurantHoursFormProps) {
  const initialDayStates =
    useMemo(() => {
      return days.map(
        (day): DayState => {
          const existing =
            initialHours.find(
              (hour) =>
                hour.day_of_week ===
                day.dayOfWeek
            );

          if (!existing) {
            return {
              ...day,
              isClosed: true,
              opensAt: '08:00',
              closesAt: '22:00',
            };
          }

          return {
            ...day,
            isClosed:
              existing.is_closed,
            opensAt:
              normalizeTime(
                existing.opens_at
              ) || '08:00',
            closesAt:
              normalizeTime(
                existing.closes_at
              ) || '22:00',
          };
        }
      );
    }, [initialHours]);

  const [
    schedules,
    setSchedules,
  ] =
    useState<DayState[]>(
      initialDayStates
    );

  const [
    specialHours,
    setSpecialHours,
  ] =
    useState<RestaurantSpecialHour[]>(
      initialSpecialHours
    );

  const [
    specialForm,
    setSpecialForm,
  ] =
    useState<SpecialHourForm>(
      emptySpecialForm
    );

  const [
    showSpecialModal,
    setShowSpecialModal,
  ] =
    useState(false);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    specialActionId,
    setSpecialActionId,
  ] =
    useState<string | null>(
      null
    );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const openDays =
    schedules.filter(
      (day) =>
        !day.isClosed
    ).length;

  const sortedSpecialHours =
    useMemo(
      () =>
        [...specialHours].sort(
          (a, b) =>
            a.special_date.localeCompare(
              b.special_date
            )
        ),
      [specialHours]
    );

  function updateDay(
    dayOfWeek: number,
    changes: Partial<DayState>
  ) {
    setSchedules(
      (current) =>
        current.map((day) =>
          day.dayOfWeek ===
          dayOfWeek
            ? {
                ...day,
                ...changes,
              }
            : day
        )
    );

    clearFeedback();
  }

  function clearFeedback() {
    setErrorMessage('');
    setSuccessMessage('');
  }

  function applyToAllDays() {
    const base =
      schedules.find(
        (day) =>
          !day.isClosed
      ) ??
      schedules[1];

    setSchedules(
      (current) =>
        current.map((day) => ({
          ...day,
          isClosed: false,
          opensAt:
            base.opensAt,
          closesAt:
            base.closesAt,
        }))
    );

    clearFeedback();
  }

  function applyWeekdays() {
    const monday =
      schedules.find(
        (day) =>
          day.dayOfWeek === 1
      );

    if (!monday) {
      return;
    }

    setSchedules(
      (current) =>
        current.map((day) => {
          if (
            day.dayOfWeek >= 1 &&
            day.dayOfWeek <= 5
          ) {
            return {
              ...day,
              isClosed:
                monday.isClosed,
              opensAt:
                monday.opensAt,
              closesAt:
                monday.closesAt,
            };
          }

          return day;
        })
    );

    clearFeedback();
  }

  function closeWeekend() {
    setSchedules(
      (current) =>
        current.map((day) => {
          if (
            day.dayOfWeek === 0 ||
            day.dayOfWeek === 6
          ) {
            return {
              ...day,
              isClosed: true,
            };
          }

          return day;
        })
    );

    clearFeedback();
  }

  async function handleSave() {
    clearFeedback();

    for (const day of schedules) {
      if (
        !day.isClosed &&
        (!day.opensAt ||
          !day.closesAt)
      ) {
        setErrorMessage(
          `Completa las horas de ${day.name}.`
        );

        return;
      }

      if (
        !day.isClosed &&
        day.opensAt ===
          day.closesAt
      ) {
        setErrorMessage(
          `La apertura y el cierre de ${day.name} no pueden ser iguales.`
        );

        return;
      }
    }

    setIsSaving(true);

    try {
      const payload =
        schedules.map(
          (day) => ({
            restaurant_id:
              restaurantId,
            day_of_week:
              day.dayOfWeek,
            opens_at:
              day.isClosed
                ? null
                : day.opensAt,
            closes_at:
              day.isClosed
                ? null
                : day.closesAt,
            is_closed:
              day.isClosed,
          })
        );

      const { error } =
        await supabase
          .from(
            'restaurant_hours'
          )
          .upsert(
            payload,
            {
              onConflict:
                'restaurant_id,day_of_week',
            }
          );

      if (error) {
        console.error(
          'Error guardando horarios:',
          error
        );

        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudieron guardar los horarios.')
        );

        return;
      }

      setSuccessMessage(
        `Los horarios de "${restaurantName}" fueron actualizados correctamente.`
      );
    } catch (error) {
      console.error(
        'Error inesperado guardando horarios:',
        error
      );

      setErrorMessage(
        'Ocurrió un error inesperado al guardar los horarios.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function openNewSpecialHour() {
    clearFeedback();

    setSpecialForm({
      ...emptySpecialForm,
      specialDate:
        getTodayInputValue(),
    });

    setShowSpecialModal(
      true
    );
  }

  function openEditSpecialHour(
    specialHour: RestaurantSpecialHour
  ) {
    clearFeedback();

    setSpecialForm({
      id:
        specialHour.id,
      specialDate:
        specialHour.special_date,
      isClosed:
        specialHour.is_closed,
      opensAt:
        normalizeTime(
          specialHour.opens_at
        ) || '08:00',
      closesAt:
        normalizeTime(
          specialHour.closes_at
        ) || '22:00',
      note:
        specialHour.note ??
        '',
    });

    setShowSpecialModal(
      true
    );
  }

  function closeSpecialModal() {
    if (
      specialActionId ===
      'saving-special'
    ) {
      return;
    }

    setShowSpecialModal(
      false
    );

    setSpecialForm(
      emptySpecialForm
    );

    setErrorMessage('');
  }

  async function handleSaveSpecialHour() {
    clearFeedback();

    if (
      !specialForm.specialDate
    ) {
      setErrorMessage(
        'Selecciona una fecha especial.'
      );

      return;
    }

    if (
      !specialForm.isClosed &&
      (
        !specialForm.opensAt ||
        !specialForm.closesAt
      )
    ) {
      setErrorMessage(
        'Completa la hora de apertura y cierre.'
      );

      return;
    }

    if (
      !specialForm.isClosed &&
      specialForm.opensAt ===
        specialForm.closesAt
    ) {
      setErrorMessage(
        'La apertura y el cierre no pueden ser iguales.'
      );

      return;
    }

    const duplicated =
      specialHours.some(
        (item) =>
          item.special_date ===
            specialForm.specialDate &&
          item.id !==
            specialForm.id
      );

    if (duplicated) {
      setErrorMessage(
        'Ya existe un horario especial para esa fecha.'
      );

      return;
    }

    setSpecialActionId(
      'saving-special'
    );

    const payload = {
      restaurant_id:
        restaurantId,
      special_date:
        specialForm.specialDate,
      opens_at:
        specialForm.isClosed
          ? null
          : specialForm.opensAt,
      closes_at:
        specialForm.isClosed
          ? null
          : specialForm.closesAt,
      is_closed:
        specialForm.isClosed,
      note:
        specialForm.note.trim() ||
        null,
      updated_at:
        new Date().toISOString(),
    };

    try {
      if (
        specialForm.id
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'restaurant_special_hours'
            )
            .update(
              payload
            )
            .eq(
              'id',
              specialForm.id
            )
            .eq(
              'restaurant_id',
              restaurantId
            )
            .select(`
              id,
              restaurant_id,
              special_date,
              opens_at,
              closes_at,
              is_closed,
              note
            `)
            .single();

        if (error) {
          setErrorMessage(
            getUserFacingErrorMessage(error, 'No se pudo actualizar el horario especial.')
          );

          return;
        }

        setSpecialHours(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                specialForm.id
                  ? (data as RestaurantSpecialHour)
                  : item
            )
        );

        setSuccessMessage(
          'El horario especial fue actualizado.'
        );
      } else {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'restaurant_special_hours'
            )
            .insert(
              payload
            )
            .select(`
              id,
              restaurant_id,
              special_date,
              opens_at,
              closes_at,
              is_closed,
              note
            `)
            .single();

        if (error) {
          setErrorMessage(
            getUserFacingErrorMessage(error, 'No se pudo crear el horario especial.')
          );

          return;
        }

        setSpecialHours(
          (current) => [
            ...current,
            data as RestaurantSpecialHour,
          ]
        );

        setSuccessMessage(
          'El horario especial fue agregado.'
        );
      }

      setShowSpecialModal(
        false
      );

      setSpecialForm(
        emptySpecialForm
      );
    } finally {
      setSpecialActionId(
        null
      );
    }
  }

  const confirm = useConfirm();

  async function handleDeleteSpecialHour(
    specialHour: RestaurantSpecialHour
  ) {
    clearFeedback();

    const confirmed =
      await confirm({
        title: `¿Eliminar el horario especial del ${formatDate(specialHour.special_date)}?`,
        confirmLabel: 'Eliminar horario',
        tone: 'danger',
      });

    if (
      !confirmed
    ) {
      return;
    }

    setSpecialActionId(
      specialHour.id
    );

    try {
      const {
        error,
      } =
        await supabase
          .from(
            'restaurant_special_hours'
          )
          .delete()
          .eq(
            'id',
            specialHour.id
          )
          .eq(
            'restaurant_id',
            restaurantId
          );

      if (error) {
        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo eliminar el horario especial.')
        );

        return;
      }

      setSpecialHours(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              specialHour.id
          )
      );

      setSuccessMessage(
        'El horario especial fue eliminado.'
      );
    } finally {
      setSpecialActionId(
        null
      );
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-sheet bg-ink p-6 text-white shadow-overlay sm:p-7">

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-white/40">
              <CalendarDays className="h-3.5 w-3.5" />
              Resumen semanal
            </div>

            <h2 className="mt-3 text-2xl font-bold">
              {openDays}{' '}
              {openDays === 1
                ? 'día abierto'
                : 'días abiertos'}
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              Revisa tu semana y ajusta rápidamente los días que necesites.
            </p>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {schedules.map(
              (day) => (
                <div
                  key={
                    day.dayOfWeek
                  }
                  className={`flex h-12 w-10 items-center justify-center rounded-xl text-xs font-bold ${
                    day.isClosed
                      ? 'bg-white/5 text-white/30'
                      : 'bg-white text-ink'
                  }`}
                >
                  {
                    day.shortName
                  }
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="border-b border-border/60 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-4 w-4 text-action" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Configuración rápida
              </p>

              <h2 className="mt-1 text-lg font-bold text-ink">
                Ahorra tiempo
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Aplica configuraciones comunes y luego ajusta cada día si hace falta.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
          <QuickAction
            icon={Sun}
            title="Todos los días"
            description="Usa el mismo horario toda la semana."
            onClick={
              applyToAllDays
            }
          />

          <QuickAction
            icon={Copy}
            title="Lunes a viernes"
            description="Copia el horario del lunes."
            onClick={
              applyWeekdays
            }
          />

          <QuickAction
            icon={Moon}
            title="Cerrar fin de semana"
            description="Marca sábado y domingo como cerrados."
            onClick={
              closeWeekend
            }
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="border-b border-border/60 px-5 py-5 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            Semana habitual
          </p>

          <h2 className="mt-1 text-lg font-bold text-ink">
            Horarios de atención
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Ajusta individualmente cada día.
          </p>
        </div>

        <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
          {schedules.map(
            (day) => (
              <DayCard
                key={
                  day.dayOfWeek
                }
                day={day}
                disabled={
                  isSaving
                }
                onChange={(
                  changes
                ) =>
                  updateDay(
                    day.dayOfWeek,
                    changes
                  )
                }
              />
            )
          )}
        </div>

        {(errorMessage ||
          successMessage) && (
          <div className="border-t border-border/60 px-5 py-5 sm:px-6">
            {errorMessage && (
              <FeedbackMessage
                type="error"
                message={
                  errorMessage
                }
              />
            )}

            {successMessage && (
              <FeedbackMessage
                type="success"
                message={
                  successMessage
                }
              />
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-border/60 bg-canvas px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="max-w-xl text-xs leading-5 text-muted-foreground">
            El estado “Abierto ahora” de GastroNic utiliza estos horarios.
          </p>

          <Button
            type="button"
            onClick={
              handleSave
            }
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
                Guardar horarios
              </>
            )}
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Excepciones
            </p>

            <h2 className="mt-1 text-lg font-bold text-ink">
              Horarios especiales
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Define cierres o horarios distintos para fechas específicas.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={
              openNewSpecialHour
            }
            className="h-10 rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar fecha
          </Button>
        </div>

        <div className="p-5 sm:p-6">
          {sortedSpecialHours.length ===
          0 ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-card border border-dashed border-border bg-canvas p-6 text-center">
              <div>
                <CalendarDays className="mx-auto h-6 w-6 text-muted-foreground/40" />

                <p className="mt-3 text-sm font-bold text-ink">
                  Sin horarios especiales
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Agrega feriados, cierres o jornadas especiales cuando los necesites.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {sortedSpecialHours.map(
                (
                  specialHour
                ) => (
                  <SpecialHourCard
                    key={
                      specialHour.id
                    }
                    specialHour={
                      specialHour
                    }
                    busy={
                      specialActionId ===
                      specialHour.id
                    }
                    onEdit={() =>
                      openEditSpecialHour(
                        specialHour
                      )
                    }
                    onDelete={() =>
                      handleDeleteSpecialHour(
                        specialHour
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </section>

      {showSpecialModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-sheet border border-border bg-white shadow-modal">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  Excepción de calendario
                </p>

                <h2 className="mt-1 text-xl font-bold text-ink">
                  {specialForm.id
                    ? 'Editar horario especial'
                    : 'Nuevo horario especial'}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeSpecialModal
                }
                disabled={
                  specialActionId ===
                  'saving-special'
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <FormField label="Fecha">
                <input
                  type="date"
                  value={
                    specialForm.specialDate
                  }
                  onChange={(
                    event
                  ) =>
                    setSpecialForm(
                      (
                        current
                      ) => ({
                        ...current,
                        specialDate:
                          event.target.value,
                      })
                    )
                  }
                  className="form-input"
                />
              </FormField>

              <div className="rounded-2xl border border-border bg-canvas p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-ink">
                      Restaurante cerrado
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Actívalo si no habrá atención durante todo ese día.
                    </p>
                  </div>

                  <OpenToggle
                    open={
                      specialForm.isClosed
                    }
                    disabled={
                      specialActionId ===
                      'saving-special'
                    }
                    onChange={(
                      value
                    ) =>
                      setSpecialForm(
                        (
                          current
                        ) => ({
                          ...current,
                          isClosed:
                            value,
                        })
                      )
                    }
                  />
                </div>
              </div>

              {!specialForm.isClosed && (
                <div className="grid grid-cols-2 gap-3">
                  <TimeCard
                    label="Apertura"
                    value={
                      specialForm.opensAt
                    }
                    disabled={
                      specialActionId ===
                      'saving-special'
                    }
                    onChange={(
                      value
                    ) =>
                      setSpecialForm(
                        (
                          current
                        ) => ({
                          ...current,
                          opensAt:
                            value,
                        })
                      )
                    }
                  />

                  <TimeCard
                    label="Cierre"
                    value={
                      specialForm.closesAt
                    }
                    disabled={
                      specialActionId ===
                      'saving-special'
                    }
                    onChange={(
                      value
                    ) =>
                      setSpecialForm(
                        (
                          current
                        ) => ({
                          ...current,
                          closesAt:
                            value,
                        })
                      )
                    }
                  />
                </div>
              )}

              <FormField
                label="Nota"
                hint="Opcional"
              >
                <textarea
                  value={
                    specialForm.note
                  }
                  onChange={(
                    event
                  ) =>
                    setSpecialForm(
                      (
                        current
                      ) => ({
                        ...current,
                        note:
                          event.target.value,
                      })
                    )
                  }
                  rows={3}
                  placeholder="Ej. Cerrado por feriado nacional"
                  className="form-input min-h-24 resize-none py-3"
                />
              </FormField>

              {errorMessage && (
                <FeedbackMessage
                  type="error"
                  message={
                    errorMessage
                  }
                />
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border bg-canvas px-6 py-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={
                  closeSpecialModal
                }
                disabled={
                  specialActionId ===
                  'saving-special'
                }
                className="rounded-xl"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={
                  handleSaveSpecialHour
                }
                disabled={
                  specialActionId ===
                  'saving-special'
                }
                className="rounded-xl"
              >
                {specialActionId ===
                'saving-special' ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {specialForm.id
                      ? 'Guardar cambios'
                      : 'Agregar fecha'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .form-input {
          min-height: 48px;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: #f8faf9;
          padding-left: 1rem;
          padding-right: 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: hsl(var(--primary) / 0.35);
          background: white;
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.06);
        }
      `}</style>
    </div>
  );
}

function DayCard({
  day,
  disabled,
  onChange,
}: {
  day: DayState;
  disabled: boolean;
  onChange: (
    changes: Partial<DayState>
  ) => void;
}) {
  const isOpen =
    !day.isClosed;

  const crossesMidnight =
    isOpen &&
    day.closesAt <
      day.opensAt;

  return (
    <article
      className={`relative overflow-hidden rounded-card border p-5 transition ${
        isOpen
          ? 'border-border/70 bg-white'
          : 'border-border/60 bg-canvas'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
              isOpen
                ? 'bg-primary/10 text-action'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {isOpen ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-ink">
              {day.name}
            </h3>

            <p
              className={`mt-1 text-xs font-bold uppercase tracking-[0.08em] ${
                isOpen
                  ? 'text-success'
                  : 'text-muted-foreground'
              }`}
            >
              {isOpen
                ? 'Abierto'
                : 'Cerrado'}
            </p>
          </div>
        </div>

        <OpenToggle
          open={
            isOpen
          }
          disabled={
            disabled
          }
          onChange={(
            open
          ) =>
            onChange({
              isClosed:
                !open,
            })
          }
        />
      </div>

      {isOpen ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <TimeCard
              label="Apertura"
              value={
                day.opensAt
              }
              disabled={
                disabled
              }
              onChange={(
                value
              ) =>
                onChange({
                  opensAt:
                    value,
                })
              }
            />

            <TimeCard
              label="Cierre"
              value={
                day.closesAt
              }
              disabled={
                disabled
              }
              onChange={(
                value
              ) =>
                onChange({
                  closesAt:
                    value,
                })
              }
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-canvas px-4 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Resumen
              </p>

              <p className="mt-1 text-xs font-bold text-ink">
                {formatTime(
                  day.opensAt
                )}{' '}
                —{' '}
                {formatTime(
                  day.closesAt
                )}
              </p>
            </div>

            {crossesMidnight && (
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                Cierra al día siguiente
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="mt-6 flex min-h-[104px] items-center justify-center rounded-xl border border-dashed border-border bg-white/70 p-4 text-center">
          <div>
            <Moon className="mx-auto h-5 w-5 text-muted-foreground/50" />

            <p className="mt-2 text-xs font-medium text-muted-foreground">
              El restaurante permanece cerrado este día.
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

function SpecialHourCard({
  specialHour,
  busy,
  onEdit,
  onDelete,
}: {
  specialHour: RestaurantSpecialHour;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const crossesMidnight =
    !specialHour.is_closed &&
    normalizeTime(
      specialHour.closes_at
    ) <
      normalizeTime(
        specialHour.opens_at
      );

  return (
    <article className="flex flex-col gap-4 rounded-card border border-border/70 bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
            specialHour.is_closed
              ? 'bg-slate-100 text-slate-500'
              : 'bg-primary/10 text-action'
          }`}
        >
          {specialHour.is_closed ? (
            <Moon className="h-4 w-4" />
          ) : (
            <CalendarDays className="h-4 w-4" />
          )}
        </div>

        <div>
          <p className="text-sm font-bold text-ink">
            {formatDate(
              specialHour.special_date
            )}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {specialHour.is_closed
              ? 'Cerrado todo el día'
              : `${formatTime(normalizeTime(specialHour.opens_at))} — ${formatTime(normalizeTime(specialHour.closes_at))}`}
          </p>

          {crossesMidnight && (
            <p className="mt-1 text-xs font-semibold text-blue-700">
              Cierra al día siguiente
            </p>
          )}

          {specialHour.note && (
            <p className="mt-1 text-xs text-muted-foreground">
              {specialHour.note}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 sm:flex-shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={
            onEdit
          }
          disabled={
            busy
          }
          className="h-9 rounded-xl px-3 text-xs"
        >
          <Edit3 className="mr-2 h-3.5 w-3.5" />
          Editar
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={
            onDelete
          }
          disabled={
            busy
          }
          className="h-9 rounded-xl border-danger/25 px-3 text-xs text-danger hover:bg-danger-soft hover:text-danger"
        >
          {busy ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </article>
  );
}

function TimeCard({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block rounded-xl border border-border/70 bg-canvas p-3 transition focus-within:border-primary/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/[0.05]">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>

      <div className="mt-2 flex items-center gap-2">
        <Clock3 className="h-4 w-4 flex-shrink-0 text-action" />

        <input
          type="time"
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="min-w-0 flex-1 bg-transparent text-base font-bold text-ink outline-none disabled:opacity-60"
        />
      </div>
    </label>
  );
}

function OpenToggle({
  open,
  disabled,
  onChange,
}: {
  open: boolean;
  disabled: boolean;
  onChange: (
    open: boolean
  ) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={open}
      disabled={disabled}
      onClick={() =>
        onChange(!open)
      }
      className="flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`relative h-7 w-12 rounded-full transition ${
          open
            ? 'bg-action'
            : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            open
              ? 'translate-x-6'
              : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="group flex items-start gap-3 rounded-card border border-border/70 bg-canvas p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-sm"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-action transition group-hover:bg-action group-hover:text-white">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <p className="text-xs font-bold text-ink">
          {title}
        </p>

        <p className="mt-1 text-xs leading-4 text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children:
    React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label className="text-xs font-bold text-ink">
          {label}
        </label>

        {hint && (
          <span className="text-xs text-muted-foreground">
            {hint}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

function FeedbackMessage({
  type,
  message,
}: {
  type:
    | 'error'
    | 'success';
  message: string;
}) {
  if (
    type ===
    'error'
  ) {
    return (
      <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
        {message}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm text-success">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
      {message}
    </div>
  );
}

function normalizeTime(
  value: string | null
) {
  if (!value) {
    return '';
  }

  return value.slice(
    0,
    5
  );
}

function formatTime(
  value: string
) {
  if (!value) {
    return '—';
  }

  const [
    hours,
    minutes,
  ] = value
    .split(':')
    .map(Number);

  const date =
    new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return new Intl.DateTimeFormat(
    'es-NI',
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  ).format(date);
}

function formatDate(
  value: string
) {
  const date =
    new Date(
      `${value}T12:00:00`
    );

  return new Intl.DateTimeFormat(
    'es-NI',
    {
      weekday:
        'short',
      day:
        'numeric',
      month:
        'long',
      year:
        'numeric',
    }
  ).format(
    date
  );
}

function getTodayInputValue() {
  const date =
    new Date();

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset *
          60 *
          1000
    );

  return localDate
    .toISOString()
    .slice(
      0,
      10
    );
}
