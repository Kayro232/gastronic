'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Check,
  ChevronDown,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  Utensils,
  Wallet,
  X,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface Department {
  id: string;
  name: string;
}

interface Municipality {
  id: string;
  name: string;
  department:
    | Department
    | Department[]
    | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BudgetOption {
  label: string;
  min: number | null;
  max: number | null;
}

interface RestaurantFiltersProps {
  selectedCategoryId: string | null;
  selectedMunicipalityId: string | null;
  selectedMinPrice: number | null;
  selectedMaxPrice: number | null;

  onSelectCategory: (
    categoryId: string | null
  ) => void;

  onSelectMunicipality: (
    municipalityId: string | null
  ) => void;

  onSelectBudget: (
    minPrice: number | null,
    maxPrice: number | null
  ) => void;

  onClear: () => void;
}

type OpenFilter =
  | 'location'
  | 'category'
  | 'budget'
  | null;

const budgetOptions: BudgetOption[] = [
  {
    label: 'Todos los precios',
    min: null,
    max: null,
  },
  {
    label: 'Hasta C$200',
    min: 0,
    max: 200,
  },
  {
    label: 'C$200 - C$400',
    min: 200,
    max: 400,
  },
  {
    label: 'C$400 - C$700',
    min: 400,
    max: 700,
  },
  {
    label: 'C$700 - C$1,000',
    min: 700,
    max: 1000,
  },
  {
    label: 'C$1,000+',
    min: 1000,
    max: null,
  },
];

function getDepartment(
  department:
    | Department
    | Department[]
    | null
) {
  if (!department) {
    return null;
  }

  return Array.isArray(department)
    ? department[0] ?? null
    : department;
}

export function RestaurantFilters({
  selectedCategoryId,
  selectedMunicipalityId,
  selectedMinPrice,
  selectedMaxPrice,
  onSelectCategory,
  onSelectMunicipality,
  onSelectBudget,
  onClear,
}: RestaurantFiltersProps) {
  const [openFilter, setOpenFilter] =
    useState<OpenFilter>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [
    municipalities,
    setMunicipalities,
  ] = useState<Municipality[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const containerRef =
    useRef<HTMLDivElement>(null);

  /* ============================================= */
  /* LOAD DATA                                     */
  /* ============================================= */

  useEffect(() => {
    let mounted = true;

    async function loadFilters() {
      setIsLoading(true);

      const [
        categoriesResult,
        municipalitiesResult,
      ] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, slug')
          .eq('is_active', true)
          .order('name', {
            ascending: true,
          }),

        supabase
          .from('municipalities')
          .select(`
            id,
            name,

            department:departments (
              id,
              name
            )
          `)
          .order('name', {
            ascending: true,
          }),
      ]);

      if (!mounted) {
        return;
      }

      if (categoriesResult.error) {
        console.error(
          'Error cargando categorías:',
          categoriesResult.error
        );
      } else {
        setCategories(
          (categoriesResult.data ??
            []) as Category[]
        );
      }

      if (municipalitiesResult.error) {
        console.error(
          'Error cargando municipios:',
          municipalitiesResult.error
        );
      } else {
        setMunicipalities(
          (municipalitiesResult.data ??
            []) as unknown as Municipality[]
        );
      }

      setIsLoading(false);
    }

    loadFilters();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================= */
  /* CLOSE WHEN CLICKING OUTSIDE                   */
  /* ============================================= */

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpenFilter(null);
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  /* ============================================= */
  /* CURRENT VALUES                                */
  /* ============================================= */

  const selectedMunicipality =
    useMemo(
      () =>
        municipalities.find(
          (municipality) =>
            municipality.id ===
            selectedMunicipalityId
        ) ?? null,
      [
        municipalities,
        selectedMunicipalityId,
      ]
    );

  const selectedCategory =
    useMemo(
      () =>
        categories.find(
          (category) =>
            category.id ===
            selectedCategoryId
        ) ?? null,
      [categories, selectedCategoryId]
    );

  const selectedBudget =
    useMemo(
      () =>
        budgetOptions.find(
          (option) =>
            option.min ===
              selectedMinPrice &&
            option.max ===
              selectedMaxPrice
        ) ?? budgetOptions[0],
      [
        selectedMinPrice,
        selectedMaxPrice,
      ]
    );

  const hasActiveFilters =
    selectedCategoryId !== null ||
    selectedMunicipalityId !== null ||
    selectedMinPrice !== null ||
    selectedMaxPrice !== null;

  function toggleFilter(
    filter: Exclude<
      OpenFilter,
      null
    >
  ) {
    setOpenFilter((current) =>
      current === filter
        ? null
        : filter
    );
  }

  function handleClear() {
    onClear();
    setOpenFilter(null);
  }

  return (
    <div
      ref={containerRef}
      className="relative z-30"
    >
      {/* ========================================= */}
      {/* BAR                                       */}
      {/* ========================================= */}

      <div className="relative">
        {/* Fade mobile left */}
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-5 bg-gradient-to-r from-background to-transparent sm:hidden" />

        {/* Fade mobile right */}
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />

        <div className="scrollbar-hide overflow-x-auto px-1 py-2">
          <div className="flex w-max min-w-full items-center gap-2">
            {/* Filters icon */}
            <div className="mr-1 hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-ink text-white sm:flex">
              <SlidersHorizontal className="h-4 w-4" />
            </div>

            {/* Location */}
            <FilterTrigger
              icon={MapPin}
              label="Ubicación"
              value={
                selectedMunicipality?.name ??
                'Toda Nicaragua'
              }
              active={
                selectedMunicipalityId !==
                null
              }
              open={
                openFilter ===
                'location'
              }
              onClick={() =>
                toggleFilter(
                  'location'
                )
              }
            />

            {/* Category */}
            <FilterTrigger
              icon={Utensils}
              label="Categoría"
              value={
                selectedCategory?.name ??
                'Todas'
              }
              active={
                selectedCategoryId !==
                null
              }
              open={
                openFilter ===
                'category'
              }
              onClick={() =>
                toggleFilter(
                  'category'
                )
              }
            />

            {/* Budget */}
            <FilterTrigger
              icon={Wallet}
              label="Presupuesto"
              value={
                selectedBudget.label
              }
              active={
                selectedMinPrice !==
                  null ||
                selectedMaxPrice !==
                  null
              }
              open={
                openFilter ===
                'budget'
              }
              onClick={() =>
                toggleFilter(
                  'budget'
                )
              }
            />

            {/* Clear */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClear}
                className="ml-1 flex h-11 flex-shrink-0 items-center gap-2 rounded-2xl px-3 text-xs font-bold text-muted-foreground transition hover:bg-danger-soft hover:text-danger"
              >
                <X className="h-4 w-4" />

                <span>
                  Limpiar
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* POPOVER                                   */}
      {/* ========================================= */}

      {openFilter && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full max-w-[520px] overflow-hidden rounded-card border border-border/80 bg-white shadow-overlay">
          {/* LOCATION */}
          {openFilter ===
            'location' && (
            <LocationPanel
              municipalities={
                municipalities
              }
              selectedId={
                selectedMunicipalityId
              }
              isLoading={
                isLoading
              }
              onSelect={(id) => {
                onSelectMunicipality(
                  id
                );

                setOpenFilter(
                  null
                );
              }}
            />
          )}

          {/* CATEGORY */}
          {openFilter ===
            'category' && (
            <CategoryPanel
              categories={
                categories
              }
              selectedId={
                selectedCategoryId
              }
              isLoading={
                isLoading
              }
              onSelect={(id) => {
                onSelectCategory(id);

                setOpenFilter(
                  null
                );
              }}
            />
          )}

          {/* BUDGET */}
          {openFilter ===
            'budget' && (
            <BudgetPanel
              selectedMin={
                selectedMinPrice
              }
              selectedMax={
                selectedMaxPrice
              }
              onSelect={(
                min,
                max
              ) => {
                onSelectBudget(
                  min,
                  max
                );

                setOpenFilter(
                  null
                );
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ========================================================== */
/* FILTER TRIGGER                                             */
/* ========================================================== */

function FilterTrigger({
  icon: Icon,
  label,
  value,
  active,
  open,
  onClick,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  active: boolean;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-11 flex-shrink-0 items-center gap-2.5 rounded-2xl border px-3.5 text-left transition-all duration-200 ${
        active || open
          ? 'border-primary/30 bg-primary/[0.07] shadow-raised'
          : 'border-border/80 bg-white shadow-none hover:border-primary/20 hover:bg-[#FAFCFB]'
      }`}
    >
      <Icon
        className={`h-4 w-4 flex-shrink-0 ${
          active || open
            ? 'text-action'
            : 'text-muted-foreground'
        }`}
      />

      <div className="flex items-center gap-1.5">
        <span className="hidden text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground lg:inline">
          {label}
        </span>

        <span
          className={`max-w-[170px] truncate text-sm font-semibold ${
            active
              ? 'text-action'
              : 'text-ink'
          }`}
        >
          {value}
        </span>
      </div>

      <ChevronDown
        className={`h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform ${
          open
            ? 'rotate-180'
            : ''
        }`}
      />
    </button>
  );
}

/* ========================================================== */
/* LOCATION                                                   */
/* ========================================================== */

function LocationPanel({
  municipalities,
  selectedId,
  isLoading,
  onSelect,
}: {
  municipalities: Municipality[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (
    id: string | null
  ) => void;
}) {
  const [search, setSearch] =
    useState('');

  const filtered =
    municipalities.filter(
      (municipality) => {
        const department =
          getDepartment(
            municipality.department
          );

        const text = `${municipality.name} ${
          department?.name ?? ''
        }`.toLowerCase();

        return text.includes(
          search
            .trim()
            .toLowerCase()
        );
      }
    );

  return (
    <>
      <PanelHeader
        title="¿Dónde quieres comer?"
        description="Busca por municipio o departamento."
      />

      <div className="px-4 pb-3">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Buscar ubicación..."
            className="h-11 w-full rounded-xl border border-border bg-canvas pl-10 pr-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
          />
        </div>
      </div>

      <div className="max-h-[330px] overflow-y-auto px-2 pb-2">
        <SelectionRow
          label="Toda Nicaragua"
          description="Explorar todos los municipios"
          selected={
            selectedId === null
          }
          icon={MapPin}
          onClick={() =>
            onSelect(null)
          }
        />

        {isLoading ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Cargando ubicaciones...
          </p>
        ) : (
          filtered.map(
            (municipality) => {
              const department =
                getDepartment(
                  municipality.department
                );

              return (
                <SelectionRow
                  key={
                    municipality.id
                  }
                  label={
                    municipality.name
                  }
                  description={
                    department?.name ??
                    'Nicaragua'
                  }
                  selected={
                    selectedId ===
                    municipality.id
                  }
                  icon={
                    MapPin
                  }
                  onClick={() =>
                    onSelect(
                      municipality.id
                    )
                  }
                />
              );
            }
          )
        )}
      </div>
    </>
  );
}

/* ========================================================== */
/* CATEGORY                                                   */
/* ========================================================== */

function CategoryPanel({
  categories,
  selectedId,
  isLoading,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (
    id: string | null
  ) => void;
}) {
  return (
    <>
      <PanelHeader
        title="¿Qué se te antoja?"
        description="Elige el tipo de experiencia que buscas."
      />

      <div className="grid max-h-[360px] grid-cols-2 gap-2 overflow-y-auto p-4 pt-0 sm:grid-cols-3">
        <CategoryOption
          name="Todas"
          selected={
            selectedId === null
          }
          icon={Sparkles}
          onClick={() =>
            onSelect(null)
          }
        />

        {!isLoading &&
          categories.map(
            (category) => (
              <CategoryOption
                key={
                  category.id
                }
                name={
                  category.name
                }
                selected={
                  selectedId ===
                  category.id
                }
                icon={
                  Utensils
                }
                onClick={() =>
                  onSelect(
                    category.id
                  )
                }
              />
            )
          )}
      </div>
    </>
  );
}

function CategoryOption({
  name,
  selected,
  icon: Icon,
  onClick,
}: {
  name: string;
  selected: boolean;
  icon: React.ComponentType<{
    className?: string;
  }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-[82px] flex-col items-start justify-between rounded-2xl border p-3 text-left transition ${
        selected
          ? 'border-primary/30 bg-primary/[0.07]'
          : 'border-border/70 bg-white hover:border-primary/20 hover:bg-canvas'
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
          selected
            ? 'bg-action text-white'
            : 'bg-primary/[0.07] text-action'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <span className="mt-3 text-xs font-bold text-ink">
        {name}
      </span>

      {selected && (
        <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-action text-white">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
}

/* ========================================================== */
/* BUDGET                                                     */
/* ========================================================== */

function BudgetPanel({
  selectedMin,
  selectedMax,
  onSelect,
}: {
  selectedMin: number | null;
  selectedMax: number | null;

  onSelect: (
    min: number | null,
    max: number | null
  ) => void;
}) {
  return (
    <>
      <PanelHeader
        title="Elige tu presupuesto"
        description="Precio estimado por persona."
      />

      <div className="space-y-1 px-2 pb-2">
        {budgetOptions.map(
          (option) => {
            const selected =
              selectedMin ===
                option.min &&
              selectedMax ===
                option.max;

            return (
              <SelectionRow
                key={
                  option.label
                }
                label={
                  option.label
                }
                description={
                  option.min ===
                    null &&
                  option.max ===
                    null
                    ? 'Sin límite de presupuesto'
                    : 'Precio estimado por persona'
                }
                selected={
                  selected
                }
                icon={
                  Wallet
                }
                onClick={() =>
                  onSelect(
                    option.min,
                    option.max
                  )
                }
              />
            );
          }
        )}
      </div>
    </>
  );
}

/* ========================================================== */
/* SHARED                                                     */
/* ========================================================== */

function PanelHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-5">
      <h3 className="text-base font-bold tracking-tight text-ink">
        {title}
      </h3>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function SelectionRow({
  label,
  description,
  selected,
  icon: Icon,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;

  icon: React.ComponentType<{
    className?: string;
  }>;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
        selected
          ? 'bg-primary/[0.07]'
          : 'hover:bg-canvas'
      }`}
    >
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
          selected
            ? 'bg-action text-white'
            : 'bg-surface-2 text-muted-foreground'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold ${
            selected
              ? 'text-action'
              : 'text-ink'
          }`}
        >
          {label}
        </p>

        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {description}
        </p>
      </div>

      {selected && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-3.5 w-3.5 text-action" />
        </div>
      )}
    </button>
  );
}