'use client';

import type {
  ComponentType,
  ReactNode,
} from 'react';

import {
  BadgeCheck,
  Check,
  ChevronDown,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react';

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

export interface ExploreFilterOption {
  value: string;
  label: string;
}

export type ExploreSort =
  | 'recommended'
  | 'rating'
  | 'visits'
  | 'recent';

export interface ExploreFiltersState {
  department: string;
  municipality: string;
  category: string;

  priceLevel: number | null;
  minRating: number | null;

  verifiedOnly: boolean;
  featuredOnly: boolean;

  sort: ExploreSort;
}

interface ExploreFiltersProps {
  open: boolean;

  filters: ExploreFiltersState;

  departments: ExploreFilterOption[];
  municipalities: ExploreFilterOption[];
  categories: ExploreFilterOption[];

  activeFiltersCount: number;

  onChange: (
    filters: ExploreFiltersState
  ) => void;

  onClose: () => void;
  onClear: () => void;
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function ExploreFilters({
  open,
  filters,
  departments,
  municipalities,
  categories,
  activeFiltersCount,
  onChange,
  onClose,
  onClear,
}: ExploreFiltersProps) {
  if (!open) {
    return null;
  }

  function update<
    K extends keyof ExploreFiltersState
  >(
    key: K,
    value: ExploreFiltersState[K]
  ) {
    onChange({
      ...filters,
      [key]: value,
    });
  }

  return (
    <>
      {/* ====================================================== */}
      {/* MOBILE OVERLAY                                         */}
      {/* ====================================================== */}

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar filtros"
        className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] lg:hidden"
      />

      {/* ====================================================== */}
      {/* FILTER PANEL                                           */}
      {/* ====================================================== */}

      <div
        className="
          fixed inset-x-0 bottom-0 z-50
          max-h-[90vh]
          overflow-y-auto
          rounded-t-[2rem]
          border border-border/70
          bg-canvas
          shadow-overlay

          [scrollbar-width:none]
          [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden

          lg:static
          lg:z-auto
          lg:max-h-none
          lg:overflow-visible
          lg:rounded-none
          lg:border-0
          lg:bg-transparent
          lg:shadow-none
        "
      >
        {/* ==================================================== */}
        {/* HEADER                                               */}
        {/* ==================================================== */}

        <div
          className="
            sticky top-0 z-10
            flex items-center justify-between
            gap-4
            border-b border-border/60
            bg-canvas/95
            px-5 py-4
            backdrop-blur-xl

            lg:static
            lg:border-0
            lg:bg-transparent
            lg:px-0
            lg:pb-5
            lg:pt-0
            lg:backdrop-blur-none
          "
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.08] text-action">
              <SlidersHorizontal className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-bold text-ink">
                Filtros
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {activeFiltersCount > 0
                  ? `${activeFiltersCount} ${
                      activeFiltersCount === 1
                        ? 'filtro activo'
                        : 'filtros activos'
                    }`
                  : 'Refina tus resultados'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-white hover:text-ink lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ==================================================== */}
        {/* FILTER CONTENT                                       */}
        {/* ==================================================== */}

        <div className="space-y-6 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 lg:px-0 lg:pb-0 lg:pt-0">
          {/* ================================================== */}
          {/* LOCATION                                           */}
          {/* ================================================== */}

          <FilterSection
            icon={MapPin}
            title="Ubicación"
          >
            <FilterSelect
              label="Departamento"
              value={filters.department}
              options={departments}
              placeholder="Todo Nicaragua"
              onChange={(value) => {
                onChange({
                  ...filters,
                  department: value,
                  municipality: '',
                });
              }}
            />

            <FilterSelect
              label="Municipio"
              value={filters.municipality}
              options={municipalities}
              placeholder={
                filters.department
                  ? 'Todos los municipios'
                  : 'Selecciona un departamento'
              }
              disabled={!filters.department}
              onChange={(value) =>
                update(
                  'municipality',
                  value
                )
              }
            />
          </FilterSection>

          {/* ================================================== */}
          {/* CATEGORY                                           */}
          {/* ================================================== */}

          <FilterSection title="Tipo de cocina">
            <FilterSelect
              label="Categoría"
              value={filters.category}
              options={categories}
              placeholder="Todas las categorías"
              onChange={(value) =>
                update(
                  'category',
                  value
                )
              }
            />
          </FilterSection>

          {/* ================================================== */}
          {/* PRICE                                              */}
          {/* ================================================== */}

          <FilterSection title="Nivel de precio">
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(
                (level) => {
                  const active =
                    filters.priceLevel ===
                    level;

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        update(
                          'priceLevel',
                          active
                            ? null
                            : level
                        )
                      }
                      className={`h-10 rounded-xl border text-xs font-bold transition ${
                        active
                          ? 'border-primary bg-action text-white'
                          : 'border-border/70 bg-white text-ink hover:border-primary/20'
                      }`}
                    >
                      {'$'.repeat(
                        level
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </FilterSection>

          {/* ================================================== */}
          {/* RATING                                             */}
          {/* ================================================== */}

          <FilterSection title="Calificación mínima">
            <div className="grid grid-cols-3 gap-2">
              {[
                3,
                4,
                4.5,
              ].map(
                (value) => {
                  const active =
                    filters.minRating ===
                    value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        update(
                          'minRating',
                          active
                            ? null
                            : value
                        )
                      }
                      className={`flex h-10 items-center justify-center gap-1 rounded-xl border text-xs font-bold transition ${
                        active
                          ? 'border-primary bg-action text-white'
                          : 'border-border/70 bg-white text-ink hover:border-primary/20'
                      }`}
                    >
                      <Star
                        className={`h-3 w-3 ${
                          active
                            ? 'fill-white text-white'
                            : 'fill-secondary text-secondary'
                        }`}
                      />

                      {value}+
                    </button>
                  );
                }
              )}
            </div>
          </FilterSection>

          {/* ================================================== */}
          {/* PREFERENCES                                        */}
          {/* ================================================== */}

          <FilterSection title="Preferencias">
            <div className="space-y-2">
              <FilterToggle
                icon={BadgeCheck}
                title="Solo verificados"
                description="Establecimientos validados por GastroNic"
                active={
                  filters.verifiedOnly
                }
                onClick={() =>
                  update(
                    'verifiedOnly',
                    !filters.verifiedOnly
                  )
                }
              />

              <FilterToggle
                icon={Sparkles}
                title="Solo destacados"
                description="Selección destacada en GastroNic"
                active={
                  filters.featuredOnly
                }
                onClick={() =>
                  update(
                    'featuredOnly',
                    !filters.featuredOnly
                  )
                }
              />
            </div>
          </FilterSection>

          {/* ================================================== */}
          {/* SORT                                               */}
          {/* ================================================== */}

          <FilterSection title="Ordenar por">
            <FilterSelect
              label="Orden"
              value={filters.sort}
              options={[
                {
                  value: 'recommended',
                  label: 'Recomendados',
                },
                {
                  value: 'rating',
                  label: 'Mejor valorados',
                },
                {
                  value: 'visits',
                  label: 'Más visitados',
                },
                {
                  value: 'recent',
                  label: 'Más recientes',
                },
              ]}
              placeholder="Recomendados"
              onChange={(value) =>
                update(
                  'sort',
                  value as ExploreSort
                )
              }
            />
          </FilterSection>

          {/* ================================================== */}
          {/* RESET                                              */}
          {/* ================================================== */}

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-white text-xs font-bold text-muted-foreground transition hover:border-danger/25 hover:bg-danger-soft hover:text-danger"
            >
              <RotateCcw className="h-3.5 w-3.5" />

              Limpiar filtros
            </button>
          )}

          {/* MOBILE APPLY */}

          <button
            type="button"
            onClick={onClose}
            className="sticky bottom-0 h-12 w-full rounded-xl bg-action text-xs font-bold text-white shadow-overlay transition hover:bg-action-hover lg:hidden"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </>
  );
}

/* ========================================================== */
/* FILTER SECTION                                             */
/* ========================================================== */

function FilterSection({
  icon: Icon,
  title,
  children,
}: {
  icon?: ComponentType<{
    className?: string;
  }>;

  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        {Icon && (
          <Icon className="h-3.5 w-3.5 text-action" />
        )}

        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </p>
      </div>

      <div className="space-y-3">
        {children}
      </div>
    </section>
  );
}

/* ========================================================== */
/* SELECT                                                     */
/* ========================================================== */

function FilterSelect({
  label,
  value,
  options,
  placeholder,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;

  options:
    ExploreFilterOption[];

  placeholder: string;

  disabled?: boolean;

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="
            h-11 w-full
            appearance-none
            rounded-xl
            border border-border/70
            bg-white
            px-3 pr-9
            text-xs font-semibold
            text-ink
            outline-none
            transition

            focus:border-primary/35
            focus:ring-4
            focus:ring-primary/[0.05]

            disabled:cursor-not-allowed
            disabled:bg-[#EEF1F0]
            disabled:text-muted-foreground
          "
        >
          <option value="">
            {placeholder}
          </option>

          {options.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {
                  option.label
                }
              </option>
            )
          )}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </label>
  );
}

/* ========================================================== */
/* TOGGLE                                                     */
/* ========================================================== */

function FilterToggle({
  icon: Icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: ComponentType<{
    className?: string;
  }>;

  title: string;
  description: string;
  active: boolean;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        active
          ? 'border-primary/20 bg-primary/[0.06]'
          : 'border-border/70 bg-white hover:border-primary/15'
      }`}
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
          active
            ? 'bg-action text-white'
            : 'bg-surface-2 text-muted-foreground'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-ink">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
          {description}
        </p>
      </div>

      <div
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
          active
            ? 'border-primary bg-action text-white'
            : 'border-border'
        }`}
      >
        {active && (
          <Check className="h-3 w-3" />
        )}
      </div>
    </button>
  );
}