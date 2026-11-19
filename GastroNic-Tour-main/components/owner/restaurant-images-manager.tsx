'use client';

import {
  ChangeEvent,
  useMemo,
  useState,
} from 'react';

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { prepareImageForUpload } from '@/lib/images/prepare-image-upload';
import { createClient } from '@/lib/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase =
  createClient();

const IMAGE_BUCKET =
  'restaurant-images';

const MAX_IMAGE_SIZE =
  8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

type ImageKind =
  | 'cover'
  | 'gallery'
  | 'logo';

interface RestaurantImage {
  id: string;
  restaurant_id: string;

  kind: ImageKind;

  storage_path:
    | string
    | null;

  external_url:
    | string
    | null;

  alt_text:
    | string
    | null;

  sort_order: number;
  created_at: string;
}

interface Props {
  restaurantId: string;
  restaurantName: string;

  description:
    | string
    | null;

  location: string;
  cuisine: string;
  priceRange: string;

  initialImages:
    RestaurantImage[];
}

export function RestaurantImagesManager({
  restaurantId,
  restaurantName,
  description,
  location,
  cuisine,
  priceRange,
  initialImages,
}: Props) {
  const [
    images,
    setImages,
  ] =
    useState<
      RestaurantImage[]
    >(
      initialImages
    );

  const [
    showAddPanel,
    setShowAddPanel,
  ] =
    useState(false);

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState('');

  const [
    altText,
    setAltText,
  ] =
    useState('');

  const [
    newImageKind,
    setNewImageKind,
  ] =
    useState<ImageKind>(
      'gallery'
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    actionId,
    setActionId,
  ] =
    useState<
      string | null
    >(null);

  const [
    openMenuId,
    setOpenMenuId,
  ] =
    useState<
      string | null
    >(null);

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
  /* DERIVED                                                  */
  /* ======================================================== */

  const cover =
    useMemo(
      () =>
        images.find(
          (image) =>
            image.kind ===
            'cover'
        ) ?? null,
      [images]
    );

  const logo =
    useMemo(
      () =>
        images.find(
          (image) =>
            image.kind ===
            'logo'
        ) ?? null,
      [images]
    );

  const gallery =
    useMemo(
      () =>
        images
          .filter(
            (image) =>
              image.kind ===
              'gallery'
          )
          .sort(
            (a, b) =>
              a.sort_order -
              b.sort_order
          ),
      [images]
    );

  function resetAddForm() {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setSelectedFile(
      null
    );

    setPreviewUrl('');
    setAltText('');
    setNewImageKind(
      'gallery'
    );
  }

  function closeAddPanel() {
    if (isSaving) {
      return;
    }

    resetAddForm();

    setShowAddPanel(
      false
    );
  }

  function handleFileChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    setErrorMessage('');
    setSuccessMessage('');

    const file =
      event.target.files?.[0] ??
      null;

    if (!file) {
      return;
    }

    if (
      !ALLOWED_IMAGE_TYPES.has(
        file.type
      )
    ) {
      event.target.value = '';

      setErrorMessage(
        'Formato no permitido. Usa JPG, PNG o WebP.'
      );

      return;
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      event.target.value = '';

      setErrorMessage(
        'La imagen no puede superar los 8 MB.'
      );

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setSelectedFile(
      file
    );

    setPreviewUrl(
      URL.createObjectURL(
        file
      )
    );
  }

  /* ======================================================== */
  /* ADD IMAGE                                                */
  /* ======================================================== */

  async function handleAddImage() {
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedFile) {
      setErrorMessage(
        'Selecciona una fotografía para subir.'
      );

      return;
    }

    if (
      !ALLOWED_IMAGE_TYPES.has(
        selectedFile.type
      )
    ) {
      setErrorMessage(
        'Formato no permitido. Usa JPG, PNG o WebP.'
      );

      return;
    }

    if (
      selectedFile.size >
      MAX_IMAGE_SIZE
    ) {
      setErrorMessage(
        'La imagen no puede superar los 8 MB.'
      );

      return;
    }

    setIsSaving(true);

    let uploadedPath:
      string | null =
      null;

    let demotedImage:
      RestaurantImage | null =
      null;

    try {
      const uploadFile =
        await prepareImageForUpload(
          selectedFile,
          {
            maxWidth: 2200,
            maxHeight: 2200,
            targetBytes:
              1536 * 1024,
            skipIfBelowBytes:
              700 * 1024,
          }
        );

      const extension =
        getExtensionFromMimeType(
          uploadFile.type
        );

      const storagePath =
        `${restaurantId}/${crypto.randomUUID()}.${extension}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            IMAGE_BUCKET
          )
          .upload(
            storagePath,
            uploadFile,
            {
              cacheControl:
                '31536000',

              contentType:
                uploadFile.type,

              upsert: false,
            }
          );

      if (uploadError) {
        console.error(
          'Error subiendo imagen:',
          uploadError
        );

        setErrorMessage(
          getUserFacingErrorMessage(uploadError, 'No se pudo subir la fotografía.')
        );

        return;
      }

      uploadedPath =
        storagePath;

      let updatedImages =
        [...images];

      if (
        newImageKind ===
          'cover' ||
        newImageKind ===
          'logo'
      ) {
        const existing =
          updatedImages.find(
            (image) =>
              image.kind ===
              newImageKind
          );

        if (existing) {
          demotedImage =
            existing;

          const galleryOrder =
            getNextGalleryOrder(
              updatedImages
            );

          const {
            error:
              demoteError,
          } =
            await supabase
              .from(
                'restaurant_images'
              )
              .update({
                kind: 'gallery',

                sort_order:
                  galleryOrder,
              })
              .eq(
                'id',
                existing.id
              )
              .eq(
                'restaurant_id',
                restaurantId
              );

          if (demoteError) {
            throw demoteError;
          }

          updatedImages =
            updatedImages.map(
              (image) =>
                image.id ===
                existing.id
                  ? {
                      ...image,

                      kind:
                        'gallery',

                      sort_order:
                        galleryOrder,
                    }
                  : image
            );
        }
      }

      const sortOrder =
        newImageKind ===
        'gallery'
          ? getNextGalleryOrder(
              updatedImages
            )
          : 0;

      const {
        data,
        error: insertError,
      } =
        await supabase
          .from(
            'restaurant_images'
          )
          .insert({
            restaurant_id:
              restaurantId,

            kind:
              newImageKind,

            storage_path:
              storagePath,

            external_url:
              null,

            alt_text:
              altText.trim() ||
              restaurantName,

            sort_order:
              sortOrder,
          })
          .select(`
            id,
            restaurant_id,
            kind,
            storage_path,
            external_url,
            alt_text,
            sort_order,
            created_at
          `)
          .single();

      if (insertError) {
        throw insertError;
      }

      setImages([
        ...updatedImages,
        data as RestaurantImage,
      ]);

      resetAddForm();

      setShowAddPanel(
        false
      );

      setSuccessMessage(
        'La fotografía fue subida correctamente.'
      );
    } catch (error) {
      console.error(
        'Error guardando fotografía:',
        error
      );

      if (
        demotedImage
      ) {
        await supabase
          .from(
            'restaurant_images'
          )
          .update({
            kind:
              demotedImage.kind,

            sort_order:
              demotedImage.sort_order,
          })
          .eq(
            'id',
            demotedImage.id
          )
          .eq(
            'restaurant_id',
            restaurantId
          );
      }

      if (
        uploadedPath
      ) {
        await supabase.storage
          .from(
            IMAGE_BUCKET
          )
          .remove([
            uploadedPath,
          ]);
      }

      setErrorMessage(
        getUserFacingErrorMessage(error, 'No se pudo guardar la fotografía.')
      );
    } finally {
      setIsSaving(false);
    }
  }

  /* ======================================================== */
  /* DELETE                                                   */
  /* ======================================================== */

  async function handleDelete(
    imageId: string
  ) {
    setErrorMessage('');
    setSuccessMessage('');
    setOpenMenuId(null);
    setActionId(imageId);

    const image =
      images.find(
        (item) =>
          item.id ===
          imageId
      );

    if (!image) {
      setActionId(null);

      setErrorMessage(
        'No se encontró la fotografía.'
      );

      return;
    }

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'restaurant_images'
          )
          .delete()
          .eq(
            'id',
            imageId
          )
          .eq(
            'restaurant_id',
            restaurantId
          )
          .select('id')
          .maybeSingle();

      if (error) {
        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo eliminar la fotografía.')
        );

        return;
      }

      if (!data) {
        setErrorMessage(
          'No se pudo eliminar la fotografía o ya no tienes permisos para administrarla.'
        );

        return;
      }

      setImages(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              imageId
          )
      );

      if (
        image.storage_path
      ) {
        const {
          error:
            storageError,
        } =
          await supabase.storage
            .from(
              IMAGE_BUCKET
            )
            .remove([
              image.storage_path,
            ]);

        if (storageError) {
          console.error(
            'La fila se eliminó, pero no se pudo limpiar Storage:',
            storageError
          );

          setSuccessMessage(
            'La fotografía fue eliminada del restaurante, pero quedó un archivo pendiente de limpieza en Storage.'
          );

          return;
        }
      }

      setSuccessMessage(
        'La fotografía fue eliminada correctamente.'
      );
    } catch (error) {
      console.error(
        'Error eliminando fotografía:',
        error
      );

      setErrorMessage(
        'Ocurrió un error inesperado al eliminar la fotografía.'
      );
    } finally {
      setActionId(null);
    }
  }

  /* ======================================================== */
  /* COVER                                                    */
  /* ======================================================== */

  async function handleMakeCover(
    image: RestaurantImage
  ) {
    if (
      image.kind ===
      'cover'
    ) {
      return;
    }

    setOpenMenuId(null);
    setActionId(image.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } =
        await supabase.rpc(
          'set_restaurant_cover',
          {
            p_restaurant_id:
              restaurantId,
            p_image_id:
              image.id,
          }
        );

      if (error) {
        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo actualizar la portada.')
        );

        return;
      }

      /*
       * Volvemos a leer el estado real desde PostgreSQL.
       * No asumimos que el estado local sigue vigente,
       * especialmente si hay mas de un administrador.
       */
      const {
        data: refreshedImages,
        error: refreshError,
      } = await supabase
        .from(
          'restaurant_images'
        )
        .select(`
          id,
          restaurant_id,
          kind,
          storage_path,
          external_url,
          alt_text,
          sort_order,
          created_at
        `)
        .eq(
          'restaurant_id',
          restaurantId
        )
        .order(
          'sort_order',
          { ascending: true }
        );

      if (refreshError) {
        setErrorMessage(
          'La portada fue actualizada, pero no se pudo refrescar la galeria. Recarga la pagina para ver el cambio.'
        );

        return;
      }

      setImages(
        (refreshedImages ?? []) as RestaurantImage[]
      );

      setSuccessMessage(
        'La portada fue actualizada.'
      );
    } catch (error) {
      console.error(
        'Error actualizando portada:',
        error
      );

      setErrorMessage(
        'Ocurrio un error inesperado al actualizar la portada.'
      );
    } finally {
      setActionId(null);
    }
  }

  /* ======================================================== */
  /* MOVE                                                     */
  /* ======================================================== */

  async function moveGalleryImage(
    imageId: string,
    direction:
      | 'previous'
      | 'next'
  ) {
    const index =
      gallery.findIndex(
        (image) =>
          image.id ===
          imageId
      );

    const targetIndex =
      direction ===
      'previous'
        ? index - 1
        : index + 1;

    if (
      index < 0 ||
      targetIndex < 0 ||
      targetIndex >=
        gallery.length
    ) {
      return;
    }

    const currentImage =
      gallery[index];

    const targetImage =
      gallery[
        targetIndex
      ];

    setActionId(
      currentImage.id
    );

    const [
      first,
      second,
    ] = await Promise.all([
      supabase
        .from(
          'restaurant_images'
        )
        .update({
          sort_order:
            targetImage.sort_order,
        })
        .eq(
          'id',
          currentImage.id
        )
        .eq(
          'restaurant_id',
          restaurantId
        ),

      supabase
        .from(
          'restaurant_images'
        )
        .update({
          sort_order:
            currentImage.sort_order,
        })
        .eq(
          'id',
          targetImage.id
        )
        .eq(
          'restaurant_id',
          restaurantId
        ),
    ]);

    if (
      first.error ||
      second.error
    ) {
      setErrorMessage(
        'No se pudo cambiar el orden de las fotografías.'
      );

      setActionId(null);
      return;
    }

    setImages(
      (current) =>
        current.map(
          (image) => {
            if (
              image.id ===
              currentImage.id
            ) {
              return {
                ...image,

                sort_order:
                  targetImage.sort_order,
              };
            }

            if (
              image.id ===
              targetImage.id
            ) {
              return {
                ...image,

                sort_order:
                  currentImage.sort_order,
              };
            }

            return image;
          }
        )
    );

    setActionId(null);
  }

  return (
    <div className="space-y-6">
      {/* ====================================================== */}
      {/* PUBLIC PREVIEW                                         */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="border-b border-border/60 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                Vista previa
              </p>

              <h2 className="mt-1 text-lg font-bold text-ink">
                Así se presenta tu restaurante
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Una aproximación de cómo verá el usuario tu imagen principal.
              </p>
            </div>

            <Button
              type="button"
              onClick={() =>
                setShowAddPanel(
                  true
                )
              }
              className="h-10 w-fit rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" />

              Agregar fotografía
            </Button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="relative mx-auto max-w-[900px] overflow-hidden rounded-card bg-ink shadow-overlay">
            <div className="relative h-[360px] sm:h-[430px]">
              {cover ? (
                <img
                  src={
                    getImageUrl(
                      cover
                    ) ?? ''
                  }
                  alt={
                    cover.alt_text ||
                    restaurantName
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#173B3A] to-ink">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-10 w-10 text-white/20" />

                    <p className="mt-3 text-sm font-medium text-white/40">
                      Agrega una portada
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/10" />

              {/* Price */}

              <div className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-ink shadow-sm backdrop-blur">
                {priceRange}
              </div>

              {/* Content */}

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="mb-3 inline-flex items-center rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                  {cuisine}
                </div>

                <h3 className="text-2xl font-bold tracking-[-0.025em] text-white sm:text-3xl">
                  {restaurantName}
                </h3>

                <p className="mt-2 text-sm font-medium text-white/75">
                  {location}
                </p>

                {description && (
                  <p className="mt-4 max-w-2xl line-clamp-2 text-sm leading-6 text-white/70">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* FEEDBACK                                               */}
      {/* ====================================================== */}

      {errorMessage && (
        <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-success/25 bg-success-soft p-4 text-sm text-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />

          {successMessage}
        </div>
      )}

      {/* ====================================================== */}
      {/* COVER + LOGO                                           */}
      {/* ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.5fr)]">
        {/* COVER */}

        <VisualSection
          title="Portada"
          description="La imagen principal del restaurante."
        >
          {cover ? (
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <div className="relative h-[260px] overflow-hidden">
                <img
                  src={
                    getImageUrl(
                      cover
                    ) ?? ''
                  }
                  alt={
                    cover.alt_text ||
                    restaurantName
                  }
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink backdrop-blur">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />

                    Portada actual
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">
                    {cover.alt_text ||
                      'Portada del restaurante'}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Imagen principal
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(
                      cover.id
                    )
                  }
                  disabled={
                    actionId ===
                    cover.id
                  }
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-danger transition hover:bg-danger-soft"
                >
                  {actionId ===
                  cover.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Sin portada"
              description="Selecciona una fotografía de la galería o agrega una nueva."
              onAdd={() =>
                setShowAddPanel(
                  true
                )
              }
            />
          )}
        </VisualSection>

        {/* LOGO */}

        <VisualSection
          title="Logo"
          description="Identidad visual del negocio."
        >
          {logo ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-border/70 bg-canvas p-6 text-center">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-sheet bg-white shadow-sm">
                <img
                  src={
                    getImageUrl(
                      logo
                    ) ?? ''
                  }
                  alt={
                    logo.alt_text ||
                    restaurantName
                  }
                  className="h-full w-full object-contain p-2"
                />
              </div>

              <p className="mt-4 text-sm font-bold text-ink">
                Logo actual
              </p>

              <button
                type="button"
                disabled={
                  actionId ===
                  logo.id
                }
                onClick={() =>
                  handleDelete(
                    logo.id
                  )
                }
                className="mt-3 text-xs font-semibold text-danger hover:underline"
              >
                Eliminar
              </button>
            </div>
          ) : (
            <EmptyState
              title="Sin logo"
              description="Añade la identidad visual de tu restaurante."
              onAdd={() => {
                setNewImageKind(
                  'logo'
                );

                setShowAddPanel(
                  true
                );
              }}
            />
          )}
        </VisualSection>
      </div>

      {/* ====================================================== */}
      {/* GALLERY                                                */}
      {/* ====================================================== */}

      <VisualSection
        title="Galería"
        description="Muestra platos, espacios y experiencias de tu restaurante."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setNewImageKind(
                'gallery'
              );

              setShowAddPanel(
                true
              );
            }}
            className="h-9 rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" />

            Agregar
          </Button>
        }
      >
        {gallery.length ===
        0 ? (
          <EmptyState
            title="Tu galería está vacía"
            description="Agrega fotografías del ambiente, platos, eventos o espacios."
            onAdd={() =>
              setShowAddPanel(
                true
              )
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {gallery.map(
              (
                image,
                index
              ) => (
                <GalleryCard
                  key={
                    image.id
                  }
                  image={
                    image
                  }
                  index={
                    index
                  }
                  total={
                    gallery.length
                  }
                  busy={
                    actionId ===
                    image.id
                  }
                  menuOpen={
                    openMenuId ===
                    image.id
                  }
                  onToggleMenu={() =>
                    setOpenMenuId(
                      openMenuId ===
                        image.id
                        ? null
                        : image.id
                    )
                  }
                  onMakeCover={() =>
                    handleMakeCover(
                      image
                    )
                  }
                  onDelete={() =>
                    handleDelete(
                      image.id
                    )
                  }
                  onPrevious={() =>
                    moveGalleryImage(
                      image.id,
                      'previous'
                    )
                  }
                  onNext={() =>
                    moveGalleryImage(
                      image.id,
                      'next'
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </VisualSection>

      {/* ====================================================== */}
      {/* ADD MODAL                                              */}
      {/* ====================================================== */}

      {showAddPanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-sheet border border-border bg-white shadow-modal">
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                    Nueva fotografía
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-ink">
                    Agrega una imagen
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closeAddPanel
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-bold text-ink">
                  ¿Dónde quieres utilizarla?
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <KindButton
                    label="Galería"
                    selected={
                      newImageKind ===
                      'gallery'
                    }
                    onClick={() =>
                      setNewImageKind(
                        'gallery'
                      )
                    }
                  />

                  <KindButton
                    label="Portada"
                    selected={
                      newImageKind ===
                      'cover'
                    }
                    onClick={() =>
                      setNewImageKind(
                        'cover'
                      )
                    }
                  />

                  <KindButton
                    label="Logo"
                    selected={
                      newImageKind ===
                      'logo'
                    }
                    onClick={() =>
                      setNewImageKind(
                        'logo'
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-ink">
                  Fotografía
                </label>

                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-canvas px-5 py-6 text-center transition hover:border-primary/30 hover:bg-primary/[0.025]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <Upload className="h-5 w-5 text-action" />
                  </div>

                  <p className="mt-3 text-sm font-bold text-ink">
                    {selectedFile
                      ? selectedFile.name
                      : 'Seleccionar imagen'}
                  </p>

                  <p className="mt-1 text-xs leading-4 text-muted-foreground">
                    JPG, PNG o WebP · máximo 8 MB · se optimiza automáticamente
                  </p>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleFileChange
                    }
                    className="sr-only"
                  />
                </label>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-ink">
                  ¿Qué muestra esta fotografía?
                </label>

                <input
                  value={
                    altText
                  }
                  onChange={(
                    event
                  ) =>
                    setAltText(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Ej. Terraza principal al atardecer"
                  className="h-12 w-full rounded-xl border border-border bg-canvas px-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
                />

                <p className="mt-2 text-xs leading-4 text-muted-foreground">
                  Esta descripción también mejora la accesibilidad de GastroNic.
                </p>
              </div>

              {previewUrl && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Vista previa
                  </p>

                  <div className="h-44 overflow-hidden rounded-2xl bg-muted">
                    <img
                      src={
                        previewUrl
                      }
                      alt="Vista previa de la fotografía seleccionada"
                      className={
                        newImageKind ===
                        'logo'
                          ? 'h-full w-full object-contain p-4'
                          : 'h-full w-full object-cover'
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border bg-canvas px-6 py-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={
                  isSaving
                }
                onClick={
                  closeAddPanel
                }
                className="rounded-xl"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                disabled={
                  isSaving
                }
                onClick={
                  handleAddImage
                }
                className="rounded-xl"
              >
                {isSaving ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />

                    Agregar fotografía
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================== */
/* VISUAL SECTION                                             */
/* ========================================================== */

function VisualSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;

  action?:
    React.ReactNode;

  children:
    React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
      <div className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-5 sm:px-6">
        <div>
          <h2 className="font-bold text-ink">
            {title}
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        {action}
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

/* ========================================================== */
/* GALLERY CARD                                               */
/* ========================================================== */

function GalleryCard({
  image,
  index,
  total,
  busy,
  menuOpen,
  onToggleMenu,
  onMakeCover,
  onDelete,
  onPrevious,
  onNext,
}: {
  image: RestaurantImage;

  index: number;
  total: number;

  busy: boolean;
  menuOpen: boolean;

  onToggleMenu: () => void;
  onMakeCover: () => void;
  onDelete: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-card border border-border/70 bg-white transition hover:-translate-y-1 hover:shadow-raised">
      <div className="relative h-56 overflow-hidden bg-muted">
        <img
          src={
            getImageUrl(
              image
            ) ?? ''
          }
          alt={
            image.alt_text ||
            'Fotografía del restaurante'
          }
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          Foto {index + 1}
        </span>

        <div className="absolute right-3 top-3">
          <button
            type="button"
            disabled={
              busy
            }
            onClick={
              onToggleMenu
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-ink shadow-sm backdrop-blur transition hover:bg-white"
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
              <button
                type="button"
                onClick={
                  onMakeCover
                }
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-semibold text-ink transition hover:bg-canvas"
              >
                <Star className="h-3.5 w-3.5 text-amber-500" />

                Usar como portada
              </button>

              <button
                type="button"
                onClick={
                  onDelete
                }
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-semibold text-danger transition hover:bg-danger-soft"
              >
                <Trash2 className="h-3.5 w-3.5" />

                Eliminar fotografía
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <p className="line-clamp-1 text-sm font-bold text-ink">
          {image.alt_text ||
            'Fotografía del restaurante'}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Posición {index + 1} de {total}
          </p>

          <div className="flex gap-1">
            <button
              type="button"
              disabled={
                busy ||
                index === 0
              }
              onClick={
                onPrevious
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-action disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={
                busy ||
                index ===
                  total - 1
              }
              onClick={
                onNext
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-action disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ========================================================== */
/* EMPTY                                                      */
/* ========================================================== */

function EmptyState({
  title,
  description,
  onAdd,
}: {
  title: string;
  description: string;

  onAdd: () => void;
}) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border bg-canvas p-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <ImageIcon className="h-5 w-5 text-action" />
        </div>

        <h3 className="mt-4 text-sm font-bold text-ink">
          {title}
        </h3>

        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {description}
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={
            onAdd
          }
          className="mt-4 h-9 rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />

          Agregar
        </Button>
      </div>
    </div>
  );
}

/* ========================================================== */
/* KIND                                                       */
/* ========================================================== */

function KindButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${
        selected
          ? 'border-primary bg-action text-white shadow-sm'
          : 'border-border bg-canvas text-muted-foreground hover:border-primary/30 hover:text-action'
      }`}
    >
      {label}
    </button>
  );
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function getExtensionFromMimeType(
  mimeType: string
) {
  if (
    mimeType ===
    'image/png'
  ) {
    return 'png';
  }

  if (
    mimeType ===
    'image/webp'
  ) {
    return 'webp';
  }

  return 'jpg';
}

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

    if (!supabaseUrl) {
      return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/restaurant-images/${image.storage_path}`;
  }

  return null;
}

function getNextGalleryOrder(
  images: RestaurantImage[]
) {
  const orders =
    images
      .filter(
        (image) =>
          image.kind ===
          'gallery'
      )
      .map(
        (image) =>
          image.sort_order
      );

  if (
    orders.length ===
    0
  ) {
    return 0;
  }

  return (
    Math.max(
      ...orders
    ) + 1
  );
}