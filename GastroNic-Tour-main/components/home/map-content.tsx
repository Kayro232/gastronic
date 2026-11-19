

import 'leaflet/dist/leaflet.css';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';

import L from 'leaflet';

import {
  AlertCircle,
  LoaderCircle,
  MapPin,
  Star,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface MapRestaurant {
  id: string;
  name: string;
  short_description: string | null;
  average_rating: number | null;
  reviews_count: number | null;
  price_level: number | null;
  latitude: number | null;
  longitude: number | null;
  municipality: string | null;
  department: string | null;
  cover_image: string | null;
}

/* ========================================================== */
/* LEAFLET ICON                                               */
/* ========================================================== */

const customIcon = L.icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -36],
  shadowSize: [41, 41],
});

/* ========================================================== */
/* MAP RESIZE HANDLER                                         */
/* ========================================================== */

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    let timeoutId:
      | ReturnType<typeof setTimeout>
      | undefined;

    function invalidateMapSize() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        try {
          const container =
            map.getContainer();

          const mapPane =
            map.getPane('mapPane');

          /*
           * Leaflet puede estar en proceso de desmontaje
           * durante Fast Refresh de Next.js.
           *
           * Solo actualizamos el tamaño si el mapa
           * todavía tiene su DOM disponible.
           */
          if (
            !container ||
            !container.isConnected ||
            !mapPane
          ) {
            return;
          }

          map.invalidateSize({
            animate: false,
          });
        } catch {
          /*
           * Evitamos errores si Leaflet termina de
           * desmontarse mientras corre el timeout.
           */
        }
      }, 150);
    }

    invalidateMapSize();

    window.addEventListener(
      'resize',
      invalidateMapSize
    );

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      window.removeEventListener(
        'resize',
        invalidateMapSize
      );
    };
  }, [map]);

  return null;
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function getCoverImageUrl(
  coverImage: string | null
) {
  if (!coverImage) {
    return null;
  }

  if (
    coverImage.startsWith('http://') ||
    coverImage.startsWith('https://')
  ) {
    return coverImage;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  return `${supabaseUrl}${coverImage}`;
}

function getPriceRange(
  priceLevel: number | null
) {
  const safeLevel = Math.min(
    Math.max(priceLevel ?? 1, 1),
    4
  );

  return 'C$'.repeat(safeLevel);
}

function getLocation(
  restaurant: MapRestaurant
) {
  return [
    restaurant.municipality,
    restaurant.department,
    'Nicaragua',
  ]
    .filter(Boolean)
    .join(', ');
}

/* ========================================================== */
/* MAP CONTENT                                                */
/* ========================================================== */

export function MapContent() {
  const [
    isMobile,
    setIsMobile,
  ] = useState(false);

  const [
    restaurants,
    setRestaurants,
  ] = useState<MapRestaurant[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    const mediaQuery =
      window.matchMedia('(max-width: 767px)');

    const updateViewport = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateViewport();

    mediaQuery.addEventListener(
      'change',
      updateViewport
    );

    return () => {
      mediaQuery.removeEventListener(
        'change',
        updateViewport
      );
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchRestaurants() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const {
          data,
          error,
        } = await supabase.rpc(
          'get_map_restaurants'
        );

        if (!isMounted) {
          return;
        }

        if (error) {
          console.error(
            'Error cargando restaurantes en el mapa:',
            error
          );

          setRestaurants([]);

          setErrorMessage(
            'No se pudieron cargar los restaurantes en el mapa.'
          );

          return;
        }

        const validRestaurants = (
          (data ?? []) as MapRestaurant[]
        ).filter((restaurant) => {
          const latitude = Number(
            restaurant.latitude
          );

          const longitude = Number(
            restaurant.longitude
          );

          return (
            restaurant.latitude !== null &&
            restaurant.longitude !== null &&
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
          );
        });

        setRestaurants(
          validRestaurants
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error(
          'Error inesperado cargando el mapa:',
          error
        );

        setRestaurants([]);

        setErrorMessage(
          'Ocurrió un error inesperado al cargar el mapa.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchRestaurants();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ======================================================== */
  /* LOADING                                                  */
  /* ======================================================== */

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-[#F3F6F5] sm:min-h-[460px] md:min-h-[520px] lg:min-h-[600px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />

          <p className="text-sm">
            Cargando restaurantes en el mapa...
          </p>
        </div>
      </div>
    );
  }

  /* ======================================================== */
  /* ERROR                                                    */
  /* ======================================================== */

  if (errorMessage) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-red-50/60 p-5 sm:min-h-[460px] sm:p-6 md:min-h-[520px] lg:min-h-[600px]">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>

          <div>
            <h3 className="font-bold text-red-800">
              No pudimos cargar el mapa
            </h3>

            <p className="mt-1 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ======================================================== */
  /* MAP                                                      */
  /* ======================================================== */

  return (
    <MapContainer
      center={[
        12.8,
        -85.0,
      ]}
      zoom={isMobile ? 7 : 8}
      minZoom={isMobile ? 6 : 7}
      maxZoom={18}
      maxBounds={[
        [
          10.5,
          -88.5,
        ],
        [
          15.5,
          -82.0,
        ],
      ]}
      scrollWheelZoom={!isMobile}
      preferCanvas
      className="z-0 h-full w-full"
    >
      <MapResizeHandler />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {restaurants.map(
        (restaurant) => {
          const latitude = Number(
            restaurant.latitude
          );

          const longitude = Number(
            restaurant.longitude
          );

          const coverImageUrl =
            getCoverImageUrl(
              restaurant.cover_image
            );

          const safeRating = Math.min(
            Math.max(
              Number(
                restaurant.average_rating ??
                  0
              ),
              0
            ),
            5
          );

          return (
            <Marker
              key={restaurant.id}
              position={[
                latitude,
                longitude,
              ]}
              icon={customIcon}
            >
              <Popup
                minWidth={isMobile ? 220 : 270}
                maxWidth={isMobile ? 250 : 310}
              >
                <div className="overflow-hidden">
                  {/* Imagen */}
                  {coverImageUrl && (
                    <div
                      className="mb-3 h-28 w-full rounded-xl bg-cover bg-center sm:h-36"
                      style={{
                        backgroundImage: `url("${coverImageUrl}")`,
                      }}
                    />
                  )}

                  <div className="space-y-3">
                    {/* Nombre */}
                    <div>
                      <h3 className="text-base font-bold text-[#102A2A]">
                        {restaurant.name}
                      </h3>

                      {restaurant.short_description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600">
                          {
                            restaurant.short_description
                          }
                        </p>
                      )}
                    </div>

                    {/* Rating + precio */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

                        <span className="font-bold text-[#102A2A]">
                          {safeRating.toFixed(
                            1
                          )}
                        </span>

                        <span className="text-gray-500">
                          (
                          {restaurant.reviews_count ??
                            0}
                          )
                        </span>
                      </div>

                      <span className="font-semibold text-gray-700">
                        {getPriceRange(
                          restaurant.price_level
                        )}
                      </span>
                    </div>

                    {/* Ubicación */}
                    <div className="flex items-start gap-1.5 text-xs text-gray-600">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />

                      <span>
                        {getLocation(
                          restaurant
                        )}
                      </span>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/restaurant/${restaurant.id}`}
                      className="block rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-primary/90"
                    >
                      Ver restaurante
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }
      )}
    </MapContainer>
  );
}