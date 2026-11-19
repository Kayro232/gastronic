'use client';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

/* ============================================================
 * TYPES
 * ========================================================== */

export interface SmartRouteStopRequest {
    id: string;
    label: string;

    /*
     * Si es una categoría exacta.
     * Ejemplo: Café = 2.
     */
    categoryId?: number | null;

    /*
     * Para grupos de categorías.
     * Ejemplo: "Comida principal".
     */
    allowedCategoryIds?: number[];

    /*
     * Minutos después del inicio de la ruta.
     */
    offsetMinutes: number;
}

export interface SmartRouteRequest {
    municipalityId: number;
    partySize: number;
    totalBudget: number | null;

    /*
     * ISO con zona horaria.
     */
    startAt: string;

    requireReservation?: boolean;

    stops: SmartRouteStopRequest[];
}

interface CandidateRow {
    restaurant_id: string;
    name: string;
    slug: string;

    municipality_id: number;

    category_ids: number[];
    category_names: string[];

    estimated_price_min:
    | number
    | string
    | null;

    estimated_price_max:
    | number
    | string
    | null;

    estimated_total_min:
    | number
    | string
    | null;

    estimated_total_max:
    | number
    | string
    | null;

    average_rating:
    | number
    | string
    | null;

    reviews_count: number;

    accepts_reservations: boolean;

    personalization_score:
    | number
    | string
    | null;

    reasons:
    | string[]
    | null;
}

export interface SmartRouteCandidate {
    restaurantId: string;
    name: string;
    slug: string;

    municipalityId: number;

    categoryIds: number[];
    categoryNames: string[];

    estimatedTotalMin: number | null;
    estimatedTotalMax: number | null;

    averageRating: number | null;
    reviewsCount: number;

    acceptsReservations: boolean;

    personalizationScore: number;

    reasons: string[];
}

export interface PlannedSmartStop {
    id: string;
    label: string;

    plannedAt: string;

    restaurant: SmartRouteCandidate;
}

export type BudgetStatus =
    | 'within_budget'
    | 'possible'
    | 'unknown'
    | 'over_budget'
    | 'not_set';

export interface SmartRoutePlan {
    stops: PlannedSmartStop[];

    missingStops: SmartRouteStopRequest[];

    estimatedTotalMin: number | null;
    estimatedTotalMax: number | null;

    hasUnknownPrices: boolean;

    budgetStatus: BudgetStatus;

    score: number;
}

/* ============================================================
 * CATEGORY GROUPS
 * ========================================================== */

export const SMART_ROUTE_CATEGORY_GROUPS = {
    cafe: [2],

    mainMeal: [
        1,  // Comida típica
        3,  // Mariscos
        4,  // Asados
        5,  // Comida rápida
        6,  // Italiana
        7,  // Mexicana
        8,  // Vegetariana
        11, // Internacional
    ],

    sweet: [
        9,  // Postres
        10, // Helados
    ],

    nightlife: [
        12, // Bar y lounge
    ],
};

/* ============================================================
 * DEFAULT TEMPLATE
 * ========================================================== */

export const AFTERNOON_ROUTE_TEMPLATE:
    SmartRouteStopRequest[] = [
        {
            id: 'cafe',
            label: 'Café',
            categoryId: 2,
            offsetMinutes: 0,
        },

        {
            id: 'main-meal',
            label: 'Comida',
            categoryId: null,
            allowedCategoryIds:
                SMART_ROUTE_CATEGORY_GROUPS.mainMeal,
            offsetMinutes: 90,
        },

        {
            id: 'dessert',
            label: 'Postre',
            categoryId: null,
            allowedCategoryIds:
                SMART_ROUTE_CATEGORY_GROUPS.sweet,
            offsetMinutes: 180,
        },
    ];

/* ============================================================
 * HELPERS
 * ========================================================== */

function toNullableNumber(
    value:
        | number
        | string
        | null
        | undefined,
) {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const numberValue = Number(value);

    return Number.isFinite(numberValue)
        ? numberValue
        : null;
}

function addMinutes(
    isoDate: string,
    minutes: number,
) {
    const date = new Date(isoDate);

    date.setMinutes(
        date.getMinutes() + minutes,
    );

    return date.toISOString();
}

function normalizeCandidate(
    row: CandidateRow,
): SmartRouteCandidate {
    return {
        restaurantId:
            row.restaurant_id,

        name:
            row.name,

        slug:
            row.slug,

        municipalityId:
            row.municipality_id,

        categoryIds:
            row.category_ids ?? [],

        categoryNames:
            row.category_names ?? [],

        estimatedTotalMin:
            toNullableNumber(
                row.estimated_total_min,
            ),

        estimatedTotalMax:
            toNullableNumber(
                row.estimated_total_max,
            ),

        averageRating:
            toNullableNumber(
                row.average_rating,
            ),

        reviewsCount:
            row.reviews_count ?? 0,

        acceptsReservations:
            row.accepts_reservations,

        personalizationScore:
            toNullableNumber(
                row.personalization_score,
            ) ?? 0,

        /*
         * No confiamos todavía en la razón
         * automática del presupuesto cuando
         * no existen precios.
         */
        reasons:
            (row.reasons ?? []).filter(
                (reason) =>
                    reason !==
                    'Puede encajar dentro del presupuesto de la ruta' ||
                    row.estimated_total_min !== null ||
                    row.estimated_total_max !== null,
            ),
    };
}

function matchesStopGroup(
    candidate: SmartRouteCandidate,
    stop: SmartRouteStopRequest,
) {
    if (
        !stop.allowedCategoryIds ||
        stop.allowedCategoryIds.length === 0
    ) {
        return true;
    }

    return candidate.categoryIds.some(
        (categoryId) =>
            stop.allowedCategoryIds?.includes(
                categoryId,
            ),
    );
}

/* ============================================================
 * LOAD CANDIDATES FOR ONE STOP
 * ========================================================== */

async function loadStopCandidates(
    request: SmartRouteRequest,
    stop: SmartRouteStopRequest,
) {
    const plannedAt = addMinutes(
        request.startAt,
        stop.offsetMinutes,
    );

    const categoryIds =
        stop.categoryId !== null &&
            stop.categoryId !== undefined
            ? [stop.categoryId]
            : stop.allowedCategoryIds?.length
                ? stop.allowedCategoryIds
                : [null];

    const results = await Promise.all(
        categoryIds.map(async (categoryId) => {
            const { data, error } =
                await supabase.rpc(
                    'get_smart_route_candidates_v1',
                    {
                        p_municipality_id:
                            request.municipalityId,

                        p_category_id:
                            categoryId,

                        p_party_size:
                            Math.max(
                                request.partySize,
                                1,
                            ),

                        p_planned_at:
                            plannedAt,

                        p_total_budget:
                            request.totalBudget,

                        p_require_reservation:
                            request.requireReservation ??
                            false,

                        p_limit:
                            20,
                    },
                );

            if (error) {
                throw new Error(
                    `No se pudieron cargar candidatos para ${stop.label}: ${error.message}`,
                );
            }

            return (
                (data ?? []) as CandidateRow[]
            ).map(normalizeCandidate);
        }),
    );

    /*
     * Un restaurante puede pertenecer a varias
     * categorías. Lo dejamos una sola vez.
     */
    const candidateMap =
        new Map<
            string,
            SmartRouteCandidate
        >();

    for (const candidate of results.flat()) {
        const existing =
            candidateMap.get(
                candidate.restaurantId,
            );

        if (
            !existing ||
            candidate.personalizationScore >
            existing.personalizationScore
        ) {
            candidateMap.set(
                candidate.restaurantId,
                candidate,
            );
        }
    }

    const candidates =
        Array.from(
            candidateMap.values(),
        )
            .filter((candidate) =>
                matchesStopGroup(
                    candidate,
                    stop,
                ),
            )
            .sort((a, b) => {
                if (
                    b.personalizationScore !==
                    a.personalizationScore
                ) {
                    return (
                        b.personalizationScore -
                        a.personalizationScore
                    );
                }

                return (
                    (b.averageRating ?? 0) -
                    (a.averageRating ?? 0)
                );
            });

    return {
        stop,
        plannedAt,
        candidates,
    };
}

/* ============================================================
 * BUILD COMBINATIONS
 * ========================================================== */

function createCombinations(
    stopGroups: Awaited<
        ReturnType<
            typeof loadStopCandidates
        >
    >[],
) {
    const results:
        PlannedSmartStop[][] = [];

    function walk(
        index: number,
        current:
            PlannedSmartStop[],
        usedRestaurants:
            Set<string>,
    ) {
        if (
            index >= stopGroups.length
        ) {
            results.push(
                [...current],
            );

            return;
        }

        const group =
            stopGroups[index];

        /*
         * Si esta parada no tiene candidatos,
         * la saltamos.
         *
         * Así la ruta puede degradarse
         * elegantemente con una BD pequeña.
         */
        if (
            group.candidates.length === 0
        ) {
            walk(
                index + 1,
                current,
                usedRestaurants,
            );

            return;
        }

        for (
            const candidate
            of group.candidates
        ) {
            /*
             * No repetimos el mismo restaurante
             * dos veces en una ruta.
             */
            if (
                usedRestaurants.has(
                    candidate.restaurantId,
                )
            ) {
                continue;
            }

            usedRestaurants.add(
                candidate.restaurantId,
            );

            current.push({
                id:
                    group.stop.id,

                label:
                    group.stop.label,

                plannedAt:
                    group.plannedAt,

                restaurant:
                    candidate,
            });

            walk(
                index + 1,
                current,
                usedRestaurants,
            );

            current.pop();

            usedRestaurants.delete(
                candidate.restaurantId,
            );
        }
    }

    walk(
        0,
        [],
        new Set(),
    );

    return results;
}

/* ============================================================
 * EVALUATE ONE ROUTE
 * ========================================================== */

function evaluateCombination(
    stops: PlannedSmartStop[],
    request: SmartRouteRequest,
    missingStops:
        SmartRouteStopRequest[],
): SmartRoutePlan {

    let totalMin = 0;
    let totalMax = 0;

    let knownMinCount = 0;
    let knownMaxCount = 0;

    let hasUnknownPrices =
        false;

    let score = 0;

    for (
        const stop
        of stops
    ) {
        const candidate =
            stop.restaurant;

        if (
            candidate.estimatedTotalMin !==
            null
        ) {
            totalMin +=
                candidate.estimatedTotalMin;

            knownMinCount++;
        }

        if (
            candidate.estimatedTotalMax !==
            null
        ) {
            totalMax +=
                candidate.estimatedTotalMax;

            knownMaxCount++;
        }

        if (
            candidate.estimatedTotalMin ===
            null &&
            candidate.estimatedTotalMax ===
            null
        ) {
            hasUnknownPrices =
                true;
        }

        /*
         * Personalización principal.
         */
        score +=
            candidate.personalizationScore;

        /*
         * Rating como fallback ligero.
         * Sirve también para usuarios con
         * poco historial.
         */
        score +=
            (
                candidate.averageRating ??
                0
            ) * 2;
    }

    const estimatedTotalMin =
        knownMinCount > 0
            ? totalMin
            : null;

    const estimatedTotalMax =
        knownMaxCount > 0
            ? totalMax
            : null;

    let budgetStatus:
        BudgetStatus =
        'not_set';

    if (
        request.totalBudget !==
        null
    ) {
        if (
            hasUnknownPrices
        ) {
            budgetStatus =
                'unknown';

        } else if (
            estimatedTotalMax !== null &&
            estimatedTotalMax <=
            request.totalBudget
        ) {
            budgetStatus =
                'within_budget';

            score += 25;

        } else if (
            estimatedTotalMin !== null &&
            estimatedTotalMin <=
            request.totalBudget
        ) {
            /*
             * El consumo bajo del rango sí cabe,
             * pero el alto podría superar
             * el presupuesto.
             */
            budgetStatus =
                'possible';

            score += 10;

        } else {
            budgetStatus =
                'over_budget';

            score -= 40;
        }
    }

    /*
     * Penalización pequeña si no pudimos
     * satisfacer todas las paradas.
     */
    score -=
        missingStops.length * 15;

    return {
        stops,

        missingStops,

        estimatedTotalMin,
        estimatedTotalMax,

        hasUnknownPrices,

        budgetStatus,

        score,
    };
}

/* ============================================================
 * MAIN PLANNER
 * ========================================================== */

export async function buildSmartRoutes(
    request: SmartRouteRequest,
): Promise<SmartRoutePlan[]> {

    const stopGroups =
        await Promise.all(
            request.stops.map(
                (stop) =>
                    loadStopCandidates(
                        request,
                        stop,
                    ),
            ),
        );

    const missingStops =
        stopGroups
            .filter(
                (group) =>
                    group.candidates.length ===
                    0,
            )
            .map(
                (group) =>
                    group.stop,
            );

    const combinations =
        createCombinations(
            stopGroups,
        );

    const plans =
        combinations.map(
            (combination) =>
                evaluateCombination(
                    combination,
                    request,
                    missingStops,
                ),
        );

    const budgetPriority:
        Record<
            BudgetStatus,
            number
        > = {
        within_budget: 5,
        possible: 4,
        unknown: 3,
        not_set: 2,
        over_budget: 1,
    };

    return plans
        .sort(
            (a, b) => {
                const budgetDifference =
                    budgetPriority[
                    b.budgetStatus
                    ] -
                    budgetPriority[
                    a.budgetStatus
                    ];

                if (
                    budgetDifference !== 0
                ) {
                    return budgetDifference;
                }

                return (
                    b.score -
                    a.score
                );
            },
        )
        .slice(
            0,
            5,
        );
}