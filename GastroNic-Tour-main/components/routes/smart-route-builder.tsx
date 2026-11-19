'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  BookmarkPlus,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';

import {
  AFTERNOON_ROUTE_TEMPLATE,
  SMART_ROUTE_CATEGORY_GROUPS,
  buildSmartRoutes,
  type SmartRoutePlan,
  type SmartRouteStopRequest,
} from '@/lib/routes/smart-route-planner';

import { Button } from '@/components/ui/button';

import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase = createClient();

/* ============================================================
 * TYPES
 * ========================================================== */

interface Municipality {
  id: number;
  name: string;
}

type RouteMode =
  | 'afternoon'
  | 'food'
  | 'night';

/* ============================================================
 * ROUTE TEMPLATES
 * ========================================================== */

const FOOD_ROUTE_TEMPLATE:
  SmartRouteStopRequest[] = [
    {
      id: 'main-meal',
      label: 'Comida',
      categoryId: null,
      allowedCategoryIds:
        SMART_ROUTE_CATEGORY_GROUPS.mainMeal,
      offsetMinutes: 0,
    },
    {
      id: 'dessert',
      label: 'Postre',
      categoryId: null,
      allowedCategoryIds:
        SMART_ROUTE_CATEGORY_GROUPS.sweet,
      offsetMinutes: 90,
    },
  ];

const NIGHT_ROUTE_TEMPLATE:
  SmartRouteStopRequest[] = [
    {
      id: 'dinner',
      label: 'Cena',
      categoryId: null,
      allowedCategoryIds:
        SMART_ROUTE_CATEGORY_GROUPS.mainMeal,
      offsetMinutes: 0,
    },
    {
      id: 'nightlife',
      label: 'Bar o lounge',
      categoryId: null,
      allowedCategoryIds:
        SMART_ROUTE_CATEGORY_GROUPS.nightlife,
      offsetMinutes: 120,
    },
  ];

/* ============================================================
 * HELPERS
 * ========================================================== */

function getTodayInNicaragua() {
  const parts =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone:
          'America/Managua',

        year:
          'numeric',

        month:
          '2-digit',

        day:
          '2-digit',
      },
    ).formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (part) =>
        part.type === 'year',
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === 'month',
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === 'day',
    )?.value;

  return `${year}-${month}-${day}`;
}


function formatMoney(
  amount: number | null,
) {
  if (amount === null) {
    return 'Por confirmar';
  }

  return new Intl.NumberFormat(
    'es-NI',
    {
      style: 'currency',
      currency: 'NIO',
      maximumFractionDigits: 0,
    },
  ).format(amount);
}


function formatTime(
  isoDate: string,
) {
  return new Intl.DateTimeFormat(
    'es-NI',
    {
      timeZone:
        'America/Managua',

      hour:
        'numeric',

      minute:
        '2-digit',

      hour12:
        true,
    },
  ).format(
    new Date(isoDate),
  );
}


function getBudgetText(
  plan: SmartRoutePlan,
) {
  if (
    plan.budgetStatus ===
    'within_budget'
  ) {
    return 'Dentro de tu presupuesto';
  }

  if (
    plan.budgetStatus ===
    'possible'
  ) {
    return 'Puede ajustarse al presupuesto';
  }

  if (
    plan.budgetStatus ===
    'unknown'
  ) {
    return 'Hay precios por confirmar';
  }

  if (
    plan.budgetStatus ===
    'over_budget'
  ) {
    return 'Supera el presupuesto estimado';
  }

  return 'Sin presupuesto definido';
}


function getRouteModeName(
  routeMode: RouteMode,
) {
  if (
    routeMode === 'night'
  ) {
    return 'Plan nocturno';
  }

  if (
    routeMode === 'food'
  ) {
    return 'Ruta gastronómica';
  }

  return 'Tarde gastronómica';
}

/* ============================================================
 * MAIN
 * ========================================================== */

export function SmartRouteBuilder() {

  const [
    municipalities,
    setMunicipalities,
  ] = useState<
    Municipality[]
  >([]);


  const [
    municipalityId,
    setMunicipalityId,
  ] = useState('');


  const [
    partySize,
    setPartySize,
  ] = useState(2);


  const [
    budget,
    setBudget,
  ] = useState('1500');


  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    getTodayInNicaragua(),
  );


  const [
    selectedTime,
    setSelectedTime,
  ] = useState(
    '15:00',
  );


  const [
    routeMode,
    setRouteMode,
  ] = useState<RouteMode>(
    'afternoon',
  );


  const [
    plans,
    setPlans,
  ] = useState<
    SmartRoutePlan[]
  >([]);


  const [
    isLoading,
    setIsLoading,
  ] = useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');


  const [
    saveMessage,
    setSaveMessage,
  ] = useState('');


  const [
    savingPlanIndex,
    setSavingPlanIndex,
  ] = useState<
    number | null
  >(null);


  const [
    savedRouteIds,
    setSavedRouteIds,
  ] = useState<
    Record<number, string>
  >({});


  /* ========================================================
   * LOAD MUNICIPALITIES
   * ====================================================== */

  useEffect(() => {

    async function loadMunicipalities() {

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'municipalities',
          )
          .select(
            'id, name',
          )
          .order(
            'name',
          );


      if (error) {
        console.error(
          'Error cargando municipios:',
          error,
        );

        return;
      }


      setMunicipalities(
        (
          data ??
          []
        ) as Municipality[],
      );
    }


    loadMunicipalities();

  }, []);


  /* ========================================================
   * GENERATE
   * ====================================================== */

  async function handleGenerateRoute() {

    setErrorMessage('');
    setSaveMessage('');
    setPlans([]);
    setSavedRouteIds({});


    if (!municipalityId) {

      setErrorMessage(
        'Seleccioná un municipio para crear tu ruta.',
      );

      return;
    }


    if (
      !selectedDate ||
      !selectedTime
    ) {

      setErrorMessage(
        'Seleccioná la fecha y hora de inicio.',
      );

      return;
    }


    const numericBudget =
      budget.trim() === ''
        ? null
        : Number(budget);


    if (
      numericBudget !== null &&
      (
        !Number.isFinite(
          numericBudget,
        ) ||
        numericBudget <= 0
      )
    ) {

      setErrorMessage(
        'Ingresá un presupuesto válido.',
      );

      return;
    }


    const startAt =
      `${selectedDate}T${selectedTime}:00-06:00`;


    let stops:
      SmartRouteStopRequest[];


    if (
      routeMode ===
      'food'
    ) {

      stops =
        FOOD_ROUTE_TEMPLATE;

    } else if (
      routeMode ===
      'night'
    ) {

      stops =
        NIGHT_ROUTE_TEMPLATE;

    } else {

      stops =
        AFTERNOON_ROUTE_TEMPLATE;

    }


    setIsLoading(true);


    try {

      const generatedPlans =
        await buildSmartRoutes({
          municipalityId:
            Number(
              municipalityId,
            ),

          partySize:
            Math.max(
              partySize,
              1,
            ),

          totalBudget:
            numericBudget,

          startAt,

          stops,
        });


      if (
        generatedPlans.length ===
        0
      ) {

        setErrorMessage(
          'No encontramos una combinación disponible para ese plan. Prueba otra hora, presupuesto o tipo de ruta.',
        );

        return;
      }


      setPlans(
        generatedPlans,
      );

    } catch (error) {

      console.error(
        'Error creando ruta inteligente:',
        error,
      );


      setErrorMessage(
        getUserFacingErrorMessage(error, 'No pudimos crear tu ruta.'),
      );

    } finally {

      setIsLoading(false);

    }
  }


  /* ========================================================
   * SAVE ROUTE
   * ====================================================== */

  async function handleSaveRoute(
    plan: SmartRoutePlan,
    index: number,
  ) {

    if (
      savingPlanIndex !== null
    ) {
      return;
    }


    if (
      savedRouteIds[index]
    ) {
      return;
    }


    setErrorMessage('');
    setSaveMessage('');
    setSavingPlanIndex(index);


    try {

      const {
        data: {
          user,
        },
      } =
        await supabase.auth
          .getUser();


      if (!user) {

        setErrorMessage(
          'Debes iniciar sesión para guardar una ruta.',
        );

        return;
      }


      const municipality =
        municipalities.find(
          (item) =>
            item.id ===
            Number(
              municipalityId,
            ),
        );


      const municipalityName =
        municipality?.name ??
        'Nicaragua';


      const routeName =
        `${getRouteModeName(
          routeMode,
        )} en ${municipalityName}`;


      const numericBudget =
        budget.trim() === ''
          ? null
          : Number(budget);


      const plannedStartAt =
        `${selectedDate}T${selectedTime}:00-06:00`;


      /*
       * Primero guardamos la cabecera.
       */
      const {
        data:
          savedRoute,

        error:
          routeError,
      } =
        await supabase
          .from(
            'user_generated_routes',
          )
          .insert({
            user_id:
              user.id,

            municipality_id:
              Number(
                municipalityId,
              ),

            name:
              routeName,

            route_mode:
              routeMode,

            party_size:
              Math.max(
                partySize,
                1,
              ),

            total_budget:
              numericBudget,

            planned_start_at:
              plannedStartAt,

            estimated_total_min:
              plan.estimatedTotalMin,

            estimated_total_max:
              plan.estimatedTotalMax,

            has_unknown_prices:
              plan.hasUnknownPrices,

            budget_status:
              plan.budgetStatus,

            status:
              'saved',

            missing_stops:
              plan.missingStops.map(
                (stop) => ({
                  id:
                    stop.id,

                  label:
                    stop.label,
                }),
              ),
          })
          .select(
            'id',
          )
          .single();


      if (
        routeError ||
        !savedRoute
      ) {

        throw (
          routeError ??
          new Error('No se pudo guardar la ruta.')
        );

      }


      /*
       * Después guardamos cada parada.
       */
      const stopRows =
        plan.stops.map(
          (
            stop,
            stopIndex,
          ) => ({
            generated_route_id:
              savedRoute.id,

            stop_order:
              stopIndex + 1,

            stop_key:
              stop.id,

            label:
              stop.label,

            planned_at:
              stop.plannedAt,

            restaurant_id:
              stop.restaurant
                .restaurantId,

            estimated_total_min:
              stop.restaurant
                .estimatedTotalMin,

            estimated_total_max:
              stop.restaurant
                .estimatedTotalMax,

            personalization_score:
              stop.restaurant
                .personalizationScore,

            reasons:
              stop.restaurant
                .reasons,
          }),
        );


      const {
        error:
          stopsError,
      } =
        await supabase
          .from(
            'user_generated_route_stops',
          )
          .insert(
            stopRows,
          );


      if (stopsError) {

        /*
         * Si fallan las paradas,
         * limpiamos la cabecera.
         */
        await supabase
          .from(
            'user_generated_routes',
          )
          .delete()
          .eq(
            'id',
            savedRoute.id,
          );


        throw stopsError;

      }


      setSavedRouteIds(
        (
          current,
        ) => ({
          ...current,

          [index]:
            savedRoute.id,
        }),
      );


      setSaveMessage(
        '✓ Ruta guardada. Ya aparecerá en tu inicio.',
      );

    } catch (error) {

      console.error(
        'Error guardando ruta:',
        error,
      );


      setErrorMessage(
        getUserFacingErrorMessage(error, 'No pudimos guardar esta ruta.'),
      );

    } finally {

      setSavingPlanIndex(
        null,
      );

    }
  }


  /* ========================================================
   * RENDER
   * ====================================================== */

  return (
    <div className="space-y-8">

      {/* HERO */}

      <section className="relative overflow-hidden rounded-sheet bg-ink px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">



        <div className="relative z-10 max-w-3xl">

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.08em] text-secondary backdrop-blur">

            <Sparkles className="h-4 w-4" />

            Ruta inteligente

          </div>


          <h1 className="mt-5 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">

            Creá una experiencia

            <span className="block text-action">
              hecha para ti.
            </span>

          </h1>


          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">

            Elige dónde quieres ir, cuánto quieres gastar y con quién vas.
            GastroNic combinará lugares reales según horarios,
            categorías, presupuesto y tus preferencias.

          </p>

        </div>

      </section>


      {/* FORM */}

      <section className="rounded-sheet border border-border/70 bg-white p-5 shadow-none sm:p-8">

        <div>

          <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
            Tu plan
          </p>


          <h2 className="mt-2 text-2xl font-bold text-ink">
            ¿Qué quieres hacer?
          </h2>


          <p className="mt-2 text-sm text-muted-foreground">

            Podés cambiar estos datos y GastroNic buscará una combinación diferente.

          </p>

        </div>


        {/* MODES */}

        <div className="mt-7 grid gap-3 sm:grid-cols-3">

          <ModeButton
            active={
              routeMode ===
              'afternoon'
            }
            title="Tarde gastronómica"
            description="Café + comida + postre"
            onClick={() =>
              setRouteMode(
                'afternoon',
              )
            }
          />


          <ModeButton
            active={
              routeMode ===
              'food'
            }
            title="Salir a comer"
            description="Comida + algo dulce"
            onClick={() =>
              setRouteMode(
                'food',
              )
            }
          />


          <ModeButton
            active={
              routeMode ===
              'night'
            }
            title="Plan nocturno"
            description="Cena + bar o lounge"
            onClick={() =>
              setRouteMode(
                'night',
              )
            }
          />

        </div>


        {/* INPUTS */}

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          <FieldCard
            icon={MapPin}
            label="Municipio"
          >

            <select
              value={
                municipalityId
              }
              onChange={(event) =>
                setMunicipalityId(
                  event.target.value,
                )
              }
              className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary"
            >

              <option value="">
                Seleccioná
              </option>


              {municipalities.map(
                (
                  municipality,
                ) => (

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

                  </option>

                ),
              )}

            </select>

          </FieldCard>


          <FieldCard
            icon={Users}
            label="Personas"
          >

            <input
              type="number"
              min={1}
              max={20}
              value={
                partySize
              }
              onChange={(event) =>
                setPartySize(
                  Number(
                    event.target.value,
                  ),
                )
              }
              className="mt-2 h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-primary"
            />

          </FieldCard>


          <FieldCard
            icon={Wallet}
            label="Presupuesto total"
          >

            <div className="relative mt-2">

              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                C$
              </span>


              <input
                type="number"
                min={1}
                value={
                  budget
                }
                onChange={(event) =>
                  setBudget(
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-xl border border-border pl-10 pr-3 text-sm outline-none focus:border-primary"
              />

            </div>

          </FieldCard>


          <FieldCard
            icon={CalendarDays}
            label="Fecha"
          >

            <input
              type="date"
              value={
                selectedDate
              }
              onChange={(event) =>
                setSelectedDate(
                  event.target.value,
                )
              }
              className="mt-2 h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-primary"
            />

          </FieldCard>


          <FieldCard
            icon={Clock3}
            label="Hora de inicio"
          >

            <input
              type="time"
              value={
                selectedTime
              }
              onChange={(event) =>
                setSelectedTime(
                  event.target.value,
                )
              }
              className="mt-2 h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-primary"
            />

          </FieldCard>

        </div>


        {errorMessage && (

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">

            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />

            <p>
              {errorMessage}
            </p>

          </div>

        )}


        {saveMessage && (

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm font-semibold text-success">

            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />

            <p>
              {saveMessage}
            </p>

          </div>

        )}


        <Button
          type="button"
          size="lg"
          disabled={
            isLoading
          }
          onClick={
            handleGenerateRoute
          }
          className="mt-7 h-12 w-full rounded-xl font-bold sm:w-auto sm:px-8"
        >

          {isLoading ? (

            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

              Creando tu ruta...
            </>

          ) : (

            <>
              <Sparkles className="mr-2 h-4 w-4" />

              Armar mi ruta
            </>

          )}

        </Button>

      </section>


      {/* RESULTS */}

      {plans.length > 0 && (

        <section>

          <div className="mb-6">

            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Resultado GastroNic
            </p>


            <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-ink">
              Encontramos estas rutas para ti
            </h2>

          </div>


          <div className="space-y-7">

            {plans.map(
              (
                plan,
                index,
              ) => (

                <RoutePlanCard
                  key={
                    index
                  }
                  plan={
                    plan
                  }
                  index={
                    index
                  }
                  isSaving={
                    savingPlanIndex ===
                    index
                  }
                  savedRouteId={
                    savedRouteIds[
                      index
                    ] ??
                    null
                  }
                  onSave={() =>
                    handleSaveRoute(
                      plan,
                      index,
                    )
                  }
                />

              ),
            )}

          </div>

        </section>

      )}

    </div>
  );
}

/* ============================================================
 * AUXILIARY
 * ========================================================== */

function ModeButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {

  return (

    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? 'border-primary bg-primary/[0.06] shadow-sm'
          : 'border-border bg-white hover:border-primary/30'
      }`}
    >

      <p className="font-bold text-ink">
        {title}
      </p>


      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>

    </button>

  );
}


function FieldCard({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  label: string;

  children:
    React.ReactNode;
}) {

  return (

    <div className="rounded-2xl bg-canvas p-4">

      <div className="flex items-center gap-2 text-xs font-bold text-ink">

        <Icon className="h-4 w-4 text-action" />

        {label}

      </div>


      {children}

    </div>

  );
}


function RoutePlanCard({
  plan,
  index,
  isSaving,
  savedRouteId,
  onSave,
}: {
  plan: SmartRoutePlan;
  index: number;
  isSaving: boolean;
  savedRouteId: string | null;
  onSave: () => void;
}) {

  return (

    <article className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">

      {/* HEADER */}

      <div className="flex flex-col gap-4 border-b border-border/60 bg-canvas p-5 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-2">

            {index === 0 && (

              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-ink">
                Ruta recomendada
              </span>

            )}


            <span className="text-xs font-semibold text-muted-foreground">

              {
                plan.stops.length
              }{' '}

              paradas

            </span>

          </div>


          <h3 className="mt-2 text-xl font-bold text-ink">
            Ruta sugerida #{index + 1}
          </h3>

        </div>


        <div className="text-left sm:text-right">

          <p className="text-xs font-semibold text-muted-foreground">

            {plan.hasUnknownPrices
              ? 'Estimación parcial'
              : 'Presupuesto estimado'}

          </p>


          <p className="mt-1 font-bold text-ink">

            {plan.estimatedTotalMin !== null
              ? formatMoney(
                  plan.estimatedTotalMin,
                )
              : 'Por confirmar'}


            {plan.estimatedTotalMax !== null &&
              plan.estimatedTotalMax !==
                plan.estimatedTotalMin && (

                <>
                  {' – '}

                  {formatMoney(
                    plan.estimatedTotalMax,
                  )}
                </>

              )}

          </p>


          {plan.hasUnknownPrices && (

            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              + precios por confirmar
            </p>

          )}


          <p className="mt-1 text-xs font-semibold text-action">

            {getBudgetText(
              plan,
            )}

          </p>

        </div>

      </div>


      {/* STOPS */}

      <div className="p-5 sm:p-7">

        <div className="space-y-4">

          {plan.stops.map(
            (
              stop,
              stopIndex,
            ) => (

              <div
                key={`${stop.id}-${stop.restaurant.restaurantId}`}
                className="relative flex gap-4"
              >

                {stopIndex <
                  plan.stops.length -
                    1 && (

                  <div className="absolute left-[19px] top-10 h-[calc(100%+0.5rem)] w-px bg-border" />

                )}


                <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-action font-bold text-white">

                  {stopIndex + 1}

                </div>


                <div className="flex-1 rounded-2xl border border-border/70 p-4">

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">

                        {formatTime(
                          stop.plannedAt,
                        )}{' '}

                        · {stop.label}

                      </p>


                      <h4 className="mt-1 text-lg font-bold text-ink">

                        {
                          stop.restaurant.name
                        }

                      </h4>


                      <p className="mt-1 text-xs text-muted-foreground">

                        {
                          stop.restaurant
                            .categoryNames
                            .join(
                              ' · ',
                            )
                        }

                      </p>

                    </div>


                    <Link
                      href={`/restaurant/${stop.restaurant.restaurantId}`}
                      className="text-xs font-bold text-action hover:underline"
                    >

                      Ver restaurante

                    </Link>

                  </div>


                  <div className="mt-4 flex flex-wrap gap-2">

                    {stop.restaurant.averageRating !==
                      null && (

                      <span className="rounded-lg bg-secondary/15 px-2.5 py-1.5 text-xs font-semibold text-[#735A16]">

                        ★{' '}

                        {
                          stop.restaurant
                            .averageRating
                        }

                      </span>

                    )}


                    <span className="rounded-lg bg-primary/[0.07] px-2.5 py-1.5 text-xs font-semibold text-action">

                      {stop.restaurant
                        .estimatedTotalMin !==
                      null
                        ? `Desde ${formatMoney(
                            stop.restaurant
                              .estimatedTotalMin,
                          )}`
                        : 'Precio por confirmar'}

                    </span>

                  </div>


                  {stop.restaurant.reasons.length >
                    0 && (

                    <div className="mt-3 flex flex-wrap gap-2">

                      {stop.restaurant.reasons
                        .slice(
                          0,
                          3,
                        )
                        .map(
                          (
                            reason,
                          ) => (

                            <span
                              key={
                                reason
                              }
                              className="flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-muted-foreground"
                            >

                              <CheckCircle2 className="h-3 w-3 text-action" />

                              {
                                reason
                              }

                            </span>

                          ),
                        )}

                    </div>

                  )}

                </div>

              </div>

            ),
          )}

        </div>


        {/* MISSING */}

        {plan.missingStops.length >
          0 && (

          <div className="mt-6 rounded-2xl border border-warning/25 bg-warning-soft p-4">

            <div className="flex gap-3">

              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />


              <div>

                <p className="font-bold text-amber-900">
                  Ruta adaptada
                </p>


                <p className="mt-1 text-sm leading-6 text-warning">

                  No encontramos una opción disponible para:{' '}

                  {plan.missingStops
                    .map(
                      (stop) =>
                        stop.label,
                    )
                    .join(', ')}

                  . Te mostramos la mejor combinación con los lugares disponibles.

                </p>

              </div>

            </div>

          </div>

        )}


        {/* SAVE */}

        <div className="mt-7 flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-sm font-bold text-ink">
              ¿Te gustó esta ruta?
            </p>


            <p className="mt-1 text-xs text-muted-foreground">
              Guardala para verla nuevamente desde tu inicio.
            </p>

          </div>


          {savedRouteId ? (

            <Button
              type="button"
              variant="outline"
              disabled
              className="h-11 rounded-xl border-success/25 bg-success-soft font-bold text-success"
            >

              <CheckCircle2 className="mr-2 h-4 w-4" />

              Ruta guardada

            </Button>

          ) : (

            <Button
              type="button"
              onClick={
                onSave
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
                  <BookmarkPlus className="mr-2 h-4 w-4" />

                  Guardar ruta
                </>

              )}

            </Button>

          )}

        </div>

      </div>

    </article>

  );
}