'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  Accessibility,
  Bike,
  CalendarCheck,
  Car,
  Check,
  CheckCircle2,
  CreditCard,
  Heart,
  LoaderCircle,
  Music,
  PawPrint,
  Save,
  Snowflake,
  Sparkles,
  Sun,
  Users,
  Wifi,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase =
  createClient();

interface Amenity {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
}

interface RestaurantAmenitiesManagerProps {
  restaurantId: string;
  restaurantName: string;
  amenities: Amenity[];
  initialSelectedIds: number[];
}

const iconMap = {
  wifi: Wifi,
  car: Car,
  snowflake: Snowflake,
  sun: Sun,
  accessibility:
    Accessibility,
  'paw-print':
    PawPrint,
  'credit-card':
    CreditCard,
  'calendar-check':
    CalendarCheck,
  users: Users,
  heart: Heart,
  music: Music,
  bike: Bike,
};

export function RestaurantAmenitiesManager({
  restaurantId,
  restaurantName,
  amenities,
  initialSelectedIds,
}: RestaurantAmenitiesManagerProps) {
  const [
    selectedIds,
    setSelectedIds,
  ] = useState<
    number[]
  >(
    initialSelectedIds
  );

  const [
    savedIds,
    setSavedIds,
  ] = useState<
    number[]
  >(
    initialSelectedIds
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const hasChanges =
    useMemo(() => {
      const current =
        [...selectedIds].sort(
          (a, b) => a - b
        );

      const saved =
        [...savedIds].sort(
          (a, b) => a - b
        );

      return (
        JSON.stringify(
          current
        ) !==
        JSON.stringify(
          saved
        )
      );
    }, [
      selectedIds,
      savedIds,
    ]);

  const selectedAmenities =
    amenities.filter(
      (amenity) =>
        selectedIds.includes(
          amenity.id
        )
    );

  function toggleAmenity(
    amenityId: number
  ) {
    setErrorMessage('');
    setSuccessMessage('');

    setSelectedIds(
      (current) =>
        current.includes(
          amenityId
        )
          ? current.filter(
              (id) =>
                id !==
                amenityId
            )
          : [
              ...current,
              amenityId,
            ]
    );
  }

  function selectAll() {
    setSelectedIds(
      amenities.map(
        (amenity) =>
          amenity.id
      )
    );

    setErrorMessage('');
    setSuccessMessage('');
  }

  function clearAll() {
    setSelectedIds([]);

    setErrorMessage('');
    setSuccessMessage('');
  }

  async function handleSave() {
    if (!hasChanges) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const idsToAdd =
        selectedIds.filter(
          (id) =>
            !savedIds.includes(
              id
            )
        );

      const idsToRemove =
        savedIds.filter(
          (id) =>
            !selectedIds.includes(
              id
            )
        );

      if (
        idsToRemove.length >
        0
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              'restaurant_amenities'
            )
            .delete()
            .eq(
              'restaurant_id',
              restaurantId
            )
            .in(
              'amenity_id',
              idsToRemove
            );

        if (error) {
          console.error(
            'Error eliminando amenidades:',
            error
          );

          setErrorMessage(
            getUserFacingErrorMessage(error, 'No se pudieron actualizar los servicios.')
          );

          return;
        }
      }

      if (
        idsToAdd.length >
        0
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              'restaurant_amenities'
            )
            .insert(
              idsToAdd.map(
                (
                  amenityId
                ) => ({
                  restaurant_id:
                    restaurantId,

                  amenity_id:
                    amenityId,
                })
              )
            );

        if (error) {
          console.error(
            'Error agregando amenidades:',
            error
          );

          setErrorMessage(
            getUserFacingErrorMessage(error, 'No se pudieron actualizar los servicios.')
          );

          return;
        }
      }

      setSavedIds(
        selectedIds
      );

      setSuccessMessage(
        `Los servicios de "${restaurantName}" fueron actualizados correctamente.`
      );
    } catch (error) {
      console.error(
        'Error inesperado guardando amenidades:',
        error
      );

      setErrorMessage(
        'Ocurrió un error inesperado al guardar los servicios.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* SUMMARY */}

      <section className="relative overflow-hidden rounded-sheet bg-ink p-6 text-white shadow-overlay sm:p-7">

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-white/40">
              <Sparkles className="h-3.5 w-3.5" />

              Experiencia del cliente
            </div>

            <h2 className="mt-3 text-2xl font-bold">
              {
                selectedIds.length
              }{' '}
              {selectedIds.length ===
              1
                ? 'servicio seleccionado'
                : 'servicios seleccionados'}
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              Selecciona únicamente los servicios que tu establecimiento ofrece
              actualmente.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedAmenities
              .slice(0, 4)
              .map(
                (amenity) => {
                  const Icon =
                    getAmenityIcon(
                      amenity.icon
                    );

                  return (
                    <div
                      key={
                        amenity.id
                      }
                      title={
                        amenity.name
                      }
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  );
                }
              )}

            {selectedAmenities.length >
              4 && (
              <div className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] px-3 text-xs font-bold text-white/70">
                +
                {selectedAmenities.length -
                  4}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MANAGER */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Servicios disponibles
            </p>

            <h2 className="mt-1 text-lg font-bold text-ink">
              ¿Qué ofrece tu restaurante?
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Activa o desactiva cada opción según corresponda.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={
                clearAll
              }
              disabled={
                isSaving ||
                selectedIds.length ===
                  0
              }
              className="h-9 rounded-xl text-xs"
            >
              Limpiar
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={
                selectAll
              }
              disabled={
                isSaving ||
                selectedIds.length ===
                  amenities.length
              }
              className="h-9 rounded-xl text-xs"
            >
              Seleccionar todos
            </Button>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {amenities.map(
            (amenity) => (
              <AmenityCard
                key={
                  amenity.id
                }
                amenity={
                  amenity
                }
                selected={
                  selectedIds.includes(
                    amenity.id
                  )
                }
                disabled={
                  isSaving
                }
                onToggle={() =>
                  toggleAmenity(
                    amenity.id
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
              <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
                {
                  errorMessage
                }
              </div>
            )}

            {successMessage && (
              <div className="flex items-start gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm text-success">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />

                {
                  successMessage
                }
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-border/60 bg-canvas px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-bold text-ink">
              {hasChanges
                ? 'Tienes cambios sin guardar'
                : 'Todo está actualizado'}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {hasChanges
                ? 'Guarda los cambios para actualizar la ficha del restaurante.'
                : `${savedIds.length} servicios guardados actualmente.`}
            </p>
          </div>

          <Button
            type="button"
            onClick={
              handleSave
            }
            disabled={
              isSaving ||
              !hasChanges
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

                Guardar servicios
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}

function AmenityCard({
  amenity,
  selected,
  disabled,
  onToggle,
}: {
  amenity: Amenity;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const Icon =
    getAmenityIcon(
      amenity.icon
    );

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={
        onToggle
      }
      aria-pressed={
        selected
      }
      className={`group relative min-h-[150px] overflow-hidden rounded-card border p-5 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? 'border-primary/25 bg-primary/[0.055] shadow-none'
          : 'border-border/70 bg-canvas hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
            selected
              ? 'bg-action text-white'
              : 'bg-white text-action shadow-sm group-hover:bg-action group-hover:text-white'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
            selected
              ? 'border-primary bg-action text-white'
              : 'border-border bg-white text-transparent'
          }`}
        >
          <Check className="h-3.5 w-3.5" />
        </div>
      </div>

      <h3 className="mt-5 text-sm font-bold text-ink">
        {amenity.name}
      </h3>

      <p
        className={`mt-2 text-xs font-bold uppercase tracking-[0.08em] ${
          selected
            ? 'text-action'
            : 'text-muted-foreground'
        }`}
      >
        {selected
          ? 'Disponible'
          : 'No seleccionado'}
      </p>
    </button>
  );
}

function getAmenityIcon(
  icon: string | null
) {
  if (!icon) {
    return Sparkles;
  }

  return (
    iconMap[
      icon as keyof typeof iconMap
    ] ?? Sparkles
  );
}