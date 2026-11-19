'use client';

import {
  useMemo,
  useState,
} from 'react';

import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Images,
  X,
} from 'lucide-react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  type RestaurantImage,
} from '@/components/restaurant/restaurant-header';

/* ========================================================== */
/* TYPES                                                      */
/* ========================================================== */

interface PhotoGalleryProps {
  images:
    RestaurantImage[];

  restaurantName: string;
}

interface GalleryImage
  extends RestaurantImage {
  url: string;
}

/* ========================================================== */
/* IMAGE                                                      */
/* ========================================================== */

function getImageUrl(
  image: RestaurantImage
) {
  if (
    image.external_url
  ) {
    return image.external_url;
  }

  if (
    image.storage_path
  ) {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    if (
      supabaseUrl
    ) {
      return `${supabaseUrl}/storage/v1/object/public/restaurant-images/${image.storage_path}`;
    }
  }

  return null;
}

/* ========================================================== */
/* COMPONENT                                                  */
/* ========================================================== */

export function PhotoGallery({
  images,
  restaurantName,
}: PhotoGalleryProps) {
  const [
    selectedIndex,
    setSelectedIndex,
  ] =
    useState<
      number | null
    >(null);

  const photos =
    useMemo<
      GalleryImage[]
    >(() => {
      return images
        .map(
          (
            image
          ) => ({
            ...image,

            url:
              getImageUrl(
                image
              ),
          })
        )
        .filter(
          (
            image
          ): image is GalleryImage =>
            Boolean(
              image.url
            )
        )
        .sort(
          (
            a,
            b
          ) => {
            if (
              a.kind ===
                'cover' &&
              b.kind !==
                'cover'
            ) {
              return -1;
            }

            if (
              b.kind ===
                'cover' &&
              a.kind !==
                'cover'
            ) {
              return 1;
            }

            if (
              a.kind ===
                'logo' &&
              b.kind !==
                'logo'
            ) {
              return 1;
            }

            if (
              b.kind ===
                'logo' &&
              a.kind !==
                'logo'
            ) {
              return -1;
            }

            return (
              a.sort_order -
              b.sort_order
            );
          }
        );
    }, [
      images,
    ]);

  /* ======================================================== */
  /* LIGHTBOX                                                 */
  /* ======================================================== */

  function previousPhoto() {
    if (
      selectedIndex ===
        null ||
      photos.length ===
        0
    ) {
      return;
    }

    setSelectedIndex(
      selectedIndex ===
        0
        ? photos.length -
            1
        : selectedIndex -
            1
    );
  }

  function nextPhoto() {
    if (
      selectedIndex ===
        null ||
      photos.length ===
        0
    ) {
      return;
    }

    setSelectedIndex(
      selectedIndex ===
        photos.length -
          1
        ? 0
        : selectedIndex +
            1
    );
  }

  /* ======================================================== */
  /* EMPTY                                                    */
  /* ======================================================== */

  if (
    photos.length ===
    0
  ) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-card border border-border/70 bg-surface-2 p-8 text-center">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-action shadow-sm">
            <ImageIcon className="h-5 w-5" />
          </div>

          <p className="mt-4 text-sm font-bold text-ink">
            Sin fotografías
            todavía
          </p>

          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">
            Este restaurante aún no ha publicado imágenes de sus espacios o
            experiencia.
          </p>
        </div>
      </div>
    );
  }

  /* ======================================================== */
  /* RENDER                                                   */
  /* ======================================================== */

  return (
    <>
      {/* ====================================================== */}
      {/* DESKTOP MOSAIC                                         */}
      {/* ====================================================== */}

      <div className="hidden lg:block">
        {photos.length ===
        1 ? (
          <button
            type="button"
            onClick={() =>
              setSelectedIndex(
                0
              )
            }
            className="group relative h-[470px] w-full overflow-hidden rounded-card bg-[#E8ECEA]"
          >
            <GalleryPhoto
              photo={
                photos[0]
              }
              restaurantName={
                restaurantName
              }
              priority
            />

            <GalleryOverlay />

            <PhotoCounter
              total={
                photos.length
              }
            />
          </button>
        ) : (
          <div className="grid h-[500px] grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)] gap-3">
            {/* MAIN */}

            <button
              type="button"
              onClick={() =>
                setSelectedIndex(
                  0
                )
              }
              className="group relative min-w-0 overflow-hidden rounded-l-[1.8rem] bg-[#E8ECEA]"
            >
              <GalleryPhoto
                photo={
                  photos[0]
                }
                restaurantName={
                  restaurantName
                }
                priority
              />

              <GalleryOverlay />

              <div className="absolute bottom-5 left-5">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/60">
                  Galería
                </p>

                <p className="mt-1 text-sm font-bold text-white">
                  {
                    restaurantName
                  }
                </p>
              </div>
            </button>

            {/* SIDE */}

            <div className="grid min-w-0 grid-rows-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setSelectedIndex(
                    1
                  )
                }
                className="group relative overflow-hidden rounded-tr-[1.8rem] bg-[#E8ECEA]"
              >
                <GalleryPhoto
                  photo={
                    photos[1]
                  }
                  restaurantName={
                    restaurantName
                  }
                />

                <GalleryOverlay />
              </button>

              {photos[2] ? (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex(
                      2
                    )
                  }
                  className="group relative overflow-hidden rounded-br-[1.8rem] bg-[#E8ECEA]"
                >
                  <GalleryPhoto
                    photo={
                      photos[2]
                    }
                    restaurantName={
                      restaurantName
                    }
                  />

                  <GalleryOverlay />

                  <PhotoCounter
                    total={
                      photos.length
                    }
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex(
                      0
                    )
                  }
                  className="flex items-center justify-center rounded-br-[1.8rem] bg-[#E8ECEA]"
                >
                  <div className="text-center">
                    <Images className="mx-auto h-5 w-5 text-action" />

                    <p className="mt-2 text-xs font-bold text-ink">
                      Ver galería
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {photos.length}{' '}
            {photos.length ===
            1
              ? 'fotografía'
              : 'fotografías'}
          </p>

          <button
            type="button"
            onClick={() =>
              setSelectedIndex(
                0
              )
            }
            className="text-xs font-bold text-action transition hover:text-primary/75"
          >
            Ver todas
          </button>
        </div>
      </div>

      {/* ====================================================== */}
      {/* MOBILE / TABLET                                        */}
      {/* ====================================================== */}

      <div className="lg:hidden">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.map(
            (
              photo,
              index
            ) => (
              <button
                key={
                  photo.id
                }
                type="button"
                onClick={() =>
                  setSelectedIndex(
                    index
                  )
                }
                className="group relative h-[300px] w-[84vw] max-w-[520px] flex-shrink-0 snap-start overflow-hidden rounded-card bg-[#E8ECEA] sm:w-[70vw]"
              >
                <GalleryPhoto
                  photo={
                    photo
                  }
                  restaurantName={
                    restaurantName
                  }
                />

                <GalleryOverlay />

                <span className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                  {index +
                    1}{' '}
                  /{' '}
                  {
                    photos.length
                  }
                </span>
              </button>
            )
          )}
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Desliza para explorar las fotografías.
        </p>
      </div>

      {/* ====================================================== */}
      {/* LIGHTBOX                                               */}
      {/* ====================================================== */}

      <AnimatePresence>
        {selectedIndex !==
          null && (
          <motion.div
            initial={{
              opacity:
                0,
            }}
            animate={{
              opacity:
                1,
            }}
            exit={{
              opacity:
                0,
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101817]/90 p-4 backdrop-blur-xl"
            onClick={() =>
              setSelectedIndex(
                null
              )
            }
          >
            <motion.div
              initial={{
                opacity:
                  0,

                scale:
                  0.97,
              }}
              animate={{
                opacity:
                  1,

                scale:
                  1,
              }}
              exit={{
                opacity:
                  0,

                scale:
                  0.97,
              }}
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
              className="relative flex h-full max-h-[92vh] w-full max-w-6xl items-center justify-center"
            >
              {/* IMAGE */}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  photos[
                    selectedIndex
                  ].url
                }
                alt={
                  photos[
                    selectedIndex
                  ].alt_text ||
                  restaurantName
                }
                className="max-h-full max-w-full rounded-card object-contain shadow-modal"
              />

              {/* CLOSE */}

              <button
                type="button"
                onClick={() =>
                  setSelectedIndex(
                    null
                  )
                }
                aria-label="Cerrar galería"
                className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-lg transition hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>

              {/* PREVIOUS */}

              {photos.length >
                1 && (
                <>
                  <button
                    type="button"
                    onClick={
                      previousPhoto
                    }
                    aria-label="Fotografía anterior"
                    className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-xl transition hover:bg-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={
                      nextPhoto
                    }
                    aria-label="Fotografía siguiente"
                    className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-xl transition hover:bg-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* COUNTER */}

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                {selectedIndex +
                  1}{' '}
                /{' '}
                {
                  photos.length
                }
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ========================================================== */
/* PHOTO                                                      */
/* ========================================================== */

function GalleryPhoto({
  photo,
  restaurantName,
  priority = false,
}: {
  photo:
    GalleryImage;

  restaurantName:
    string;

  priority?:
    boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={
        photo.url
      }
      alt={
        photo.alt_text ||
        restaurantName
      }
      loading={
        priority
          ? 'eager'
          : 'lazy'
      }
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
    />
  );
}

/* ========================================================== */
/* OVERLAY                                                    */
/* ========================================================== */

function GalleryOverlay() {
  return (
    <>
      <div className="absolute inset-0 ring-1 ring-inset ring-black/[0.04]" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70" />
    </>
  );
}

/* ========================================================== */
/* COUNT                                                      */
/* ========================================================== */

function PhotoCounter({
  total,
}: {
  total: number;
}) {
  return (
    <div className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
      <Images className="h-3 w-3" />

      Ver{' '}
      {total}{' '}
      {total ===
      1
        ? 'foto'
        : 'fotos'}
    </div>
  );
}