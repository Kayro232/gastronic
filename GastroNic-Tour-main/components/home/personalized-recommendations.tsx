'use client';

import {
    useEffect,
    useState,
} from 'react';

import {
    AlertCircle,
    Sparkles,
} from 'lucide-react';

import {
    RestaurantCards,
    type RecommendationFeedbackValue,
    type Restaurant,
} from '@/components/home/restaurant-grid';

import { createClient } from '@/lib/supabase/client';

const supabase =
    createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface RecommendationRow {
    restaurant_id: string;

    recommendation_score:
    | number
    | string
    | null;

    distance_km:
    | number
    | string
    | null;

    reasons:
    | string[]
    | null;
}

interface OpenStatusRow {
    restaurant_id: string;
    is_open: boolean;
}

interface UserSettingsRow {
    personalization_enabled:
    | boolean
    | null;

    location_personalization_enabled:
    | boolean
    | null;
}

interface RecommendationFeedbackRow {
    restaurant_id: string;

    feedback:
    RecommendationFeedbackValue;
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function toNullableNumber(
    value:
        | number
        | string
        | null
        | undefined
) {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const numericValue =
        Number(value);

    return Number.isFinite(
        numericValue
    )
        ? numericValue
        : null;
}

function getCurrentCoordinates(): Promise<{
    latitude: number;
    longitude: number;
} | null> {
    return new Promise(
        (
            resolve
        ) => {
            if (
                typeof navigator ===
                'undefined' ||
                !navigator.geolocation
            ) {
                resolve(null);

                return;
            }

            navigator.geolocation.getCurrentPosition(
                (
                    position
                ) => {
                    resolve({
                        latitude:
                            position.coords
                                .latitude,

                        longitude:
                            position.coords
                                .longitude,
                    });
                },

                () => {
                    /*
                     * Si el usuario rechaza la ubicación,
                     * GastroNic simplemente recomienda
                     * sin componente geográfico.
                     */
                    resolve(null);
                },

                {
                    enableHighAccuracy:
                        false,

                    timeout:
                        5000,

                    maximumAge:
                        5 * 60 * 1000,
                }
            );
        }
    );
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function PersonalizedRecommendations() {
    const [
        restaurants,
        setRestaurants,
    ] =
        useState<
            Restaurant[]
        >([]);

    const [
        openStatuses,
        setOpenStatuses,
    ] =
        useState<
            Map<
                string,
                boolean
            >
        >(
            new Map()
        );

    const [
        isLoading,
        setIsLoading,
    ] =
        useState(true);

    const [
        errorMessage,
        setErrorMessage,
    ] =
        useState('');

    const [
        shouldRender,
        setShouldRender,
    ] =
        useState(false);


    const [
        userId,
        setUserId,
    ] =
        useState<
            string | null
        >(null);

    const [
        recommendationFeedback,
        setRecommendationFeedback,
    ] =
        useState<
            Map<
                string,
                RecommendationFeedbackValue
            >
        >(
            new Map()
        );

    const [
        savingFeedbackRestaurantId,
        setSavingFeedbackRestaurantId,
    ] =
        useState<
            string | null
        >(null);

    const [
        feedbackError,
        setFeedbackError,
    ] =
        useState('');

    /* ======================================================== */
    /* LOAD                                                     */
    /* ======================================================== */

    useEffect(() => {
        let cancelled =
            false;

        async function loadRecommendations() {
            setIsLoading(
                true
            );

            setErrorMessage(
                ''
            );

            /* ====================================================== */
            /* SESSION                                                */
            /* ====================================================== */

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
                    'Error obteniendo sesión para recomendaciones:',
                    sessionError
                );

                setIsLoading(
                    false
                );

                return;
            }

            /*
             * Home puede existir sin usuario.
             * En ese caso simplemente no mostramos esta sección.
             */
            if (
                !session?.user
            ) {
                setShouldRender(
                    false
                );

                setIsLoading(
                    false
                );

                return;
            }


            setUserId(
                session.user.id
            );

            /* ====================================================== */
            /* PERSONALIZATION SETTINGS                               */
            /* ====================================================== */

            const {
                data:
                settingsData,

                error:
                settingsError,
            } =
                await supabase
                    .from(
                        'user_settings'
                    )
                    .select(`
            personalization_enabled,
            location_personalization_enabled
          `)
                    .eq(
                        'user_id',
                        session.user.id
                    )
                    .maybeSingle();

            if (
                cancelled
            ) {
                return;
            }

            if (
                settingsError
            ) {
                console.error(
                    'Error cargando configuración de personalización:',
                    settingsError
                );

                setErrorMessage(
                    'No pudimos cargar tus recomendaciones en este momento.'
                );

                setShouldRender(
                    true
                );

                setIsLoading(
                    false
                );

                return;
            }

            const settings =
                settingsData as
                | UserSettingsRow
                | null;

            /*
             * El usuario manda.
             *
             * Si desactiva personalización,
             * GastroNic no ejecuta el motor.
             */
            if (
                settings
                    ?.personalization_enabled ===
                false
            ) {
                setShouldRender(
                    false
                );

                setIsLoading(
                    false
                );

                return;
            }

            setShouldRender(
                true
            );

            /* ====================================================== */
            /* LOCATION                                               */
            /* ====================================================== */

            let latitude:
                | number
                | null =
                null;

            let longitude:
                | number
                | null =
                null;

            if (
                settings
                    ?.location_personalization_enabled ===
                true
            ) {
                const coordinates =
                    await getCurrentCoordinates();

                if (
                    cancelled
                ) {
                    return;
                }

                if (
                    coordinates
                ) {
                    latitude =
                        coordinates.latitude;

                    longitude =
                        coordinates.longitude;
                }
            }

            /* ====================================================== */
            /* RECOMMENDATION ENGINE                                  */
            /* ====================================================== */

            const {
                data:
                recommendationData,

                error:
                recommendationError,
            } =
                await supabase.rpc(
                    'get_personalized_restaurants_v2',
                    {
                        p_latitude:
                            latitude,

                        p_longitude:
                            longitude,

                        p_limit:
                            12,
                    }
                );

            if (
                cancelled
            ) {
                return;
            }

            if (
                recommendationError
            ) {
                console.error(
                    'Error cargando recomendaciones V2:',
                    recommendationError
                );

                setErrorMessage(
                    'No pudimos preparar tus recomendaciones.'
                );

                setRestaurants(
                    []
                );

                setOpenStatuses(
                    new Map()
                );

                setIsLoading(
                    false
                );

                return;
            }

            const recommendationRows =
                (
                    recommendationData ??
                    []
                ) as RecommendationRow[];

            if (
                recommendationRows.length ===
                0
            ) {
                setRestaurants(
                    []
                );

                setOpenStatuses(
                    new Map()
                );

                setRecommendationFeedback(
                    new Map()
                );

                setIsLoading(
                    false
                );

                return;
            }

            /* ====================================================== */
            /* CURRENT RECOMMENDATION FEEDBACK                        */
            /* ====================================================== */

            const candidateRestaurantIds =
                recommendationRows.map(
                    (
                        item
                    ) =>
                        item.restaurant_id
                );

            const {
                data:
                feedbackData,

                error:
                feedbackLoadError,
            } =
                await supabase
                    .from(
                        'recommendation_feedback'
                    )
                    .select(`
            restaurant_id,
            feedback
          `)
                    .eq(
                        'user_id',
                        session.user.id
                    )
                    .in(
                        'restaurant_id',
                        candidateRestaurantIds
                    );

            if (
                cancelled
            ) {
                return;
            }

            if (
                feedbackLoadError
            ) {
                console.error(
                    'Error cargando feedback de recomendaciones:',
                    feedbackLoadError
                );
            }

            const feedbackRows =
                (
                    feedbackData ??
                    []
                ) as RecommendationFeedbackRow[];

            const nextRecommendationFeedback =
                new Map<
                    string,
                    RecommendationFeedbackValue
                >(
                    feedbackRows.map(
                        (
                            item
                        ) => [
                                item.restaurant_id,
                                item.feedback,
                            ]
                    )
                );

            setRecommendationFeedback(
                nextRecommendationFeedback
            );

            /*
             * "No es para mí" reduce el score en SQL,
             * pero además evitamos mostrarlo dentro del bloque
             * personalizado actual.
             *
             * Esto NO lo elimina de búsqueda ni de Explorar.
             */
            const visibleRecommendationRows =
                recommendationRows
                    .filter(
                        (
                            item
                        ) => {
                            const feedback =
                                nextRecommendationFeedback.get(
                                    item.restaurant_id
                                );

                            return (
                                feedback !==
                                'not_interested' &&
                                feedback !==
                                'hide'
                            );
                        }
                    )
                    .slice(
                        0,
                        6
                    );

            if (
                visibleRecommendationRows.length ===
                0
            ) {
                setRestaurants(
                    []
                );

                setOpenStatuses(
                    new Map()
                );

                setIsLoading(
                    false
                );

                return;
            }

            const restaurantIds =
                visibleRecommendationRows.map(
                    (
                        item
                    ) =>
                        item.restaurant_id
                );

            /* ====================================================== */
            /* VISUAL RESTAURANT DATA                                 */
            /* ====================================================== */

            const {
                data:
                restaurantData,

                error:
                restaurantError,
            } =
                await supabase
                    .from(
                        'restaurants'
                    )
                    .select(`
            id,
            name,
            municipality_id,

            average_rating,
            reviews_count,

            price_level,
            estimated_price_min,
            estimated_price_max,

            is_verified,
            is_featured,

            images:restaurant_images (
              kind,
              external_url,
              storage_path,
              sort_order
            ),

            categories:restaurant_categories (
              category_id,

              category:categories (
                id,
                name,
                slug
              )
            ),

            municipality:municipalities (
              id,
              name,

              department:departments (
                name
              )
            )
          `)
                    .eq(
                        'status',
                        'approved'
                    )
                    .in(
                        'id',
                        restaurantIds
                    );

            if (
                cancelled
            ) {
                return;
            }

            if (
                restaurantError
            ) {
                console.error(
                    'Error cargando información visual de recomendaciones:',
                    restaurantError
                );

                setErrorMessage(
                    'No pudimos cargar los restaurantes recomendados.'
                );

                setRestaurants(
                    []
                );

                setIsLoading(
                    false
                );

                return;
            }

            const loadedRestaurants =
                (
                    restaurantData ??
                    []
                ) as unknown as Restaurant[];

            const restaurantById =
                new Map<
                    string,
                    Restaurant
                >(
                    loadedRestaurants.map(
                        (
                            restaurant
                        ) => [
                                restaurant.id,
                                restaurant,
                            ]
                    )
                );

            /*
             * IMPORTANTE:
             *
             * PostgREST con .in()
             * no garantiza el orden del RPC.
             *
             * Reconstruimos el array siguiendo
             * exactamente el ranking calculado
             * por GastroNic.
             */
            const orderedRestaurants: Restaurant[] =
                visibleRecommendationRows.flatMap(
                    (
                        recommendation
                    ) => {
                        const restaurant =
                            restaurantById.get(
                                recommendation.restaurant_id
                            );

                        if (
                            !restaurant
                        ) {
                            return [];
                        }

                        const personalizedRestaurant: Restaurant =
                        {
                            ...restaurant,

                            recommendation_reasons:
                                recommendation.reasons ??
                                [],

                            recommendation_distance_km:
                                toNullableNumber(
                                    recommendation.distance_km
                                ),
                        };

                        return [
                            personalizedRestaurant,
                        ];
                    }
                );
            /* ====================================================== */
            /* OPEN STATUS                                            */
            /* ====================================================== */

            let nextOpenStatuses =
                new Map<
                    string,
                    boolean
                >();

            if (
                orderedRestaurants.length >
                0
            ) {
                const {
                    data:
                    openStatusData,

                    error:
                    openStatusError,
                } =
                    await supabase.rpc(
                        'get_restaurants_open_status',
                        {
                            p_restaurant_ids:
                                orderedRestaurants.map(
                                    (
                                        restaurant
                                    ) =>
                                        restaurant.id
                                ),
                        }
                    );

                if (
                    cancelled
                ) {
                    return;
                }

                if (
                    openStatusError
                ) {
                    /*
                     * Un problema de horarios
                     * no debe tumbar recomendaciones.
                     */
                    console.error(
                        'Error consultando horarios de recomendaciones:',
                        openStatusError
                    );
                } else {
                    const rows =
                        (
                            openStatusData ??
                            []
                        ) as OpenStatusRow[];

                    nextOpenStatuses =
                        new Map<
                            string,
                            boolean
                        >(
                            rows.map(
                                (
                                    item
                                ) => [
                                        item.restaurant_id,

                                        Boolean(
                                            item.is_open
                                        ),
                                    ]
                            )
                        );
                }
            }

            if (
                cancelled
            ) {
                return;
            }

            setRestaurants(
                orderedRestaurants
            );

            setOpenStatuses(
                nextOpenStatuses
            );

            setIsLoading(
                false
            );
        }

        loadRecommendations();

        return () => {
            cancelled =
                true;
        };
    }, []);

    /* ======================================================== */
    /* RECOMMENDATION FEEDBACK                                  */
    /* ======================================================== */

    async function handleRecommendationFeedback(
        restaurantId: string,
        feedback:
        | 'interested'
        | 'not_interested'
    ) {
        if (
            !userId ||
            savingFeedbackRestaurantId
        ) {
            return;
        }

        setFeedbackError(
            ''
        );

        setSavingFeedbackRestaurantId(
            restaurantId
        );

        const {
            error,
        } =
            await supabase
                .from(
                    'recommendation_feedback'
                )
                .upsert(
                    {
                        user_id:
                            userId,

                        restaurant_id:
                            restaurantId,

                        feedback,
                    },
                    {
                        onConflict:
                            'user_id,restaurant_id',
                    }
                );

        if (
            error
        ) {
            console.error(
                'Error guardando feedback de recomendación:',
                error
            );

            setFeedbackError(
                'No pudimos guardar tu respuesta. Intenta nuevamente.'
            );

            setSavingFeedbackRestaurantId(
                null
            );

            return;
        }

        setRecommendationFeedback(
            (
                current
            ) => {
                const next =
                    new Map(
                        current
                    );

                next.set(
                    restaurantId,
                    feedback
                );

                return next;
            }
        );

        if (
            feedback ===
            'not_interested'
        ) {
            /*
             * Respuesta inmediata en UI.
             *
             * La fila permanece disponible en búsqueda/Explorar,
             * pero deja de mostrarse en este bloque personalizado.
             */
            setRestaurants(
                (
                    current
                ) =>
                    current.filter(
                        (
                            restaurant
                        ) =>
                            restaurant.id !==
                            restaurantId
                    )
            );

            setOpenStatuses(
                (
                    current
                ) => {
                    const next =
                        new Map(
                            current
                        );

                    next.delete(
                        restaurantId
                    );

                    return next;
                }
            );
        } else {
            /*
             * Mostramos inmediatamente una explicación
             * coherente con la señal guardada.
             */
            setRestaurants(
                (
                    current
                ) =>
                    current.map(
                        (
                            restaurant
                        ) => {
                            if (
                                restaurant.id !==
                                restaurantId
                            ) {
                                return restaurant;
                            }

                            const reasons =
                                new Set([
                                    ...(
                                        restaurant.recommendation_reasons ??
                                        []
                                    ),
                                    'Te interesó anteriormente',
                                ]);

                            return {
                                ...restaurant,

                                recommendation_reasons:
                                    Array.from(
                                        reasons
                                    ),
                            };
                        }
                    )
            );
        }

        setSavingFeedbackRestaurantId(
            null
        );
    }

    /* ======================================================== */
    /* HIDDEN                                                   */
    /* ======================================================== */

    if (
        !isLoading &&
        !shouldRender
    ) {
        return null;
    }

    /* ======================================================== */
    /* LOADING                                                  */
    /* ======================================================== */

    if (
        isLoading
    ) {
        return (
            <section className="border-b border-border/60 bg-[#F2F8F7] py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-7">
                        <div className="h-4 w-36 animate-pulse rounded-full bg-primary/10" />

                        <div className="mt-4 h-8 w-72 max-w-full animate-pulse rounded-xl bg-muted" />

                        <div className="mt-3 h-4 w-[420px] max-w-full animate-pulse rounded-full bg-muted" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {[
                            1,
                            2,
                            3,
                        ].map(
                            (
                                item
                            ) => (
                                <div
                                    key={
                                        item
                                    }
                                    className="overflow-hidden rounded-card border border-border/60 bg-white"
                                >
                                    <div className="aspect-[4/3] animate-pulse bg-muted" />

                                    <div className="p-5">
                                        <div className="h-5 w-2/3 animate-pulse rounded-lg bg-muted" />

                                        <div className="mt-3 h-3 w-1/2 animate-pulse rounded-lg bg-muted" />

                                        <div className="mt-5 h-3 w-4/5 animate-pulse rounded-lg bg-muted" />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </section>
        );
    }

    /* ======================================================== */
    /* ERROR                                                    */
    /* ======================================================== */

    if (
        errorMessage
    ) {
        return (
            <section className="border-b border-border/60 bg-canvas py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-5">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-danger-soft">
                            <AlertCircle className="h-5 w-5 text-danger" />
                        </div>

                        <div>
                            <p className="font-bold text-ink">
                                Recomendaciones no disponibles
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {errorMessage}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    /* ======================================================== */
    /* EMPTY                                                    */
    /* ======================================================== */

    if (
        restaurants.length ===
        0
    ) {
        return null;
    }

    /* ======================================================== */
    /* NORMAL                                                   */
    /* ======================================================== */

    return (
        <section
            id="para-ti"
            className="border-b border-border/60 bg-[#F2F8F7] py-10 sm:py-14 md:py-16"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-7 flex flex-col gap-4 sm:mb-9 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-2.5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-action sm:text-xs">
                            <Sparkles className="h-3.5 w-3.5" />

                            Recomendado para ti
                        </div>

                        <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink sm:text-4xl">
                            Lugares que tienen sentido
                            {' '}

                            <span className="text-action">
                                para ti.
                            </span>
                        </h2>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                            GastroNic combina tus gustos, favoritos, visitas, presupuesto y actividad para ayudarte a descubrir lugares relevantes.
                        </p>
                    </div>

                    <div className="hidden max-w-xs rounded-2xl border border-primary/10 bg-white/70 px-4 py-3 text-xs leading-5 text-muted-foreground shadow-sm backdrop-blur lg:block">
                        Tus recomendaciones cambian conforme exploras GastroNic.
                    </div>
                </div>

                {feedbackError && (
                    <div
                        role="alert"
                        className="mb-5 rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
                    >
                        {feedbackError}
                    </div>
                )}

                <RestaurantCards
                    restaurants={
                        restaurants
                    }
                    openStatuses={
                        openStatuses
                    }
                    recommendationFeedback={
                        recommendationFeedback
                    }
                    savingFeedbackRestaurantId={
                        savingFeedbackRestaurantId
                    }
                    onRecommendationFeedback={
                        handleRecommendationFeedback
                    }
                />
            </div>
        </section>
    );
}