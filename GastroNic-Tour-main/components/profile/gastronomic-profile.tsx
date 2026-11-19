'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  ComponentType,
  ReactNode,
} from 'react';

import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Compass,
  Edit3,
  LoaderCircle,
  MapPinned,
  Plus,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const supabase =
  createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

type CategoryPreference =
  | 'love'
  | 'like'
  | 'avoid';

type CategorySelection =
  | CategoryPreference
  | '';

interface UserPreferencesRow {
  budget_per_person_min:
    | number
    | string
    | null;

  budget_per_person_max:
    | number
    | string
    | null;

  minimum_rating:
    | number
    | string
    | null;

  likes_new_experiences:
    | boolean
    | null;
}

interface UserSettingsRow {
  personalization_enabled:
    | boolean
    | null;

  location_personalization_enabled:
    | boolean
    | null;
}

interface CategoryRow {
  id: number;
  name: string;
  slug: string;
}

interface CategoryPreferenceRow {
  category_id: number;
  preference: CategoryPreference;
}

interface DepartmentRow {
  name: string;
}

interface MunicipalityRow {
  id: number;
  name: string;

  department:
    | DepartmentRow
    | DepartmentRow[]
    | null;
}

interface MunicipalityPreferenceRow {
  municipality_id: number;
  preference_strength: number;
}

interface ActivityRow {
  event_type: string;
}

interface RecommendationFeedbackRow {
  feedback:
    | 'interested'
    | 'not_interested'
    | 'hide'
    | string;
}

interface GeneralFormState {
  budgetMin: string;
  budgetMax: string;
  minimumRating: string;
  likesNewExperiences: boolean;
  personalizationEnabled: boolean;
  locationPersonalizationEnabled: boolean;
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function toNumber(
  value:
    | number
    | string
    | null
    | undefined
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}

function formatCurrencyRange(
  min:
    | number
    | null,
  max:
    | number
    | null
) {
  if (
    min === null &&
    max === null
  ) {
    return 'Sin definir';
  }

  if (
    min !== null &&
    max !== null
  ) {
    return `C$${min.toLocaleString(
      'es-NI'
    )} – C$${max.toLocaleString(
      'es-NI'
    )}`;
  }

  if (
    min !== null
  ) {
    return `Desde C$${min.toLocaleString(
      'es-NI'
    )}`;
  }

  return `Hasta C$${max!.toLocaleString(
    'es-NI'
  )}`;
}

function getPreferenceLabel(
  preference:
    CategoryPreference
) {
  switch (
    preference
  ) {
    case 'love':
      return 'Me encanta';

    case 'like':
      return 'Me gusta';

    case 'avoid':
      return 'Prefiero evitar';
  }
}

function normalizeDepartment(
  value:
    | DepartmentRow
    | DepartmentRow[]
    | null
) {
  if (
    !value
  ) {
    return null;
  }

  return Array.isArray(
    value
  )
    ? value[0] ??
        null
    : value;
}

function cloneCategorySelections(
  selections:
    Record<
      number,
      CategorySelection
    >
) {
  return {
    ...selections,
  };
}

function cloneMunicipalitySelections(
  selections:
    Record<
      number,
      number
    >
) {
  return {
    ...selections,
  };
}

const DEFAULT_GENERAL_FORM: GeneralFormState =
{
  budgetMin:
    '',
  budgetMax:
    '',
  minimumRating:
    '',
  likesNewExperiences:
    true,
  personalizationEnabled:
    true,
  locationPersonalizationEnabled:
    false,
};

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function GastronomicProfile() {
  const [
    userId,
    setUserId,
  ] =
    useState('');

  const [
    hasPreferencesRow,
    setHasPreferencesRow,
  ] =
    useState(false);

  const [
    hasSettingsRow,
    setHasSettingsRow,
  ] =
    useState(false);

  const [
    generalForm,
    setGeneralForm,
  ] =
    useState<GeneralFormState>(
      DEFAULT_GENERAL_FORM
    );

  const [
    savedGeneralForm,
    setSavedGeneralForm,
  ] =
    useState<GeneralFormState>(
      DEFAULT_GENERAL_FORM
    );

  const [
    allCategories,
    setAllCategories,
  ] =
    useState<
      CategoryRow[]
    >([]);

  const [
    categorySelections,
    setCategorySelections,
  ] =
    useState<
      Record<
        number,
        CategorySelection
      >
    >({});

  const [
    savedCategorySelections,
    setSavedCategorySelections,
  ] =
    useState<
      Record<
        number,
        CategorySelection
      >
    >({});

  const [
    allMunicipalities,
    setAllMunicipalities,
  ] =
    useState<
      MunicipalityRow[]
    >([]);

  const [
    municipalitySelections,
    setMunicipalitySelections,
  ] =
    useState<
      Record<
        number,
        number
      >
    >({});

  const [
    savedMunicipalitySelections,
    setSavedMunicipalitySelections,
  ] =
    useState<
      Record<
        number,
        number
      >
    >({});

  const [
    selectedMunicipalityId,
    setSelectedMunicipalityId,
  ] =
    useState('');

  const [
    selectedMunicipalityStrength,
    setSelectedMunicipalityStrength,
  ] =
    useState('3');

  const [
    activities,
    setActivities,
  ] =
    useState<
      ActivityRow[]
    >([]);

  const [
    recommendationFeedback,
    setRecommendationFeedback,
  ] =
    useState<
      RecommendationFeedbackRow[]
    >([]);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isEditing,
    setIsEditing,
  ] =
    useState(false);

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
  /* LOAD                                                     */
  /* ======================================================== */

  useEffect(() => {
    let cancelled =
      false;

    async function loadProfile() {
      setIsLoading(
        true
      );

      setErrorMessage(
        ''
      );

      const {
        data: {
          session,
        },
        error:
          sessionError,
      } =
        await supabase.auth.getSession();

      if (
        cancelled
      ) {
        return;
      }

      if (
        sessionError
      ) {
        console.error(
          'Error obteniendo sesión del perfil gastronómico:',
          sessionError
        );

        setErrorMessage(
          'No pudimos cargar tu perfil gastronómico.'
        );

        setIsLoading(
          false
        );

        return;
      }

      const user =
        session?.user;

      if (
        !user
      ) {
        setErrorMessage(
          'Inicia sesión para ver tu perfil gastronómico.'
        );

        setIsLoading(
          false
        );

        return;
      }

      setUserId(
        user.id
      );

      const [
        preferencesResult,
        settingsResult,
        categoriesResult,
        categoryPreferencesResult,
        municipalitiesResult,
        municipalityPreferencesResult,
        activityResult,
        feedbackResult,
      ] =
        await Promise.all([
          supabase
            .from(
              'user_preferences'
            )
            .select(`
              budget_per_person_min,
              budget_per_person_max,
              minimum_rating,
              likes_new_experiences
            `)
            .eq(
              'user_id',
              user.id
            )
            .maybeSingle(),

          supabase
            .from(
              'user_settings'
            )
            .select(`
              personalization_enabled,
              location_personalization_enabled
            `)
            .eq(
              'user_id',
              user.id
            )
            .maybeSingle(),

          supabase
            .from(
              'categories'
            )
            .select(`
              id,
              name,
              slug
            `)
            .eq(
              'is_active',
              true
            )
            .order(
              'name'
            ),

          supabase
            .from(
              'user_category_preferences'
            )
            .select(`
              category_id,
              preference
            `)
            .eq(
              'user_id',
              user.id
            ),

          supabase
            .from(
              'municipalities'
            )
            .select(`
              id,
              name,

              department:departments (
                name
              )
            `)
            .order(
              'name'
            )
            .limit(
              500
            ),

          supabase
            .from(
              'user_municipality_preferences'
            )
            .select(`
              municipality_id,
              preference_strength
            `)
            .eq(
              'user_id',
              user.id
            )
            .order(
              'preference_strength',
              {
                ascending:
                  false,
              }
            ),

          supabase
            .from(
              'user_activity_events'
            )
            .select(
              'event_type'
            )
            .eq(
              'user_id',
              user.id
            )
            .gte(
              'created_at',
              new Date(
                Date.now() -
                  90 *
                    24 *
                    60 *
                    60 *
                    1000
              ).toISOString()
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              }
            )
            .limit(
              200
            ),

          supabase
            .from(
              'recommendation_feedback'
            )
            .select(
              'feedback'
            )
            .eq(
              'user_id',
              user.id
            ),
        ]);

      if (
        cancelled
      ) {
        return;
      }

      const requiredErrors = [
        preferencesResult.error,
        settingsResult.error,
        categoriesResult.error,
        categoryPreferencesResult.error,
        municipalitiesResult.error,
        municipalityPreferencesResult.error,
      ].filter(
        Boolean
      );

      if (
        requiredErrors.length >
        0
      ) {
        console.error(
          'Error cargando datos editables del perfil gastronómico:',
          requiredErrors
        );

        setErrorMessage(
          'No pudimos cargar todas tus preferencias.'
        );

        setIsLoading(
          false
        );

        return;
      }

      if (
        activityResult.error
      ) {
        console.error(
          'Error cargando actividad del perfil gastronómico:',
          activityResult.error
        );
      }

      if (
        feedbackResult.error
      ) {
        console.error(
          'Error cargando feedback del perfil gastronómico:',
          feedbackResult.error
        );
      }

      const preferences =
        (
          preferencesResult.data ??
          null
        ) as UserPreferencesRow | null;

      const settings =
        (
          settingsResult.data ??
          null
        ) as UserSettingsRow | null;

      setHasPreferencesRow(
        Boolean(
          preferences
        )
      );

      setHasSettingsRow(
        Boolean(
          settings
        )
      );

      const nextGeneralForm:
        GeneralFormState =
      {
        budgetMin:
          preferences
            ?.budget_per_person_min ===
            null ||
          preferences
            ?.budget_per_person_min ===
            undefined
            ? ''
            : String(
                preferences
                  .budget_per_person_min
              ),

        budgetMax:
          preferences
            ?.budget_per_person_max ===
            null ||
          preferences
            ?.budget_per_person_max ===
            undefined
            ? ''
            : String(
                preferences
                  .budget_per_person_max
              ),

        minimumRating:
          preferences
            ?.minimum_rating ===
            null ||
          preferences
            ?.minimum_rating ===
            undefined
            ? ''
            : String(
                preferences
                  .minimum_rating
              ),

        likesNewExperiences:
          preferences
            ?.likes_new_experiences !==
          false,

        personalizationEnabled:
          settings
            ?.personalization_enabled !==
          false,

        locationPersonalizationEnabled:
          settings
            ?.location_personalization_enabled ===
          true,
      };

      setGeneralForm(
        nextGeneralForm
      );

      setSavedGeneralForm(
        nextGeneralForm
      );

      setAllCategories(
        (
          categoriesResult.data ??
          []
        ) as CategoryRow[]
      );

      const categoryRows =
        (
          categoryPreferencesResult.data ??
          []
        ) as CategoryPreferenceRow[];

      const nextCategorySelections:
        Record<
          number,
          CategorySelection
        > =
      {};

      for (
        const item
        of categoryRows
      ) {
        nextCategorySelections[
          item.category_id
        ] =
          item.preference;
      }

      setCategorySelections(
        nextCategorySelections
      );

      setSavedCategorySelections(
        cloneCategorySelections(
          nextCategorySelections
        )
      );

      setAllMunicipalities(
        (
          municipalitiesResult.data ??
          []
        ) as unknown as MunicipalityRow[]
      );

      const municipalityRows =
        (
          municipalityPreferencesResult.data ??
          []
        ) as MunicipalityPreferenceRow[];

      const nextMunicipalitySelections:
        Record<
          number,
          number
        > =
      {};

      for (
        const item
        of municipalityRows
      ) {
        nextMunicipalitySelections[
          item.municipality_id
        ] =
          item.preference_strength;
      }

      setMunicipalitySelections(
        nextMunicipalitySelections
      );

      setSavedMunicipalitySelections(
        cloneMunicipalitySelections(
          nextMunicipalitySelections
        )
      );

      setActivities(
        (
          activityResult.data ??
          []
        ) as ActivityRow[]
      );

      setRecommendationFeedback(
        (
          feedbackResult.data ??
          []
        ) as RecommendationFeedbackRow[]
      );

      setIsLoading(
        false
      );
    }

    loadProfile();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /* ======================================================== */
  /* DERIVED DATA                                             */
  /* ======================================================== */

  const categoryById =
    useMemo(
      () =>
        new Map(
          allCategories.map(
            (
              category
            ) => [
              category.id,
              category,
            ]
          )
        ),
      [
        allCategories,
      ]
    );

  const municipalityById =
    useMemo(
      () =>
        new Map(
          allMunicipalities.map(
            (
              municipality
            ) => [
              municipality.id,
              municipality,
            ]
          )
        ),
      [
        allMunicipalities,
      ]
    );

  const selectedCategories =
    useMemo(
      () =>
        Object.entries(
          categorySelections
        )
          .filter(
            (
              [
                ,
                preference,
              ]
            ) =>
              Boolean(
                preference
              )
          )
          .map(
            (
              [
                id,
                preference,
              ]
            ) => ({
              category:
                categoryById.get(
                  Number(
                    id
                  )
                ) ??
                null,

              preference:
                preference as
                  CategoryPreference,
            })
          )
          .filter(
            (
              item
            ) =>
              Boolean(
                item.category
              )
          ),
      [
        categorySelections,
        categoryById,
      ]
    );

  const selectedMunicipalities =
    useMemo(
      () =>
        Object.entries(
          municipalitySelections
        )
          .map(
            (
              [
                id,
                strength,
              ]
            ) => ({
              municipality:
                municipalityById.get(
                  Number(
                    id
                  )
                ) ??
                null,

              strength,
            })
          )
          .filter(
            (
              item
            ) =>
              Boolean(
                item.municipality
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              b.strength -
              a.strength
          ),
      [
        municipalitySelections,
        municipalityById,
      ]
    );

  const activityCounts =
    useMemo(
      () => {
        const counts =
        {
          restaurant_view:
            0,

          search:
            0,

          favorite_add:
            0,
        };

        for (
          const activity
          of activities
        ) {
          if (
            activity.event_type ===
            'restaurant_view'
          ) {
            counts.restaurant_view +=
              1;
          }

          if (
            activity.event_type ===
            'search'
          ) {
            counts.search +=
              1;
          }

          if (
            activity.event_type ===
            'favorite_add'
          ) {
            counts.favorite_add +=
              1;
          }
        }

        return counts;
      },
      [
        activities,
      ]
    );

  const interestedCount =
    recommendationFeedback.filter(
      (
        item
      ) =>
        item.feedback ===
        'interested'
    ).length;

  const notInterestedCount =
    recommendationFeedback.filter(
      (
        item
      ) =>
        item.feedback ===
          'not_interested' ||
        item.feedback ===
          'hide'
    ).length;

  const budgetMin =
    toNumber(
      generalForm.budgetMin
    );

  const budgetMax =
    toNumber(
      generalForm.budgetMax
    );

  const minimumRating =
    toNumber(
      generalForm.minimumRating
    );

  /* ======================================================== */
  /* EDIT HELPERS                                             */
  /* ======================================================== */

  function handleCancelEdit() {
    setGeneralForm(
      savedGeneralForm
    );

    setCategorySelections(
      cloneCategorySelections(
        savedCategorySelections
      )
    );

    setMunicipalitySelections(
      cloneMunicipalitySelections(
        savedMunicipalitySelections
      )
    );

    setSelectedMunicipalityId(
      ''
    );

    setSelectedMunicipalityStrength(
      '3'
    );

    setErrorMessage(
      ''
    );

    setSuccessMessage(
      ''
    );

    setIsEditing(
      false
    );
  }

  function setCategoryPreference(
    categoryId:
      number,

    preference:
      CategorySelection
  ) {
    setCategorySelections(
      (
        current
      ) => ({
        ...current,

        [
          categoryId
        ]:
          preference,
      })
    );
  }

  function addMunicipalityPreference() {
    const municipalityId =
      Number(
        selectedMunicipalityId
      );

    const strength =
      Number(
        selectedMunicipalityStrength
      );

    if (
      !Number.isInteger(
        municipalityId
      ) ||
      !municipalityById.has(
        municipalityId
      )
    ) {
      setErrorMessage(
        'Selecciona un municipio válido.'
      );

      return;
    }

    if (
      strength <
        1 ||
      strength >
        5
    ) {
      setErrorMessage(
        'El nivel de interés debe estar entre 1 y 5.'
      );

      return;
    }

    setMunicipalitySelections(
      (
        current
      ) => ({
        ...current,

        [
          municipalityId
        ]:
          strength,
      })
    );

    setSelectedMunicipalityId(
      ''
    );

    setSelectedMunicipalityStrength(
      '3'
    );

    setErrorMessage(
      ''
    );
  }

  function removeMunicipalityPreference(
    municipalityId:
      number
  ) {
    setMunicipalitySelections(
      (
        current
      ) => {
        const next =
          {
            ...current,
          };

        delete next[
          municipalityId
        ];

        return next;
      }
    );
  }

  /* ======================================================== */
  /* SAVE                                                     */
  /* ======================================================== */

  async function handleSave() {
    if (
      !userId
    ) {
      setErrorMessage(
        'No encontramos una sesión activa.'
      );

      return;
    }

    const parsedBudgetMin =
      toNumber(
        generalForm.budgetMin
      );

    const parsedBudgetMax =
      toNumber(
        generalForm.budgetMax
      );

    const parsedMinimumRating =
      toNumber(
        generalForm.minimumRating
      );

    if (
      parsedBudgetMin !==
        null &&
      parsedBudgetMin <
        0
    ) {
      setErrorMessage(
        'El presupuesto mínimo no puede ser negativo.'
      );

      return;
    }

    if (
      parsedBudgetMax !==
        null &&
      parsedBudgetMax <
        0
    ) {
      setErrorMessage(
        'El presupuesto máximo no puede ser negativo.'
      );

      return;
    }

    if (
      parsedBudgetMin !==
        null &&
      parsedBudgetMax !==
        null &&
      parsedBudgetMin >
        parsedBudgetMax
    ) {
      setErrorMessage(
        'El presupuesto mínimo no puede ser mayor que el máximo.'
      );

      return;
    }

    if (
      parsedMinimumRating !==
        null &&
      (
        parsedMinimumRating <
          0 ||
        parsedMinimumRating >
          5
      )
    ) {
      setErrorMessage(
        'El rating mínimo debe estar entre 0 y 5.'
      );

      return;
    }

    setIsSaving(
      true
    );

    setErrorMessage(
      ''
    );

    setSuccessMessage(
      ''
    );

    try {
      /* ---------------------------------------------------- */
      /* GENERAL PREFERENCES                                  */
      /* ---------------------------------------------------- */

      const preferencesPayload =
      {
        budget_per_person_min:
          parsedBudgetMin,

        budget_per_person_max:
          parsedBudgetMax,

        minimum_rating:
          parsedMinimumRating,

        likes_new_experiences:
          generalForm.likesNewExperiences,

        updated_at:
          new Date().toISOString(),
      };

      if (
        hasPreferencesRow
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              'user_preferences'
            )
            .update(
              preferencesPayload
            )
            .eq(
              'user_id',
              userId
            );

        if (
          error
        ) {
          throw error;
        }
      } else {
        const {
          error,
        } =
          await supabase
            .from(
              'user_preferences'
            )
            .insert({
              user_id:
                userId,

              ...preferencesPayload,
            });

        if (
          error
        ) {
          throw error;
        }

        setHasPreferencesRow(
          true
        );
      }

      /* ---------------------------------------------------- */
      /* SETTINGS                                             */
      /* ---------------------------------------------------- */

      const settingsPayload =
      {
        personalization_enabled:
          generalForm.personalizationEnabled,

        location_personalization_enabled:
          generalForm.locationPersonalizationEnabled,

        updated_at:
          new Date().toISOString(),
      };

      if (
        hasSettingsRow
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              'user_settings'
            )
            .update(
              settingsPayload
            )
            .eq(
              'user_id',
              userId
            );

        if (
          error
        ) {
          throw error;
        }
      } else {
        const {
          error,
        } =
          await supabase
            .from(
              'user_settings'
            )
            .insert({
              user_id:
                userId,

              ...settingsPayload,
            });

        if (
          error
        ) {
          throw error;
        }

        setHasSettingsRow(
          true
        );
      }

      /* ---------------------------------------------------- */
      /* CATEGORY PREFERENCES                                 */
      /* ---------------------------------------------------- */

      const categoryUpserts =
        Object.entries(
          categorySelections
        )
          .filter(
            (
              [
                ,
                preference,
              ]
            ) =>
              Boolean(
                preference
              )
          )
          .filter(
            (
              [
                id,
                preference,
              ]
            ) =>
              savedCategorySelections[
                Number(
                  id
                )
              ] !==
              preference
          )
          .map(
            (
              [
                id,
                preference,
              ]
            ) => ({
              user_id:
                userId,

              category_id:
                Number(
                  id
                ),

              preference:
                preference as
                  CategoryPreference,

              updated_at:
                new Date().toISOString(),
            })
          );

      if (
        categoryUpserts.length >
        0
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              'user_category_preferences'
            )
            .upsert(
              categoryUpserts,
              {
                onConflict:
                  'user_id,category_id',
              }
            );

        if (
          error
        ) {
          throw error;
        }
      }

      const categoryDeletes =
        Object.keys(
          savedCategorySelections
        )
          .map(
            Number
          )
          .filter(
            (
              categoryId
            ) =>
              Boolean(
                savedCategorySelections[
                  categoryId
                ]
              ) &&
              !categorySelections[
                categoryId
              ]
          );

      if (
        categoryDeletes.length >
        0
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              'user_category_preferences'
            )
            .delete()
            .eq(
              'user_id',
              userId
            )
            .in(
              'category_id',
              categoryDeletes
            );

        if (
          error
        ) {
          throw error;
        }
      }

      /* ---------------------------------------------------- */
      /* MUNICIPALITY PREFERENCES                             */
      /* ---------------------------------------------------- */

      const municipalityUpserts =
        Object.entries(
          municipalitySelections
        )
          .filter(
            (
              [
                id,
                strength,
              ]
            ) =>
              savedMunicipalitySelections[
                Number(
                  id
                )
              ] !==
              strength
          )
          .map(
            (
              [
                id,
                strength,
              ]
            ) => ({
              user_id:
                userId,

              municipality_id:
                Number(
                  id
                ),

              preference_strength:
                strength,

              updated_at:
                new Date().toISOString(),
            })
          );

      if (
        municipalityUpserts.length >
        0
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              'user_municipality_preferences'
            )
            .upsert(
              municipalityUpserts,
              {
                onConflict:
                  'user_id,municipality_id',
              }
            );

        if (
          error
        ) {
          throw error;
        }
      }

      const municipalityDeletes =
        Object.keys(
          savedMunicipalitySelections
        )
          .map(
            Number
          )
          .filter(
            (
              municipalityId
            ) =>
              savedMunicipalitySelections[
                municipalityId
              ] !==
                undefined &&
              municipalitySelections[
                municipalityId
              ] ===
                undefined
          );

      if (
        municipalityDeletes.length >
        0
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              'user_municipality_preferences'
            )
            .delete()
            .eq(
              'user_id',
              userId
            )
            .in(
              'municipality_id',
              municipalityDeletes
            );

        if (
          error
        ) {
          throw error;
        }
      }

      /* ---------------------------------------------------- */
      /* LOCAL COMMIT                                         */
      /* ---------------------------------------------------- */

      setSavedGeneralForm(
        generalForm
      );

      setSavedCategorySelections(
        cloneCategorySelections(
          categorySelections
        )
      );

      setSavedMunicipalitySelections(
        cloneMunicipalitySelections(
          municipalitySelections
        )
      );

      setSuccessMessage(
        'Tus preferencias se guardaron correctamente. GastroNic las usará en tus próximas recomendaciones.'
      );

      setIsEditing(
        false
      );
    } catch (
      error
    ) {
      console.error(
        'Error guardando perfil gastronómico:',
        error
      );

      setErrorMessage(
        'No pudimos guardar todas tus preferencias. Inténtalo nuevamente.'
      );
    } finally {
      setIsSaving(
        false
      );
    }
  }

  /* ======================================================== */
  /* LOADING                                                  */
  /* ======================================================== */

  if (
    isLoading
  ) {
    return (
      <section className="mt-6 overflow-hidden rounded-sheet border border-border/70 bg-white p-5 shadow-none sm:mt-8 sm:p-7">
        <div className="flex items-center gap-3">
          <LoaderCircle className="h-5 w-5 animate-spin text-action" />

          <p className="text-sm font-semibold text-muted-foreground">
            Preparando tu perfil gastronómico...
          </p>
        </div>
      </section>
    );
  }

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <section className="mt-6 overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none sm:mt-8">
      <div className="border-b border-border/60 bg-gradient-to-br from-[#EFF9F7] via-white to-[#FFF9E8] p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-action sm:text-xs">
              <BrainCircuit className="h-3.5 w-3.5" />

              Perfil gastronómico
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-ink sm:text-3xl">
              Lo que GastroNic está aprendiendo de ti
            </h2>

            <p className="mt-2 max-w-xl text-[13px] leading-6 text-muted-foreground sm:text-sm">
              Tus preferencias y tu actividad ayudan a ordenar recomendaciones más relevantes para ti.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-xs leading-5 text-muted-foreground shadow-sm">
              {generalForm.personalizationEnabled
                ? 'La personalización está activa.'
                : 'La personalización está desactivada.'}
            </div>

            {!isEditing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setErrorMessage('');
                  setSuccessMessage('');
                  setIsEditing(true);
                }}
                className="h-11 rounded-xl bg-white"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Editar preferencias
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={
                  handleCancelEdit
                }
                disabled={
                  isSaving
                }
                className="h-11 rounded-xl bg-white"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mx-5 mt-5 flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger sm:mx-7">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />

          <p>
            {errorMessage}
          </p>
        </div>
      )}

      {successMessage && (
        <div className="mx-5 mt-5 flex items-start gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm text-success sm:mx-7">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />

          <p>
            {successMessage}
          </p>
        </div>
      )}

      {isEditing ? (
        <EditProfile
          generalForm={
            generalForm
          }
          setGeneralForm={
            setGeneralForm
          }
          allCategories={
            allCategories
          }
          categorySelections={
            categorySelections
          }
          setCategoryPreference={
            setCategoryPreference
          }
          allMunicipalities={
            allMunicipalities
          }
          municipalitySelections={
            municipalitySelections
          }
          setMunicipalitySelections={
            setMunicipalitySelections
          }
          selectedMunicipalityId={
            selectedMunicipalityId
          }
          setSelectedMunicipalityId={
            setSelectedMunicipalityId
          }
          selectedMunicipalityStrength={
            selectedMunicipalityStrength
          }
          setSelectedMunicipalityStrength={
            setSelectedMunicipalityStrength
          }
          addMunicipalityPreference={
            addMunicipalityPreference
          }
          removeMunicipalityPreference={
            removeMunicipalityPreference
          }
          municipalityById={
            municipalityById
          }
          onSave={
            handleSave
          }
          isSaving={
            isSaving
          }
        />
      ) : (
        <>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-4">
            <ProfileMetric
              icon={
                Wallet
              }
              label="Presupuesto habitual"
              value={
                formatCurrencyRange(
                  budgetMin,
                  budgetMax
                )
              }
            />

            <ProfileMetric
              icon={
                Star
              }
              label="Rating mínimo"
              value={
                minimumRating ===
                null
                  ? 'Sin definir'
                  : `${minimumRating.toFixed(
                      1
                    )} estrellas`
              }
            />

            <ProfileMetric
              icon={
                Compass
              }
              label="Descubrir lugares nuevos"
              value={
                generalForm.likesNewExperiences
                  ? 'Sí'
                  : 'Prefiero conocidos'
              }
            />

            <ProfileMetric
              icon={
                MapPinned
              }
              label="Ubicación en recomendaciones"
              value={
                generalForm.locationPersonalizationEnabled
                  ? 'Activada'
                  : 'Desactivada'
              }
            />
          </div>

          <div className="grid gap-6 border-t border-border/60 p-5 sm:p-7 lg:grid-cols-2">
            <div>
              <SectionTitle
                icon={
                  UtensilsCrossed
                }
                title="Tus gustos"
                description="Preferencias explícitas que tienen más peso en el motor."
              />

              {selectedCategories.length >
              0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedCategories.map(
                    (
                      item
                    ) => (
                      <span
                        key={
                          item.category!
                            .id
                        }
                        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${
                          item.preference ===
                          'avoid'
                            ? 'border-danger/25 bg-danger-soft text-danger'
                            : item.preference ===
                                'love'
                              ? 'border-primary/15 bg-primary/10 text-action'
                              : 'border-border/70 bg-canvas text-ink'
                        }`}
                      >
                        {
                          item.category!
                            .name
                        }

                        <span className="ml-1.5 font-medium opacity-60">
                          ·{' '}
                          {getPreferenceLabel(
                            item.preference
                          )}
                        </span>
                      </span>
                    )
                  )}
                </div>
              ) : (
                <EmptyText>
                  Todavía no has definido categorías favoritas.
                </EmptyText>
              )}
            </div>

            <div>
              <SectionTitle
                icon={
                  MapPinned
                }
                title="Zonas que te interesan"
                description="Municipios que pueden ganar relevancia en tus recomendaciones."
              />

              {selectedMunicipalities.length >
              0 ? (
                <div className="mt-4 space-y-2">
                  {selectedMunicipalities
                    .slice(
                      0,
                      6
                    )
                    .map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item
                              .municipality!
                              .id
                          }
                          className="flex items-center justify-between gap-4 rounded-xl bg-canvas px-3 py-2.5"
                        >
                          <span className="text-xs font-bold text-ink sm:text-sm">
                            {
                              item
                                .municipality!
                                .name
                            }
                          </span>

                          <span className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                            Interés{' '}
                            {
                              item.strength
                            }
                            /5
                          </span>
                        </div>
                      )
                    )}
                </div>
              ) : (
                <EmptyText>
                  Todavía no has definido zonas favoritas.
                </EmptyText>
              )}
            </div>
          </div>

          <div className="border-t border-border/60 bg-canvas p-5 sm:p-7">
            <SectionTitle
              icon={
                Sparkles
              }
              title="Señales recientes"
              description="Actividad de los últimos 90 días que puede ayudar a personalizar GastroNic."
            />

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <SignalCard
                icon={
                  Search
                }
                value={
                  activityCounts.search
                }
                label="Búsquedas"
              />

              <SignalCard
                icon={
                  UtensilsCrossed
                }
                value={
                  activityCounts.restaurant_view
                }
                label="Lugares vistos"
              />

              <SignalCard
                icon={
                  Sparkles
                }
                value={
                  interestedCount
                }
                label="Me interesa"
              />

              <SignalCard
                icon={
                  Compass
                }
                value={
                  notInterestedCount
                }
                label="No es para mí"
              />

              <SignalCard
                icon={
                  Star
                }
                value={
                  activityCounts.favorite_add
                }
                label="Favoritos guardados"
              />
            </div>

            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Las búsquedas y vistas son señales débiles; tus preferencias explícitas, favoritos, visitas y feedback tienen mayor peso.
            </p>
          </div>
        </>
      )}
    </section>
  );
}

/* ========================================================== */
/* EDIT PROFILE                                               */
/* ========================================================== */

function EditProfile({
  generalForm,
  setGeneralForm,
  allCategories,
  categorySelections,
  setCategoryPreference,
  allMunicipalities,
  municipalitySelections,
  setMunicipalitySelections,
  selectedMunicipalityId,
  setSelectedMunicipalityId,
  selectedMunicipalityStrength,
  setSelectedMunicipalityStrength,
  addMunicipalityPreference,
  removeMunicipalityPreference,
  municipalityById,
  onSave,
  isSaving,
}: {
  generalForm:
    GeneralFormState;

  setGeneralForm:
    React.Dispatch<
      React.SetStateAction<
        GeneralFormState
      >
    >;

  allCategories:
    CategoryRow[];

  categorySelections:
    Record<
      number,
      CategorySelection
    >;

  setCategoryPreference: (
    categoryId:
      number,
    preference:
      CategorySelection
  ) => void;

  allMunicipalities:
    MunicipalityRow[];

  municipalitySelections:
    Record<
      number,
      number
    >;

  setMunicipalitySelections:
    React.Dispatch<
      React.SetStateAction<
        Record<
          number,
          number
        >
      >
    >;

  selectedMunicipalityId:
    string;

  setSelectedMunicipalityId: (
    value:
      string
  ) => void;

  selectedMunicipalityStrength:
    string;

  setSelectedMunicipalityStrength: (
    value:
      string
  ) => void;

  addMunicipalityPreference:
    () => void;

  removeMunicipalityPreference: (
    municipalityId:
      number
  ) => void;

  municipalityById:
    Map<
      number,
      MunicipalityRow
    >;

  onSave:
    () => Promise<void>;

  isSaving:
    boolean;
}) {
  const selectedMunicipalityEntries =
    Object.entries(
      municipalitySelections
    )
      .map(
        (
          [
            id,
            strength,
          ]
        ) => ({
          id:
            Number(
              id
            ),

          strength,

          municipality:
            municipalityById.get(
              Number(
                id
              )
            ) ??
            null,
        })
      )
      .filter(
        (
          item
        ) =>
          Boolean(
            item.municipality
          )
      )
      .sort(
        (
          a,
          b
        ) =>
          b.strength -
          a.strength
      );

  return (
    <div>
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-2">
        <div className="space-y-5">
          <SectionTitle
            icon={
              Wallet
            }
            title="Preferencias generales"
            description="Estos valores influyen directamente en el orden de tus recomendaciones."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Presupuesto mínimo por persona"
              helper="En córdobas. Puedes dejarlo vacío."
            >
              <input
                type="number"
                min="0"
                step="1"
                value={
                  generalForm.budgetMin
                }
                onChange={(
                  event
                ) =>
                  setGeneralForm(
                    (
                      current
                    ) => ({
                      ...current,

                      budgetMin:
                        event
                          .target
                          .value,
                    })
                  )
                }
                disabled={
                  isSaving
                }
                placeholder="Ej. 250"
                className="h-11 w-full rounded-xl border border-border bg-canvas px-3.5 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
              />
            </Field>

            <Field
              label="Presupuesto máximo por persona"
              helper="En córdobas. Puedes dejarlo vacío."
            >
              <input
                type="number"
                min="0"
                step="1"
                value={
                  generalForm.budgetMax
                }
                onChange={(
                  event
                ) =>
                  setGeneralForm(
                    (
                      current
                    ) => ({
                      ...current,

                      budgetMax:
                        event
                          .target
                          .value,
                    })
                  )
                }
                disabled={
                  isSaving
                }
                placeholder="Ej. 800"
                className="h-11 w-full rounded-xl border border-border bg-canvas px-3.5 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
              />
            </Field>
          </div>

          <Field
            label="Rating mínimo"
            helper="Los restaurantes por debajo de este rating pueden quedar fuera de tus recomendaciones."
          >
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={
                generalForm.minimumRating
              }
              onChange={(
                event
              ) =>
                setGeneralForm(
                  (
                    current
                  ) => ({
                    ...current,

                    minimumRating:
                      event
                        .target
                        .value,
                  })
                )
              }
              disabled={
                isSaving
              }
              placeholder="Ej. 4.0"
              className="h-11 w-full rounded-xl border border-border bg-canvas px-3.5 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
            />
          </Field>

          <div className="space-y-3">
            <ToggleRow
              title="Quiero descubrir lugares nuevos"
              description="Permite que GastroNic incluya lugares nuevos aunque todavía no tengas historial con ellos."
              checked={
                generalForm.likesNewExperiences
              }
              onChange={(
                checked
              ) =>
                setGeneralForm(
                  (
                    current
                  ) => ({
                    ...current,

                    likesNewExperiences:
                      checked,
                  })
                )
              }
              disabled={
                isSaving
              }
            />

            <ToggleRow
              title="Personalización"
              description="Activa o desactiva el motor personalizado para tu cuenta."
              checked={
                generalForm.personalizationEnabled
              }
              onChange={(
                checked
              ) =>
                setGeneralForm(
                  (
                    current
                  ) => ({
                    ...current,

                    personalizationEnabled:
                      checked,
                  })
                )
              }
              disabled={
                isSaving
              }
            />

            <ToggleRow
              title="Usar mi ubicación al recomendar"
              description="Cuando esté activa, GastroNic puede pedir ubicación al navegador para calcular cercanía. La ubicación precisa no se guarda en este perfil."
              checked={
                generalForm.locationPersonalizationEnabled
              }
              onChange={(
                checked
              ) =>
                setGeneralForm(
                  (
                    current
                  ) => ({
                    ...current,

                    locationPersonalizationEnabled:
                      checked,
                  })
                )
              }
              disabled={
                isSaving ||
                !generalForm.personalizationEnabled
              }
            />
          </div>
        </div>

        <div>
          <SectionTitle
            icon={
              MapPinned
            }
            title="Zonas que te interesan"
            description="Añade municipios y define qué tanta prioridad quieres darles."
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_auto]">
            <select
              value={
                selectedMunicipalityId
              }
              onChange={(
                event
              ) =>
                setSelectedMunicipalityId(
                  event
                    .target
                    .value
                )
              }
              disabled={
                isSaving
              }
              className="h-11 min-w-0 rounded-xl border border-border bg-canvas px-3 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
            >
              <option value="">
                Selecciona un municipio
              </option>

              {allMunicipalities.map(
                (
                  municipality
                ) => {
                  const department =
                    normalizeDepartment(
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
                        ?.name
                        ? ` · ${department.name}`
                        : ''}
                    </option>
                  );
                }
              )}
            </select>

            <select
              value={
                selectedMunicipalityStrength
              }
              onChange={(
                event
              ) =>
                setSelectedMunicipalityStrength(
                  event
                    .target
                    .value
                )
              }
              disabled={
                isSaving
              }
              className="h-11 rounded-xl border border-border bg-canvas px-3 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
            >
              <option value="1">
                Interés 1
              </option>
              <option value="2">
                Interés 2
              </option>
              <option value="3">
                Interés 3
              </option>
              <option value="4">
                Interés 4
              </option>
              <option value="5">
                Interés 5
              </option>
            </select>

            <Button
              type="button"
              variant="outline"
              onClick={
                addMunicipalityPreference
              }
              disabled={
                isSaving ||
                !selectedMunicipalityId
              }
              className="h-11 rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Añadir
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {selectedMunicipalityEntries.length >
            0 ? (
              selectedMunicipalityEntries.map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.id
                    }
                    className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-canvas p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {
                          item
                            .municipality!
                            .name
                        }
                      </p>

                      {normalizeDepartment(
                        item
                          .municipality!
                          .department
                      )
                        ?.name && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {
                            normalizeDepartment(
                              item
                                .municipality!
                                .department
                            )!
                              .name
                          }
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={
                          item.strength
                        }
                        onChange={(
                          event
                        ) =>
                          setMunicipalitySelections(
                            (
                              current
                            ) => ({
                              ...current,

                              [
                                item.id
                              ]:
                                Number(
                                  event
                                    .target
                                    .value
                                ),
                            })
                          )
                        }
                        disabled={
                          isSaving
                        }
                        className="h-9 rounded-lg border border-border bg-white px-2.5 text-xs font-semibold outline-none focus:border-primary/30"
                      >
                        <option value="1">
                          Interés 1
                        </option>
                        <option value="2">
                          Interés 2
                        </option>
                        <option value="3">
                          Interés 3
                        </option>
                        <option value="4">
                          Interés 4
                        </option>
                        <option value="5">
                          Interés 5
                        </option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          removeMunicipalityPreference(
                            item.id
                          )
                        }
                        disabled={
                          isSaving
                        }
                        aria-label={`Eliminar ${item.municipality!.name} de tus zonas`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-danger/25 bg-white text-red-500 transition hover:bg-danger-soft disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              )
            ) : (
              <EmptyText>
                Añade al menos una zona si quieres dar prioridad a municipios específicos.
              </EmptyText>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 bg-canvas p-5 sm:p-7">
        <SectionTitle
          icon={
            UtensilsCrossed
          }
          title="Categorías gastronómicas"
          description="Marca qué tipos de lugares te encantan, te gustan o prefieres evitar."
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {allCategories.map(
            (
              category
            ) => (
              <div
                key={
                  category.id
                }
                className="rounded-2xl border border-border/70 bg-white p-4"
              >
                <p className="text-sm font-bold text-ink">
                  {
                    category.name
                  }
                </p>

                <select
                  value={
                    categorySelections[
                      category.id
                    ] ??
                    ''
                  }
                  onChange={(
                    event
                  ) =>
                    setCategoryPreference(
                      category.id,
                      event
                        .target
                        .value as
                        CategorySelection
                    )
                  }
                  disabled={
                    isSaving
                  }
                  className="mt-3 h-10 w-full rounded-xl border border-border bg-canvas px-3 text-xs font-semibold outline-none transition focus:border-primary/30 focus:bg-white"
                >
                  <option value="">
                    Sin preferencia
                  </option>

                  <option value="like">
                    Me gusta
                  </option>

                  <option value="love">
                    Me encanta
                  </option>

                  <option value="avoid">
                    Prefiero evitar
                  </option>
                </select>
              </div>
            )
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 p-5 sm:flex-row sm:items-center sm:justify-end sm:p-7">
        <Button
          type="button"
          onClick={
            onSave
          }
          disabled={
            isSaving
          }
          className="h-11 rounded-xl px-6"
        >
          {isSaving ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar preferencias
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ========================================================== */
/* SMALL COMPONENTS                                           */
/* ========================================================== */

function ProfileMetric({
  icon:
    Icon,
  label,
  value,
}: {
  icon:
    ComponentType<{
      className?: string;
    }>;

  label:
    string;

  value:
    string;
}) {
  return (
    <article className="rounded-2xl border border-border/70 bg-canvas p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-action">
        <Icon className="h-4 w-4" />
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-ink">
        {value}
      </p>
    </article>
  );
}

function SectionTitle({
  icon:
    Icon,
  title,
  description,
}: {
  icon:
    ComponentType<{
      className?: string;
    }>;

  title:
    string;

  description:
    string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-action">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <h3 className="text-sm font-bold text-ink sm:text-base">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function SignalCard({
  icon:
    Icon,
  value,
  label,
}: {
  icon:
    ComponentType<{
      className?: string;
    }>;

  value:
    number;

  label:
    string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-4 w-4 text-action" />

        <span className="text-xl font-bold tracking-[-0.03em] text-ink">
          {value}
        </span>
      </div>

      <p className="mt-3 text-xs font-semibold leading-4 text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled =
    false,
}: {
  title:
    string;

  description:
    string;

  checked:
    boolean;

  onChange: (
    checked:
      boolean
  ) => void;

  disabled?:
    boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-canvas p-4 ${disabled ? 'opacity-60' : ''}`}>
      <div>
        <p className="text-sm font-bold text-ink">
          {title}
        </p>

        <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={
          checked
        }
        aria-label={
          title
        }
        disabled={
          disabled
        }
        onClick={() =>
          onChange(
            !checked
          )
        }
        className={`relative mt-0.5 h-7 w-12 flex-shrink-0 rounded-full transition ${
          checked
            ? 'bg-action'
            : 'bg-slate-200'
        } disabled:cursor-not-allowed`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked
              ? 'translate-x-6'
              : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label:
    string;

  helper?:
    string;

  children:
    ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-ink">
        {label}
      </label>

      {children}

      {helper && (
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          {helper}
        </p>
      )}
    </div>
  );
}

function EmptyText({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <p className="mt-4 rounded-xl border border-dashed border-border bg-canvas px-4 py-5 text-xs leading-5 text-muted-foreground">
      {children}
    </p>
  );
}
