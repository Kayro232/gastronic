'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Facebook,
  Globe2,
  Instagram,
  LoaderCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Tags,
  UtensilsCrossed,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase = createClient();

interface Department {
  id: number;
  name: string;
}

interface Municipality {
  id: number;
  department_id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

type Step =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6;

const steps = [
  {
    id: 1,
    title: 'Información',
    short: 'Información',
    icon: Building2,
  },
  {
    id: 2,
    title: 'Ubicación',
    short: 'Ubicación',
    icon: MapPin,
  },
  {
    id: 3,
    title: 'Categorías',
    short: 'Categorías',
    icon: Tags,
  },
  {
    id: 4,
    title: 'Contacto',
    short: 'Contacto',
    icon: Phone,
  },
  {
    id: 5,
    title: 'Servicio',
    short: 'Servicio',
    icon: CircleDollarSign,
  },
  {
    id: 6,
    title: 'Revisión',
    short: 'Enviar',
    icon: Send,
  },
] as const;

const inputClass =
  'h-[52px] w-full rounded-2xl border border-border/80 bg-canvas px-4 text-sm text-ink outline-none transition placeholder:text-muted-foreground/60 hover:border-primary/20 hover:bg-white focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06] disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60';

const iconInputClass =
  'h-[52px] w-full rounded-2xl border border-border/80 bg-canvas pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-muted-foreground/60 hover:border-primary/20 hover:bg-white focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06] disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60';

export function RestaurantRequestForm() {
  const router = useRouter();

  const [currentStep, setCurrentStep] =
    useState<Step>(1);

  const [
    departments,
    setDepartments,
  ] = useState<Department[]>([]);

  const [
    municipalities,
    setMunicipalities,
  ] = useState<Municipality[]>([]);

  const [
    categories,
    setCategories,
  ] = useState<Category[]>([]);

  const [name, setName] =
    useState('');

  const [
    shortDescription,
    setShortDescription,
  ] = useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    departmentId,
    setDepartmentId,
  ] = useState('');

  const [
    municipalityId,
    setMunicipalityId,
  ] = useState('');

  const [address, setAddress] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [
    whatsapp,
    setWhatsapp,
  ] = useState('');

  const [email, setEmail] =
    useState('');

  const [
    websiteUrl,
    setWebsiteUrl,
  ] = useState('');

  const [
    facebookUrl,
    setFacebookUrl,
  ] = useState('');

  const [
    instagramUrl,
    setInstagramUrl,
  ] = useState('');

  const [
    priceLevel,
    setPriceLevel,
  ] = useState('2');

  const [
    estimatedPriceMin,
    setEstimatedPriceMin,
  ] = useState('');

  const [
    estimatedPriceMax,
    setEstimatedPriceMax,
  ] = useState('');

  const [
    selectedCategoryIds,
    setSelectedCategoryIds,
  ] = useState<number[]>([]);

  const [
    acceptsReservations,
    setAcceptsReservations,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isLoadingOptions,
    setIsLoadingOptions,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  /* ======================================================== */
  /* LOAD OPTIONS                                             */
  /* ======================================================== */

  useEffect(() => {
    async function loadOptions() {
      setIsLoadingOptions(true);

      const [
        departmentsResult,
        municipalitiesResult,
        categoriesResult,
      ] = await Promise.all([
        supabase
          .from('departments')
          .select('id, name')
          .order('name'),

        supabase
          .from('municipalities')
          .select(
            'id, department_id, name'
          )
          .order('name'),

        supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name'),
      ]);

      if (
        departmentsResult.error
      ) {
        console.error(
          'Error cargando departamentos:',
          departmentsResult.error
        );
      }

      if (
        municipalitiesResult.error
      ) {
        console.error(
          'Error cargando municipios:',
          municipalitiesResult.error
        );
      }

      if (
        categoriesResult.error
      ) {
        console.error(
          'Error cargando categorías:',
          categoriesResult.error
        );
      }

      setDepartments(
        (departmentsResult.data ??
          []) as Department[]
      );

      setMunicipalities(
        (municipalitiesResult.data ??
          []) as Municipality[]
      );

      setCategories(
        (categoriesResult.data ??
          []) as Category[]
      );

      setIsLoadingOptions(false);
    }

    loadOptions();
  }, []);

  const filteredMunicipalities =
    useMemo(() => {
      if (!departmentId) {
        return [];
      }

      return municipalities.filter(
        (municipality) =>
          municipality.department_id ===
          Number(departmentId)
      );
    }, [
      departmentId,
      municipalities,
    ]);

  const selectedDepartment =
    departments.find(
      (department) =>
        department.id ===
        Number(departmentId)
    );

  const selectedMunicipality =
    municipalities.find(
      (municipality) =>
        municipality.id ===
        Number(municipalityId)
    );

  const selectedCategories =
    categories.filter((category) =>
      selectedCategoryIds.includes(
        category.id
      )
    );

  function toggleCategory(
    categoryId: number
  ) {
    setSelectedCategoryIds(
      (current) => {
        if (
          current.includes(
            categoryId
          )
        ) {
          return current.filter(
            (id) =>
              id !== categoryId
          );
        }

        return [
          ...current,
          categoryId,
        ];
      }
    );
  }

  /* ======================================================== */
  /* STEP VALIDATION                                          */
  /* ======================================================== */

  function validateCurrentStep() {
    setErrorMessage('');

    if (currentStep === 1) {
      if (!name.trim()) {
        setErrorMessage(
          'Debes indicar el nombre del restaurante.'
        );

        return false;
      }

      if (
        name.trim().length < 2
      ) {
        setErrorMessage(
          'El nombre del restaurante es demasiado corto.'
        );

        return false;
      }
    }

    if (currentStep === 2) {
      if (!departmentId) {
        setErrorMessage(
          'Selecciona el departamento del restaurante.'
        );

        return false;
      }

      if (!municipalityId) {
        setErrorMessage(
          'Selecciona el municipio donde se encuentra el restaurante.'
        );

        return false;
      }

      if (!address.trim()) {
        setErrorMessage(
          'Debes indicar la dirección del restaurante.'
        );

        return false;
      }
    }

    if (currentStep === 3) {
      if (
        selectedCategoryIds.length ===
        0
      ) {
        setErrorMessage(
          'Selecciona al menos una categoría.'
        );

        return false;
      }
    }

    if (currentStep === 5) {
      const minPrice =
        estimatedPriceMin
          ? Number(
              estimatedPriceMin
            )
          : null;

      const maxPrice =
        estimatedPriceMax
          ? Number(
              estimatedPriceMax
            )
          : null;

      if (
        minPrice !== null &&
        maxPrice !== null &&
        minPrice > maxPrice
      ) {
        setErrorMessage(
          'El precio mínimo no puede ser mayor que el precio máximo.'
        );

        return false;
      }
    }

    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < 6) {
      setCurrentStep(
        (currentStep + 1) as Step
      );

      setErrorMessage('');

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(
        (currentStep - 1) as Step
      );

      setErrorMessage('');

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  /* ======================================================== */
  /* SUBMIT                                                   */
  /* ======================================================== */

  async function handleSubmit() {
    /*
     * La creación NO depende del submit nativo del formulario.
     * Esta función solo se llama desde el clic explícito en
     * "Enviar solicitud" del paso 6.
     */
    if (
      currentStep !== 6 ||
      isLoading
    ) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    const cleanName =
      name.trim();

    const cleanShortDescription =
      shortDescription.trim();

    const cleanDescription =
      description.trim();

    const cleanAddress =
      address.trim();

    /* ====================================================== */
    /* VALIDACIÓN FINAL DE UX                                 */
    /* ====================================================== */

    if (!cleanName) {
      setErrorMessage(
        'Debes indicar el nombre del restaurante.'
      );

      return;
    }

    if (
      cleanName.length < 2 ||
      cleanName.length > 150
    ) {
      setErrorMessage(
        'El nombre del restaurante debe tener entre 2 y 150 caracteres.'
      );

      return;
    }

    if (
      cleanShortDescription.length >
      220
    ) {
      setErrorMessage(
        'La descripción corta no puede superar 220 caracteres.'
      );

      return;
    }

    if (!departmentId) {
      setErrorMessage(
        'Selecciona el departamento del restaurante.'
      );

      return;
    }

    if (!municipalityId) {
      setErrorMessage(
        'Selecciona el municipio del restaurante.'
      );

      return;
    }

    if (!cleanAddress) {
      setErrorMessage(
        'Debes indicar la dirección del restaurante.'
      );

      return;
    }

    if (
      selectedCategoryIds.length ===
      0
    ) {
      setErrorMessage(
        'Selecciona al menos una categoría.'
      );

      return;
    }

    const minPrice =
      estimatedPriceMin
        ? Number(
            estimatedPriceMin
          )
        : null;

    const maxPrice =
      estimatedPriceMax
        ? Number(
            estimatedPriceMax
          )
        : null;

    if (
      minPrice !== null &&
      !Number.isFinite(
        minPrice
      )
    ) {
      setErrorMessage(
        'El precio mínimo no es válido.'
      );

      return;
    }

    if (
      maxPrice !== null &&
      !Number.isFinite(
        maxPrice
      )
    ) {
      setErrorMessage(
        'El precio máximo no es válido.'
      );

      return;
    }

    if (
      minPrice !== null &&
      minPrice < 0
    ) {
      setErrorMessage(
        'El precio mínimo no puede ser negativo.'
      );

      return;
    }

    if (
      maxPrice !== null &&
      maxPrice < 0
    ) {
      setErrorMessage(
        'El precio máximo no puede ser negativo.'
      );

      return;
    }

    if (
      minPrice !== null &&
      maxPrice !== null &&
      minPrice > maxPrice
    ) {
      setErrorMessage(
        'El precio mínimo no puede ser mayor que el precio máximo.'
      );

      return;
    }

    const numericPriceLevel =
      Number(priceLevel);

    if (
      !Number.isInteger(
        numericPriceLevel
      ) ||
      numericPriceLevel < 1 ||
      numericPriceLevel > 4
    ) {
      setErrorMessage(
        'El nivel de precio no es válido.'
      );

      return;
    }

    setIsLoading(true);

    try {
      /*
       * Una sola llamada transaccional.
       *
       * PostgreSQL se encarga de:
       * - validar auth.uid()
       * - validar municipio
       * - validar categorías
       * - generar el slug
       * - fijar created_by
       * - fijar status = pending
       * - fijar is_verified = false
       * - fijar is_featured = false
       * - crear el restaurante
       * - crear sus categorías
       *
       * Si cualquier paso falla, se revierte todo.
       */
      const {
        data:
          restaurantId,
        error:
          requestError,
      } =
        await supabase.rpc(
          'create_restaurant_request',
          {
            p_payload: {
              name:
                cleanName,

              short_description:
                cleanShortDescription ||
                null,

              description:
                cleanDescription ||
                null,

              municipality_id:
                Number(
                  municipalityId
                ),

              address:
                cleanAddress,

              phone:
                phone.trim() ||
                null,

              whatsapp:
                whatsapp.trim() ||
                null,

              email:
                email
                  .trim()
                  .toLowerCase() ||
                null,

              website_url:
                websiteUrl.trim() ||
                null,

              facebook_url:
                facebookUrl.trim() ||
                null,

              instagram_url:
                instagramUrl.trim() ||
                null,

              price_level:
                numericPriceLevel,

              estimated_price_min:
                minPrice,

              estimated_price_max:
                maxPrice,

              accepts_reservations:
                acceptsReservations,

              category_ids:
                selectedCategoryIds,
            },
          }
        );

      if (
        requestError ||
        !restaurantId
      ) {
        console.error(
          'Error enviando solicitud de restaurante:',
          requestError
        );

        setErrorMessage(
          getUserFacingErrorMessage(requestError, 'No se pudo enviar la solicitud.')
        );

        return;
      }

      setSuccessMessage(
        'Solicitud enviada correctamente. Nuestro equipo revisará la información antes de publicar el restaurante.'
      );

      setTimeout(
        () => {
          router.replace(
            '/owner/dashboard'
          );

          router.refresh();
        },
        1200
      );
    } catch (error) {
      console.error(
        'Error inesperado registrando restaurante:',
        error
      );

      setErrorMessage(
        'Ocurrió un error inesperado. Inténtalo nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingOptions) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-action" />

          <p className="mt-3 text-sm text-muted-foreground">
            Preparando formulario...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        // Bloquea cualquier submit implícito del navegador.
        event.preventDefault();
      }}
      className="space-y-6"
    >
      {/* ====================================================== */}
      {/* PROGRESS                                               */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="border-b border-border/60 px-5 py-5 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Registro de restaurante
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Paso {currentStep} de 6
              </p>
            </div>

            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-action">
              {Math.round(
                (currentStep / 6) *
                  100
              )}
              %
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-action transition-all duration-500"
              style={{
                width: `${
                  (currentStep / 6) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        <div className="scrollbar-hide overflow-x-auto px-4 py-4 sm:px-6">
          <div className="flex min-w-max items-center gap-2">
            {steps.map(
              (step) => {
                const Icon =
                  step.icon;

                const active =
                  currentStep ===
                  step.id;

                const completed =
                  currentStep >
                  step.id;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (
                        step.id <
                        currentStep
                      ) {
                        setCurrentStep(
                          step.id as Step
                        );
                      }
                    }}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? 'bg-ink text-white'
                        : completed
                          ? 'bg-primary/10 text-action'
                          : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        active
                          ? 'bg-white/10'
                          : completed
                            ? 'bg-action text-white'
                            : 'bg-muted'
                      }`}
                    >
                      {completed ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </div>

                    <span>
                      {
                        step.short
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* STEP CONTENT                                           */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="border-b border-border/60 bg-canvas px-6 py-5 sm:px-8">
          <StepHeader
            step={
              steps[
                currentStep - 1
              ]
            }
          />
        </div>

        <div className="p-6 sm:p-8">
          {currentStep === 1 && (
            <StepOne
              name={name}
              setName={setName}
              shortDescription={
                shortDescription
              }
              setShortDescription={
                setShortDescription
              }
              description={
                description
              }
              setDescription={
                setDescription
              }
            />
          )}

          {currentStep === 2 && (
            <StepTwo
              departments={
                departments
              }
              filteredMunicipalities={
                filteredMunicipalities
              }
              departmentId={
                departmentId
              }
              setDepartmentId={
                setDepartmentId
              }
              municipalityId={
                municipalityId
              }
              setMunicipalityId={
                setMunicipalityId
              }
              address={
                address
              }
              setAddress={
                setAddress
              }
            />
          )}

          {currentStep === 3 && (
            <StepThree
              categories={
                categories
              }
              selectedCategoryIds={
                selectedCategoryIds
              }
              toggleCategory={
                toggleCategory
              }
            />
          )}

          {currentStep === 4 && (
            <StepFour
              phone={phone}
              setPhone={setPhone}
              whatsapp={
                whatsapp
              }
              setWhatsapp={
                setWhatsapp
              }
              email={email}
              setEmail={setEmail}
              websiteUrl={
                websiteUrl
              }
              setWebsiteUrl={
                setWebsiteUrl
              }
              facebookUrl={
                facebookUrl
              }
              setFacebookUrl={
                setFacebookUrl
              }
              instagramUrl={
                instagramUrl
              }
              setInstagramUrl={
                setInstagramUrl
              }
            />
          )}

          {currentStep === 5 && (
            <StepFive
              priceLevel={
                priceLevel
              }
              setPriceLevel={
                setPriceLevel
              }
              estimatedPriceMin={
                estimatedPriceMin
              }
              setEstimatedPriceMin={
                setEstimatedPriceMin
              }
              estimatedPriceMax={
                estimatedPriceMax
              }
              setEstimatedPriceMax={
                setEstimatedPriceMax
              }
              acceptsReservations={
                acceptsReservations
              }
              setAcceptsReservations={
                setAcceptsReservations
              }
            />
          )}

          {currentStep === 6 && (
            <ReviewStep
              name={name}
              shortDescription={
                shortDescription
              }
              selectedDepartment={
                selectedDepartment?.name ??
                ''
              }
              selectedMunicipality={
                selectedMunicipality?.name ??
                ''
              }
              address={
                address
              }
              selectedCategories={
                selectedCategories
              }
              phone={phone}
              whatsapp={
                whatsapp
              }
              email={email}
              websiteUrl={
                websiteUrl
              }
              priceLevel={
                priceLevel
              }
              estimatedPriceMin={
                estimatedPriceMin
              }
              estimatedPriceMax={
                estimatedPriceMax
              }
              acceptsReservations={
                acceptsReservations
              }
            />
          )}
        </div>
      </section>

      {/* ====================================================== */}
      {/* FEEDBACK                                               */}
      {/* ====================================================== */}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm text-success"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />

          <span>
            {successMessage}
          </span>
        </div>
      )}

      {/* ====================================================== */}
      {/* ACTIONS                                                */}
      {/* ====================================================== */}

      <section className="flex flex-col-reverse gap-3 rounded-sheet border border-border/70 bg-white p-4 shadow-none sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <Button
          type="button"
          variant="outline"
          disabled={
            currentStep === 1 ||
            isLoading
          }
          onClick={handleBack}
          className="h-11 rounded-xl px-5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        {currentStep < 6 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="h-11 rounded-xl bg-ink px-6 font-bold text-white hover:bg-action"
          >
            Continuar

            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-11 rounded-xl bg-action px-6 font-bold text-white shadow-overlay hover:bg-action-hover"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar solicitud
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </section>
    </form>
  );
}

/* ========================================================== */
/* STEP 1                                                     */
/* ========================================================== */

function StepOne({
  name,
  setName,
  shortDescription,
  setShortDescription,
  description,
  setDescription,
}: {
  name: string;
  setName: (
    value: string
  ) => void;
  shortDescription: string;
  setShortDescription: (
    value: string
  ) => void;
  description: string;
  setDescription: (
    value: string
  ) => void;
}) {
  return (
    <div className="grid gap-5">
      <Field
        label="Nombre del restaurante"
        required
      >
        <input
          value={name}
          onChange={(event) =>
            setName(
              event.target.value
            )
          }
          maxLength={150}
          placeholder="Ej. Asados El Güegüense"
          className={inputClass}
        />
      </Field>

      <Field
        label="Descripción corta"
        hint={`${shortDescription.length}/220`}
      >
        <input
          value={
            shortDescription
          }
          onChange={(event) =>
            setShortDescription(
              event.target.value
            )
          }
          maxLength={220}
          placeholder="Una frase que describa el concepto del restaurante"
          className={inputClass}
        />
      </Field>

      <Field
        label="Descripción completa"
        hint="Concepto, especialidades, ambiente o historia."
      >
        <textarea
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          rows={6}
          placeholder="Describe el restaurante y lo que lo hace especial..."
          className="w-full resize-none rounded-2xl border border-border/80 bg-canvas p-4 text-sm leading-6 outline-none transition hover:border-primary/20 hover:bg-white focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
        />
      </Field>
    </div>
  );
}

/* ========================================================== */
/* STEP 2                                                     */
/* ========================================================== */

function StepTwo({
  departments,
  filteredMunicipalities,
  departmentId,
  setDepartmentId,
  municipalityId,
  setMunicipalityId,
  address,
  setAddress,
}: {
  departments: Department[];
  filteredMunicipalities: Municipality[];
  departmentId: string;
  setDepartmentId: (
    value: string
  ) => void;
  municipalityId: string;
  setMunicipalityId: (
    value: string
  ) => void;
  address: string;
  setAddress: (
    value: string
  ) => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Field
        label="Departamento"
        required
      >
        <select
          value={departmentId}
          onChange={(event) => {
            setDepartmentId(
              event.target.value
            );

            setMunicipalityId('');
          }}
          className={inputClass}
        >
          <option value="">
            Selecciona un departamento
          </option>

          {departments.map(
            (department) => (
              <option
                key={
                  department.id
                }
                value={
                  department.id
                }
              >
                {department.name}
              </option>
            )
          )}
        </select>
      </Field>

      <Field
        label="Municipio"
        required
      >
        <select
          value={
            municipalityId
          }
          onChange={(event) =>
            setMunicipalityId(
              event.target.value
            )
          }
          disabled={
            !departmentId
          }
          className={
            inputClass
          }
        >
          <option value="">
            Selecciona un municipio
          </option>

          {filteredMunicipalities.map(
            (municipality) => (
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
            )
          )}
        </select>
      </Field>

      <Field
        label="Dirección exacta"
        required
        hint="Incluye referencias fáciles de reconocer."
        className="md:col-span-2"
      >
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={address}
            onChange={(event) =>
              setAddress(
                event.target.value
              )
            }
            placeholder="Ej. De la rotonda X, 2 cuadras al norte..."
            className={
              iconInputClass
            }
          />
        </div>
      </Field>
    </div>
  );
}

/* ========================================================== */
/* STEP 3                                                     */
/* ========================================================== */

function StepThree({
  categories,
  selectedCategoryIds,
  toggleCategory,
}: {
  categories: Category[];
  selectedCategoryIds: number[];
  toggleCategory: (
    id: number
  ) => void;
}) {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(
          (category) => {
            const selected =
              selectedCategoryIds.includes(
                category.id
              );

            return (
              <button
                key={
                  category.id
                }
                type="button"
                onClick={() =>
                  toggleCategory(
                    category.id
                  )
                }
                className={`relative flex min-h-[76px] items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  selected
                    ? 'border-primary/30 bg-primary/[0.07]'
                    : 'border-border/70 bg-canvas hover:border-primary/20 hover:bg-white'
                }`}
              >
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                    selected
                      ? 'bg-action text-white'
                      : 'bg-white text-muted-foreground'
                  }`}
                >
                  <UtensilsCrossed className="h-4 w-4" />
                </div>

                <span
                  className={`text-sm font-bold ${
                    selected
                      ? 'text-action'
                      : 'text-ink'
                  }`}
                >
                  {category.name}
                </span>

                {selected && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-action text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          }
        )}
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        {
          selectedCategoryIds.length
        }{' '}
        {selectedCategoryIds.length ===
        1
          ? 'categoría seleccionada'
          : 'categorías seleccionadas'}
      </p>
    </div>
  );
}

/* ========================================================== */
/* STEP 4                                                     */
/* ========================================================== */

function StepFour({
  phone,
  setPhone,
  whatsapp,
  setWhatsapp,
  email,
  setEmail,
  websiteUrl,
  setWebsiteUrl,
  facebookUrl,
  setFacebookUrl,
  instagramUrl,
  setInstagramUrl,
}: {
  phone: string;
  setPhone: (
    value: string
  ) => void;
  whatsapp: string;
  setWhatsapp: (
    value: string
  ) => void;
  email: string;
  setEmail: (
    value: string
  ) => void;
  websiteUrl: string;
  setWebsiteUrl: (
    value: string
  ) => void;
  facebookUrl: string;
  setFacebookUrl: (
    value: string
  ) => void;
  instagramUrl: string;
  setInstagramUrl: (
    value: string
  ) => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <IconField
        label="Teléfono"
        icon={Phone}
      >
        <input
          value={phone}
          onChange={(event) =>
            setPhone(
              event.target.value
            )
          }
          placeholder="8888 8888"
          className={
            iconInputClass
          }
        />
      </IconField>

      <IconField
        label="WhatsApp"
        icon={MessageCircle}
      >
        <input
          value={whatsapp}
          onChange={(event) =>
            setWhatsapp(
              event.target.value
            )
          }
          placeholder="8888 8888"
          className={
            iconInputClass
          }
        />
      </IconField>

      <IconField
        label="Correo del negocio"
        icon={Mail}
      >
        <input
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value
            )
          }
          placeholder="restaurante@correo.com"
          className={
            iconInputClass
          }
        />
      </IconField>

      <IconField
        label="Sitio web"
        icon={Globe2}
      >
        <input
          value={
            websiteUrl
          }
          onChange={(event) =>
            setWebsiteUrl(
              event.target.value
            )
          }
          placeholder="https://..."
          className={
            iconInputClass
          }
        />
      </IconField>

      <IconField
        label="Facebook"
        icon={Facebook}
      >
        <input
          value={
            facebookUrl
          }
          onChange={(event) =>
            setFacebookUrl(
              event.target.value
            )
          }
          placeholder="https://facebook.com/..."
          className={
            iconInputClass
          }
        />
      </IconField>

      <IconField
        label="Instagram"
        icon={Instagram}
      >
        <input
          value={
            instagramUrl
          }
          onChange={(event) =>
            setInstagramUrl(
              event.target.value
            )
          }
          placeholder="https://instagram.com/..."
          className={
            iconInputClass
          }
        />
      </IconField>
    </div>
  );
}

/* ========================================================== */
/* STEP 5                                                     */
/* ========================================================== */

function StepFive({
  priceLevel,
  setPriceLevel,
  estimatedPriceMin,
  setEstimatedPriceMin,
  estimatedPriceMax,
  setEstimatedPriceMax,
  acceptsReservations,
  setAcceptsReservations,
}: {
  priceLevel: string;
  setPriceLevel: (
    value: string
  ) => void;
  estimatedPriceMin: string;
  setEstimatedPriceMin: (
    value: string
  ) => void;
  estimatedPriceMax: string;
  setEstimatedPriceMax: (
    value: string
  ) => void;
  acceptsReservations: boolean;
  setAcceptsReservations: (
    value: boolean
  ) => void;
}) {
  return (
    <div>
      <div className="grid gap-5 md:grid-cols-3">
        <Field label="Nivel de precio">
          <select
            value={priceLevel}
            onChange={(event) =>
              setPriceLevel(
                event.target.value
              )
            }
            className={inputClass}
          >
            <option value="1">
              $ · Económico
            </option>

            <option value="2">
              $$ · Moderado
            </option>

            <option value="3">
              $$$ · Alto
            </option>

            <option value="4">
              $$$$ · Premium
            </option>
          </select>
        </Field>

        <Field
          label="Consumo mínimo"
          hint="Por persona"
        >
          <MoneyInput
            value={
              estimatedPriceMin
            }
            onChange={
              setEstimatedPriceMin
            }
            placeholder="150"
          />
        </Field>

        <Field
          label="Consumo máximo"
          hint="Por persona"
        >
          <MoneyInput
            value={
              estimatedPriceMax
            }
            onChange={
              setEstimatedPriceMax
            }
            placeholder="500"
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={() =>
          setAcceptsReservations(
            !acceptsReservations
          )
        }
        className={`mt-6 flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
          acceptsReservations
            ? 'border-primary/25 bg-primary/[0.06]'
            : 'border-border/70 bg-canvas hover:border-primary/20'
        }`}
      >
        <div
          className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border ${
            acceptsReservations
              ? 'border-primary bg-action text-white'
              : 'border-border bg-white'
          }`}
        >
          {acceptsReservations && (
            <Check className="h-3.5 w-3.5" />
          )}
        </div>

        <div>
          <p className="text-sm font-bold text-ink">
            Este restaurante acepta reservaciones
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Podrás administrar las solicitudes de reservación desde el portal.
          </p>
        </div>
      </button>
    </div>
  );
}

/* ========================================================== */
/* REVIEW                                                     */
/* ========================================================== */

function ReviewStep({
  name,
  shortDescription,
  selectedDepartment,
  selectedMunicipality,
  address,
  selectedCategories,
  phone,
  whatsapp,
  email,
  websiteUrl,
  priceLevel,
  estimatedPriceMin,
  estimatedPriceMax,
  acceptsReservations,
}: {
  name: string;
  shortDescription: string;
  selectedDepartment: string;
  selectedMunicipality: string;
  address: string;
  selectedCategories: Category[];
  phone: string;
  whatsapp: string;
  email: string;
  websiteUrl: string;
  priceLevel: string;
  estimatedPriceMin: string;
  estimatedPriceMax: string;
  acceptsReservations: boolean;
}) {
  const levelLabels: Record<
    string,
    string
  > = {
    '1': '$ · Económico',
    '2': '$$ · Moderado',
    '3': '$$$ · Alto',
    '4': '$$$$ · Premium',
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.05] p-5">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-action text-white">
            <CheckCircle2 className="h-5 w-5" />
          </div>

          <div>
            <p className="font-bold text-ink">
              Revisa antes de enviar
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Comprueba que la información sea correcta. Tu restaurante quedará pendiente de revisión.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ReviewCard
          title="Restaurante"
          items={[
            [
              'Nombre',
              name ||
                'Sin especificar',
            ],
            [
              'Descripción',
              shortDescription ||
                'Sin descripción corta',
            ],
          ]}
        />

        <ReviewCard
          title="Ubicación"
          items={[
            [
              'Departamento',
              selectedDepartment ||
                '—',
            ],
            [
              'Municipio',
              selectedMunicipality ||
                '—',
            ],
            [
              'Dirección',
              address || '—',
            ],
          ]}
        />

        <ReviewCard
          title="Categorías"
          items={[
            [
              'Seleccionadas',
              selectedCategories
                .map(
                  (category) =>
                    category.name
                )
                .join(', ') ||
                '—',
            ],
          ]}
        />

        <ReviewCard
          title="Contacto"
          items={[
            [
              'Teléfono',
              phone || '—',
            ],
            [
              'WhatsApp',
              whatsapp || '—',
            ],
            [
              'Correo',
              email || '—',
            ],
            [
              'Web',
              websiteUrl ||
                '—',
            ],
          ]}
        />

        <ReviewCard
          title="Precio"
          items={[
            [
              'Nivel',
              levelLabels[
                priceLevel
              ],
            ],
            [
              'Consumo',
              estimatedPriceMin ||
              estimatedPriceMax
                ? `C$${
                    estimatedPriceMin ||
                    '0'
                  } – C$${
                    estimatedPriceMax ||
                    '+'
                  }`
                : 'Sin estimación',
            ],
          ]}
        />

        <ReviewCard
          title="Reservaciones"
          items={[
            [
              'Estado',
              acceptsReservations
                ? 'Acepta reservaciones'
                : 'No acepta reservaciones',
            ],
          ]}
        />
      </div>
    </div>
  );
}

/* ========================================================== */
/* SHARED COMPONENTS                                          */
/* ========================================================== */

function StepHeader({
  step,
}: {
  step:
    (typeof steps)[number];
}) {
  const Icon =
    step.icon;

  const descriptions: Record<
    number,
    string
  > = {
    1: 'Cuéntanos los datos principales del establecimiento.',
    2: 'Indica dónde pueden encontrar tu restaurante.',
    3: 'Selecciona qué tipo de experiencia gastronómica ofreces.',
    4: 'Añade los medios por los que tus clientes pueden contactarte.',
    5: 'Configura precios y servicios disponibles.',
    6: 'Comprueba todo antes de enviar la solicitud.',
  };

  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-action" />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
          Paso {step.id}
        </p>

        <h2 className="mt-1 text-xl font-bold tracking-[-0.02em] text-ink">
          {step.title}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {
            descriptions[
              step.id
            ]
          }
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  required = false,
  className = '',
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-ink">
          {label}

          {required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
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

function IconField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-ink">
        {label}
      </label>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        {children}
      </div>
    </div>
  );
}

function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
        C$
      </span>

      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="h-[52px] w-full rounded-2xl border border-border/80 bg-canvas pl-11 pr-4 text-sm outline-none transition hover:border-primary/20 hover:bg-white focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
      />
    </div>
  );
}

function ReviewCard({
  title,
  items,
}: {
  title: string;
  items: [
    string,
    string,
  ][];
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-canvas p-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
        {title}
      </p>

      <div className="mt-3 space-y-3">
        {items.map(
          ([label, value]) => (
            <div
              key={label}
            >
              <p className="text-xs font-semibold text-muted-foreground">
                {label}
              </p>

              <p className="mt-0.5 break-words text-sm font-semibold text-ink">
                {value}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}