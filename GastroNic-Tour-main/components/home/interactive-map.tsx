

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AlertCircle,
  LoaderCircle,
  MapPin,
  Navigation,
  Star,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

const supabase =
  createClient();

const SOURCE_ID =
  'gastronic-restaurants';

const CLUSTERS_LAYER_ID =
  'gastronic-clusters';

const CLUSTER_COUNT_LAYER_ID =
  'gastronic-cluster-count';

const RESTAURANT_LAYER_ID =
  'gastronic-restaurant-points';

const NICARAGUA_CENTER: [
  number,
  number,
] = [
  -85.0,
  12.8,
];

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface MapRestaurant {
  restaurant_id: string;
  name: string;

  slug:
    | string
    | null;

  short_description:
    | string
    | null;

  address:
    | string
    | null;

  municipality_id:
    | number
    | null;

  municipality_name:
    | string
    | null;

  latitude: number;
  longitude: number;

  average_rating:
    | number
    | string
    | null;

  reviews_count:
    | number
    | null;

  price_level:
    | number
    | null;

  estimated_price_min:
    | number
    | string
    | null;

  estimated_price_max:
    | number
    | string
    | null;

  accepts_reservations: boolean;
  is_verified: boolean;
  is_featured: boolean;

  image_url:
    | string
    | null;

  is_open_now:
    | boolean
    | null;
}

interface RestaurantImageRow {
  restaurant_id: string;

  kind:
    | string
    | null;

  external_url:
    | string
    | null;

  storage_path:
    | string
    | null;

  sort_order:
    | number
    | null;
}

interface OpenStatusRow {
  restaurant_id: string;
  is_open: boolean;
}

interface RemovableMapboxObject {
  remove: () => void;
}

interface ClusterGeoJSONSource {
  getClusterExpansionZoom: (
    clusterId: number,
    callback: (
      error:
        | Error
        | null
        | undefined,
      zoom?:
        | number
        | null
    ) => void
  ) => unknown;
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
    value === undefined
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

function formatPrice(
  restaurant:
    MapRestaurant
) {
  const min =
    toNumber(
      restaurant
        .estimated_price_min
    );

  const max =
    toNumber(
      restaurant
        .estimated_price_max
    );

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

  if (
    max !== null
  ) {
    return `Hasta C$${max.toLocaleString(
      'es-NI'
    )}`;
  }

  if (
    restaurant.price_level
  ) {
    return 'C$'.repeat(
      Math.min(
        Math.max(
          restaurant.price_level,
          1
        ),
        4
      )
    );
  }

  return 'Precio no indicado';
}

function resolveImageUrl(
  image:
    RestaurantImageRow
) {
  if (
    image.external_url
  ) {
    return image.external_url;
  }

  if (
    image.storage_path
  ) {
    const {
      data,
    } =
      supabase.storage
        .from(
          'restaurant-images'
        )
        .getPublicUrl(
          image.storage_path
        );

    return (
      data.publicUrl ||
      null
    );
  }

  return null;
}

function chooseRestaurantImage(
  images:
    RestaurantImageRow[]
) {
  if (
    images.length ===
    0
  ) {
    return null;
  }

  const ordered =
    [
      ...images,
    ].sort(
      (
        a,
        b
      ) =>
        (
          a.sort_order ??
          0
        ) -
        (
          b.sort_order ??
          0
        )
    );

  const cover =
    ordered.find(
      (
        image
      ) =>
        image.kind ===
        'cover'
    ) ??
    ordered[0];

  return cover
    ? resolveImageUrl(
        cover
      )
    : null;
}

function createBadge(
  label: string,
  options?: {
    background?: string;
    color?: string;
    border?: string;
  }
) {
  const badge =
    document.createElement(
      'span'
    );

  badge.textContent =
    label;

  badge.style.display =
    'inline-flex';

  badge.style.alignItems =
    'center';

  badge.style.minHeight =
    '25px';

  badge.style.padding =
    '4px 8px';

  badge.style.borderRadius =
    '999px';

  badge.style.fontSize =
    '10px';

  badge.style.fontWeight =
    '800';

  badge.style.lineHeight =
    '1';

  badge.style.whiteSpace =
    'nowrap';

  badge.style.background =
    options?.background ??
    '#F1F5F9';

  badge.style.color =
    options?.color ??
    '#475569';

  if (
    options?.border
  ) {
    badge.style.border =
      options.border;
  }

  return badge;
}

function createPopupContent(
  restaurant:
    MapRestaurant
) {
  const root =
    document.createElement(
      'article'
    );

  root.style.width =
    '286px';

  root.style.maxWidth =
    'calc(100vw - 48px)';

  root.style.overflow =
    'hidden';

  root.style.borderRadius =
    '18px';

  root.style.background =
    '#FFFFFF';

  root.style.boxShadow =
    '0 18px 50px rgba(15, 23, 42, 0.18)';

  root.style.fontFamily =
    'var(--font-poppins), Inter, Arial, sans-serif';

  const imageWrap =
    document.createElement(
      'div'
    );

  imageWrap.style.position =
    'relative';

  imageWrap.style.height =
    '126px';

  imageWrap.style.background =
    'linear-gradient(135deg, #DFF4F1 0%, #F8EDC9 100%)';

  imageWrap.style.overflow =
    'hidden';

  if (
    restaurant.image_url
  ) {
    const image =
      document.createElement(
        'img'
      );

    image.src =
      restaurant.image_url;

    image.alt =
      restaurant.name;

    image.loading =
      'lazy';

    image.style.width =
      '100%';

    image.style.height =
      '100%';

    image.style.objectFit =
      'cover';

    imageWrap.appendChild(
      image
    );
  } else {
    const fallback =
      document.createElement(
        'div'
      );

    fallback.textContent =
      'GastroNic';

    fallback.style.display =
      'flex';

    fallback.style.alignItems =
      'center';

    fallback.style.justifyContent =
      'center';

    fallback.style.width =
      '100%';

    fallback.style.height =
      '100%';

    fallback.style.fontSize =
      '14px';

    fallback.style.fontWeight =
      '800';

    fallback.style.letterSpacing =
      '0.08em';

    fallback.style.textTransform =
      'uppercase';

    fallback.style.color =
      '#167C7B';

    imageWrap.appendChild(
      fallback
    );
  }

  if (
    restaurant.is_verified
  ) {
    const verified =
      createBadge(
        '✓ Verificado',
        {
          background:
            'rgba(255,255,255,0.94)',
          color:
            '#167C7B',
          border:
            '1px solid rgba(255,255,255,0.85)',
        }
      );

    verified.style.position =
      'absolute';

    verified.style.left =
      '10px';

    verified.style.top =
      '10px';

    verified.style.boxShadow =
      '0 5px 15px rgba(15,23,42,0.10)';

    imageWrap.appendChild(
      verified
    );
  }

  root.appendChild(
    imageWrap
  );

  const content =
    document.createElement(
      'div'
    );

  content.style.padding =
    '14px';

  const eyebrow =
    document.createElement(
      'p'
    );

  eyebrow.textContent =
    restaurant.is_featured
      ? 'GastroNic · Destacado'
      : 'GastroNic';

  eyebrow.style.margin =
    '0';

  eyebrow.style.fontSize =
    '9px';

  eyebrow.style.fontWeight =
    '800';

  eyebrow.style.letterSpacing =
    '0.13em';

  eyebrow.style.textTransform =
    'uppercase';

  eyebrow.style.color =
    '#1CA7A6';

  const title =
    document.createElement(
      'h3'
    );

  title.textContent =
    restaurant.name;

  title.style.margin =
    '5px 0 0';

  title.style.fontSize =
    '17px';

  title.style.lineHeight =
    '1.25';

  title.style.fontWeight =
    '800';

  title.style.letterSpacing =
    '-0.02em';

  title.style.color =
    '#102A2A';

  const location =
    document.createElement(
      'p'
    );

  location.textContent =
    [
      restaurant
        .municipality_name,
      restaurant.address,
    ]
      .filter(Boolean)
      .join(' · ') ||
    'Ubicación disponible';

  location.style.margin =
    '7px 0 0';

  location.style.fontSize =
    '10.5px';

  location.style.lineHeight =
    '1.5';

  location.style.color =
    '#64748B';

  content.appendChild(
    eyebrow
  );

  content.appendChild(
    title
  );

  content.appendChild(
    location
  );

  const badges =
    document.createElement(
      'div'
    );

  badges.style.display =
    'flex';

  badges.style.flexWrap =
    'wrap';

  badges.style.gap =
    '6px';

  badges.style.marginTop =
    '11px';

  if (
    restaurant.is_open_now ===
    true
  ) {
    badges.appendChild(
      createBadge(
        '● Abierto ahora',
        {
          background:
            '#ECFDF5',
          color:
            '#047857',
        }
      )
    );
  } else if (
    restaurant.is_open_now ===
    false
  ) {
    badges.appendChild(
      createBadge(
        '● Cerrado',
        {
          background:
            '#FEF2F2',
          color:
            '#B91C1C',
        }
      )
    );
  }

  const ratingValue =
    toNumber(
      restaurant.average_rating
    );

  if (
    ratingValue !== null &&
    ratingValue >
      0
  ) {
    const reviews =
      restaurant.reviews_count ??
      0;

    badges.appendChild(
      createBadge(
        `★ ${ratingValue.toFixed(
          1
        )} · ${reviews} reseña${
          reviews === 1
            ? ''
            : 's'
        }`,
        {
          background:
            '#FFF8DD',
          color:
            '#7A5B00',
        }
      )
    );
  }

  badges.appendChild(
    createBadge(
      formatPrice(
        restaurant
      ),
      {
        background:
          '#EEF8F6',
        color:
          '#167C7B',
      }
    )
  );

  if (
    restaurant
      .accepts_reservations
  ) {
    badges.appendChild(
      createBadge(
        'Reservaciones',
        {
          background:
            '#F1F5F9',
          color:
            '#475569',
        }
      )
    );
  }

  content.appendChild(
    badges
  );

  if (
    restaurant
      .short_description
  ) {
    const description =
      document.createElement(
        'p'
      );

    description.textContent =
      restaurant
        .short_description;

    description.style.margin =
      '12px 0 0';

    description.style.paddingTop =
      '11px';

    description.style.borderTop =
      '1px solid #EEF2F3';

    description.style.fontSize =
      '10.5px';

    description.style.lineHeight =
      '1.55';

    description.style.color =
      '#475569';

    content.appendChild(
      description
    );
  }

  const actions =
    document.createElement(
      'div'
    );

  actions.style.marginTop =
    '14px';

  actions.style.paddingTop =
    '12px';

  actions.style.borderTop =
    '1px solid #EEF2F3';

  const detailsLink =
    document.createElement(
      'a'
    );

  detailsLink.href =
    `/restaurant/${restaurant.restaurant_id}`;

  detailsLink.textContent =
    'Ver restaurante';

  detailsLink.setAttribute(
    'aria-label',
    `Ver detalles de ${restaurant.name}`
  );

  detailsLink.style.display =
    'flex';

  detailsLink.style.alignItems =
    'center';

  detailsLink.style.justifyContent =
    'center';

  detailsLink.style.width =
    '100%';

  detailsLink.style.minHeight =
    '42px';

  detailsLink.style.padding =
    '10px 14px';

  detailsLink.style.borderRadius =
    '12px';

  detailsLink.style.background =
    '#1CA7A6';

  detailsLink.style.color =
    '#FFFFFF';

  detailsLink.style.fontSize =
    '11px';

  detailsLink.style.fontWeight =
    '800';

  detailsLink.style.textDecoration =
    'none';

  detailsLink.style.transition =
    'transform 160ms ease, background 160ms ease';

  detailsLink.addEventListener(
    'mouseenter',
    () => {
      detailsLink.style.background =
        '#168D8C';
    }
  );

  detailsLink.addEventListener(
    'mouseleave',
    () => {
      detailsLink.style.background =
        '#1CA7A6';
    }
  );

  detailsLink.addEventListener(
    'mousedown',
    () => {
      detailsLink.style.transform =
        'scale(0.98)';
    }
  );

  detailsLink.addEventListener(
    'mouseup',
    () => {
      detailsLink.style.transform =
        'scale(1)';
    }
  );

  actions.appendChild(
    detailsLink
  );

  content.appendChild(
    actions
  );

  root.appendChild(
    content
  );

  return root;
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function InteractiveMap() {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const mapRef =
    useRef<RemovableMapboxObject | null>(
      null
    );

  const popupRef =
    useRef<RemovableMapboxObject | null>(
      null
    );

  const [
    restaurants,
    setRestaurants,
  ] =
    useState<
      MapRestaurant[]
    >([]);

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
    mapReady,
    setMapReady,
  ] =
    useState(false);

  useEffect(() => {
    let cancelled =
      false;

    async function initializeMap() {
      setIsLoading(
        true
      );

      setErrorMessage(
        ''
      );

      setMapReady(
        false
      );

      const token =
        process.env
          .NEXT_PUBLIC_MAPBOX_TOKEN;

      if (
        !token
      ) {
        setErrorMessage(
          'Falta configurar NEXT_PUBLIC_MAPBOX_TOKEN.'
        );

        setIsLoading(
          false
        );

        return;
      }

      if (
        !mapContainerRef.current
      ) {
        setErrorMessage(
          'No se pudo preparar el contenedor del mapa.'
        );

        setIsLoading(
          false
        );

        return;
      }

      const {
        data,
        error,
      } =
        await supabase.rpc(
          'get_map_restaurants_v2',
          {
            p_limit:
              500,
          }
        );

      if (
        cancelled
      ) {
        return;
      }

      if (
        error
      ) {
        console.error(
          'Error cargando restaurantes del mapa:',
          error
        );

        setErrorMessage(
          'No pudimos cargar los restaurantes del mapa.'
        );

        setIsLoading(
          false
        );

        return;
      }

      const rawRestaurants =
        (
          data ??
          []
        ) as unknown as Omit<
          MapRestaurant,
          'image_url' |
            'is_open_now'
        >[];

      let loadedRestaurants:
        MapRestaurant[] =
        rawRestaurants
          .filter(
            (
              restaurant
            ) =>
              Number.isFinite(
                Number(
                  restaurant.latitude
                )
              ) &&
              Number.isFinite(
                Number(
                  restaurant.longitude
                )
              )
          )
          .map(
            (
              restaurant
            ): MapRestaurant => ({
              ...restaurant,

              latitude:
                Number(
                  restaurant.latitude
                ),

              longitude:
                Number(
                  restaurant.longitude
                ),

              image_url:
                null,

              is_open_now:
                null,
            })
          );

      const restaurantIds =
        loadedRestaurants.map(
          (
            restaurant
          ) =>
            restaurant.restaurant_id
        );

      if (
        restaurantIds.length >
        0
      ) {
        const [
          imagesResult,
          openStatusResult,
        ] =
          await Promise.all([
            supabase
              .from(
                'restaurant_images'
              )
              .select(`
                restaurant_id,
                kind,
                external_url,
                storage_path,
                sort_order
              `)
              .in(
                'restaurant_id',
                restaurantIds
              ),

            supabase.rpc(
              'get_restaurants_open_status',
              {
                p_restaurant_ids:
                  restaurantIds,
              }
            ),
          ]);

        if (
          cancelled
        ) {
          return;
        }

        const imagesByRestaurant =
          new Map<
            string,
            RestaurantImageRow[]
          >();

        if (
          imagesResult.error
        ) {
          console.warn(
            'No pudimos cargar las imágenes del mapa:',
            imagesResult.error
          );
        } else {
          const imageRows =
            (
              imagesResult.data ??
              []
            ) as unknown as RestaurantImageRow[];

          for (
            const image
            of imageRows
          ) {
            const current =
              imagesByRestaurant.get(
                image.restaurant_id
              ) ??
              [];

            current.push(
              image
            );

            imagesByRestaurant.set(
              image.restaurant_id,
              current
            );
          }
        }

        const openStatusByRestaurant =
          new Map<
            string,
            boolean
          >();

        if (
          openStatusResult.error
        ) {
          console.warn(
            'No pudimos cargar el estado de horarios del mapa:',
            openStatusResult.error
          );
        } else {
          const openRows =
            (
              openStatusResult.data ??
              []
            ) as unknown as OpenStatusRow[];

          for (
            const row
            of openRows
          ) {
            openStatusByRestaurant.set(
              row.restaurant_id,
              Boolean(
                row.is_open
              )
            );
          }
        }

        loadedRestaurants =
          loadedRestaurants.map(
            (
              restaurant
            ): MapRestaurant => ({
              ...restaurant,

              image_url:
                chooseRestaurantImage(
                  imagesByRestaurant.get(
                    restaurant.restaurant_id
                  ) ??
                    []
                ),

              is_open_now:
                openStatusByRestaurant.has(
                  restaurant.restaurant_id
                )
                  ? openStatusByRestaurant.get(
                      restaurant.restaurant_id
                    ) ??
                    null
                  : null,
            })
          );
      }

      setRestaurants(
        loadedRestaurants
      );

      const mapboxgl =
        await import(
          'mapbox-gl'
        );

      if (
        cancelled ||
        !mapContainerRef.current
      ) {
        return;
      }

      const map =
        new mapboxgl.Map({
          accessToken:
            token,

          container:
            mapContainerRef.current,

          style:
            'mapbox://styles/mapbox/standard',

          /*
           * GastroNic DS: mapa claro y sin puntos de interés de
           * Mapbox (incluyen otros restaurantes y compiten con los
           * marcadores de GastroNic). Calles y lugares siguen visibles.
           */
          config: {
            basemap: {
              lightPreset: 'day',
              showPointOfInterestLabels: false,
            },
          },

          center:
            NICARAGUA_CENTER,

          zoom:
            6.4,

          minZoom:
            5,

          maxZoom:
            18,

          attributionControl:
            false,
        });

      mapRef.current =
        map;

      map.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy:
              false,
          },

          trackUserLocation:
            true,

          showUserHeading:
            true,

          showAccuracyCircle:
            true,
        }),
        'top-right'
      );

      map.addControl(
        new mapboxgl.AttributionControl({
          compact:
            true,
        }),
        'bottom-right'
      );

      map.on(
        'error',
        (
          event
        ) => {
          console.error(
            'Mapbox error:',
            event.error
          );
        }
      );

      map.on(
        'load',
        () => {
          if (
            cancelled
          ) {
            return;
          }

          const geojson = {
            type:
              'FeatureCollection' as const,

            features:
              loadedRestaurants.map(
                (
                  restaurant
                ) => ({
                  type:
                    'Feature' as const,

                  geometry: {
                    type:
                      'Point' as const,

                    coordinates: [
                      restaurant.longitude,
                      restaurant.latitude,
                    ],
                  },

                  properties: {
                    restaurant_id:
                      restaurant.restaurant_id,

                    is_verified:
                      restaurant.is_verified,

                    is_featured:
                      restaurant.is_featured,
                  },
                })
              ),
          };

          map.addSource(
            SOURCE_ID,
            {
              type:
                'geojson',

              data:
                geojson,

              cluster:
                true,

              clusterMaxZoom:
                13,

              clusterRadius:
                52,
            }
          );

          map.addLayer({
            id:
              CLUSTERS_LAYER_ID,

            type:
              'circle',

            source:
              SOURCE_ID,

            filter: [
              'has',
              'point_count',
            ],

            paint: {
              'circle-color': [
                'step',
                [
                  'get',
                  'point_count',
                ],
                /* Tonos de la escala turquesa con contraste AA para el número blanco */
                '#147A79',
                10,
                '#126968',
                30,
                '#102A2A',
              ],

              'circle-radius': [
                'step',
                [
                  'get',
                  'point_count',
                ],
                20,
                10,
                25,
                30,
                31,
              ],

              'circle-stroke-width':
                3,

              'circle-stroke-color':
                '#FFFFFF',
            },
          });

          map.addLayer({
            id:
              CLUSTER_COUNT_LAYER_ID,

            type:
              'symbol',

            source:
              SOURCE_ID,

            filter: [
              'has',
              'point_count',
            ],

            layout: {
              'text-field': [
                'get',
                'point_count_abbreviated',
              ],

              'text-size':
                12,
            },

            paint: {
              'text-color':
                '#FFFFFF',
            },
          });

          map.addLayer({
            id:
              RESTAURANT_LAYER_ID,

            type:
              'circle',

            source:
              SOURCE_ID,

            filter: [
              '!',
              [
                'has',
                'point_count',
              ],
            ],

            paint: {
              'circle-color':
                '#1CA7A6',

              'circle-radius': [
                'interpolate',
                [
                  'linear',
                ],
                [
                  'zoom',
                ],
                6,
                6,
                12,
                9,
                16,
                12,
              ],

              'circle-stroke-width': [
                'case',
                [
                  'boolean',
                  [
                    'get',
                    'is_verified',
                  ],
                  false,
                ],
                4,
                3,
              ],

              'circle-stroke-color': [
                'case',
                [
                  'boolean',
                  [
                    'get',
                    'is_verified',
                  ],
                  false,
                ],
                '#F4B942',
                '#FFFFFF',
              ],
            },
          });

          map.on(
            'click',
            CLUSTERS_LAYER_ID,
            (
              event
            ) => {
              const features =
                map.queryRenderedFeatures(
                  event.point,
                  {
                    layers: [
                      CLUSTERS_LAYER_ID,
                    ],
                  }
                );

              const feature =
                features[0];

              if (
                !feature ||
                feature.geometry.type !==
                  'Point'
              ) {
                return;
              }

              const clusterId =
                Number(
                  feature
                    .properties
                    ?.cluster_id
                );

              if (
                !Number.isFinite(
                  clusterId
                )
              ) {
                return;
              }

              const longitude =
                Number(
                  feature.geometry
                    .coordinates[0]
                );

              const latitude =
                Number(
                  feature.geometry
                    .coordinates[1]
                );

              if (
                !Number.isFinite(
                  longitude
                ) ||
                !Number.isFinite(
                  latitude
                )
              ) {
                return;
              }

              const source =
                map.getSource(
                  SOURCE_ID
                ) as
                  | ClusterGeoJSONSource
                  | undefined;

              if (
                !source
              ) {
                return;
              }

              source.getClusterExpansionZoom(
                clusterId,
                (
                  clusterError,
                  zoom
                ) => {
                  if (
                    clusterError
                  ) {
                    console.error(
                      'Error expandiendo cluster:',
                      clusterError
                    );

                    return;
                  }

                  if (
                    typeof zoom !==
                    'number'
                  ) {
                    return;
                  }

                  map.easeTo({
                    center: [
                      longitude,
                      latitude,
                    ],

                    zoom,
                  });
                }
              );
            }
          );

          map.on(
            'click',
            RESTAURANT_LAYER_ID,
            (
              event
            ) => {
              const feature =
                event.features?.[0];

              if (
                !feature ||
                feature.geometry.type !==
                  'Point'
              ) {
                return;
              }

              const restaurantId =
                String(
                  feature
                    .properties
                    ?.restaurant_id ??
                    ''
                );

              if (
                !restaurantId
              ) {
                return;
              }

              const restaurant =
                loadedRestaurants.find(
                  (
                    item
                  ) =>
                    item.restaurant_id ===
                    restaurantId
                );

              if (
                !restaurant
              ) {
                return;
              }

              const longitude =
                Number(
                  feature.geometry
                    .coordinates[0]
                );

              const latitude =
                Number(
                  feature.geometry
                    .coordinates[1]
                );

              if (
                !Number.isFinite(
                  longitude
                ) ||
                !Number.isFinite(
                  latitude
                )
              ) {
                return;
              }

              popupRef.current?.remove();

              const popup =
                new mapboxgl.Popup({
                  closeButton:
                    true,

                  closeOnClick:
                    true,

                  offset:
                    18,

                  maxWidth:
                    '320px',

                  className:
                    'gastronic-map-popup',
                })
                  .setLngLat([
                    longitude,
                    latitude,
                  ])
                  .setDOMContent(
                    createPopupContent(
                      restaurant
                    )
                  )
                  .addTo(
                    map
                  );

              popupRef.current =
                popup;
            }
          );

          const setPointer =
            () => {
              map.getCanvas().style.cursor =
                'pointer';
            };

          const resetPointer =
            () => {
              map.getCanvas().style.cursor =
                '';
            };

          map.on(
            'mouseenter',
            CLUSTERS_LAYER_ID,
            setPointer
          );

          map.on(
            'mouseleave',
            CLUSTERS_LAYER_ID,
            resetPointer
          );

          map.on(
            'mouseenter',
            RESTAURANT_LAYER_ID,
            setPointer
          );

          map.on(
            'mouseleave',
            RESTAURANT_LAYER_ID,
            resetPointer
          );

          if (
            loadedRestaurants.length >
            0
          ) {
            const bounds =
              new mapboxgl.LngLatBounds();

            for (
              const restaurant
              of loadedRestaurants
            ) {
              bounds.extend([
                restaurant.longitude,
                restaurant.latitude,
              ]);
            }

            map.fitBounds(
              bounds,
              {
                padding: {
                  top:
                    70,

                  right:
                    60,

                  bottom:
                    70,

                  left:
                    60,
                },

                maxZoom:
                  13,

                duration:
                  900,
              }
            );
          }

          setMapReady(
            true
          );

          setIsLoading(
            false
          );
        }
      );
    }

    initializeMap();

    return () => {
      cancelled =
        true;

      popupRef.current?.remove();

      popupRef.current =
        null;

      mapRef.current?.remove();

      mapRef.current =
        null;
    };
  }, []);

  return (
    <div className="relative h-[470px] w-full overflow-hidden bg-[#EAF3F1] sm:h-[540px] lg:h-[620px]">
      <div
        ref={
          mapContainerRef
        }
        className="h-full w-full"
      />

      <div className="pointer-events-none absolute left-3 top-3 z-10 sm:left-5 sm:top-5">
        <div className="rounded-2xl border border-white/80 bg-white/95 px-3.5 py-3 shadow-raised backdrop-blur-md sm:px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-action text-white shadow-sm">
              <MapPin className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                GastroNic Maps
              </p>

              <p className="text-xs font-bold text-ink sm:text-sm">
                {restaurants.length >
                0
                  ? `${restaurants.length} lugares en el mapa`
                  : 'Explora Nicaragua'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {mapReady &&
        restaurants.length >
          0 && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 sm:bottom-5 sm:left-5">
            <div className="flex items-center gap-3 rounded-full border border-white/80 bg-white/95 px-3 py-2 text-xs font-semibold text-ink shadow-raised backdrop-blur-md">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-action ring-2 ring-white" />
                Restaurante
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-action ring-[3px] ring-[#F4B942]" />
                Verificado
              </span>
            </div>
          </div>
        )}

      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-canvas/90 backdrop-blur-sm">
          <div className="rounded-3xl border border-white bg-white px-6 py-5 text-center shadow-xl">
            <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-action" />

            <p className="mt-3 text-sm font-bold text-ink">
              Preparando el mapa...
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Cargando lugares reales de GastroNic.
            </p>
          </div>
        </div>
      )}

      {!isLoading &&
        errorMessage && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-canvas p-5">
            <div className="max-w-sm rounded-3xl border border-danger/25 bg-white p-6 text-center shadow-xl">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-danger-soft text-red-500">
                <AlertCircle className="h-5 w-5" />
              </div>

              <p className="mt-4 text-sm font-bold text-ink">
                No pudimos abrir el mapa
              </p>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

      {!isLoading &&
        !errorMessage &&
        mapReady &&
        restaurants.length ===
          0 && (
          <div className="pointer-events-none absolute inset-x-4 bottom-5 z-10 mx-auto max-w-sm rounded-2xl border border-white/80 bg-white/95 p-4 text-center shadow-lg backdrop-blur-md">
            <Navigation className="mx-auto h-5 w-5 text-action" />

            <p className="mt-2 text-sm font-bold text-ink">
              Todavía no hay restaurantes geolocalizados
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              El mapa está listo; aparecerán aquí cuando los restaurantes tengan una ubicación guardada.
            </p>
          </div>
        )}

      {mapReady &&
        restaurants.length >
          0 && (
          <div className="pointer-events-none absolute right-3 top-[118px] z-10 hidden rounded-xl border border-white/80 bg-white/95 px-2.5 py-2 text-xs font-semibold text-muted-foreground shadow-md backdrop-blur-md sm:block">
            <div className="flex items-center gap-1.5">
              <Star className="h-3 w-3 text-[#F4B942]" />
              Toca un punto para ver el lugar
            </div>
          </div>
        )}
    </div>
  );
}
