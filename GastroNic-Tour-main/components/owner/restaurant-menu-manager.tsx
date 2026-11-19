'use client';

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CheckCircle2,
  Edit3,
  ImageIcon,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { prepareImageForUpload } from '@/lib/images/prepare-image-upload';
import { createClient } from '@/lib/supabase/client';
import { useConfirm } from '@/components/common/confirm-dialog';
import { getUserFacingErrorMessage } from '@/lib/supabase/errors';

const supabase =
  createClient();

const MENU_IMAGE_BUCKET =
  'menu-images';

const MAX_MENU_IMAGE_SIZE =
  8 * 1024 * 1024;

const ALLOWED_MENU_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  storage_path: string | null;
  external_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  dietary_labels: string[];
  allergens: string[];
  sort_order: number;
}

interface Props {
  restaurantId: string;
  restaurantName: string;
  initialCategories: MenuCategory[];
  initialItems: MenuItem[];
}

interface MenuItemForm {
  id: string | null;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
  isFeatured: boolean;
  dietaryLabels: string;
  allergens: string;
}

const emptyForm: MenuItemForm = {
  id: null,
  categoryId: '',
  name: '',
  description: '',
  price: '',
  isAvailable: true,
  isFeatured: false,
  dietaryLabels: '',
  allergens: '',
};

export function RestaurantMenuManager({
  restaurantId,
  restaurantName,
  initialCategories,
  initialItems,
}: Props) {
  const [
    categories,
    setCategories,
  ] = useState(
    initialCategories
  );

  const [
    items,
    setItems,
  ] = useState(
    initialItems
  );

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] = useState<string | null>(
    null
  );

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    showItemModal,
    setShowItemModal,
  ] = useState(false);

  const [
    showCategoryModal,
    setShowCategoryModal,
  ] = useState(false);

  const [
    itemForm,
    setItemForm,
  ] =
    useState<MenuItemForm>(
      emptyForm
    );

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
    useState<string | null>(
      null
    );

  const [
    categoryName,
    setCategoryName,
  ] = useState('');

  const [
    categoryDescription,
    setCategoryDescription,
  ] = useState('');

  const [
    editingCategoryId,
    setEditingCategoryId,
  ] = useState<string | null>(
    null
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    actionId,
    setActionId,
  ] = useState<string | null>(
    null
  );

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(
    null
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  useEffect(() => {
    return () => {
      if (
        previewUrl?.startsWith(
          'blob:'
        )
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [
    previewUrl,
  ]);

  /* ======================================================== */
  /* DERIVED                                                  */
  /* ======================================================== */

  const filteredItems =
    useMemo(() => {
      const cleanSearch =
        search
          .trim()
          .toLowerCase();

      return items.filter(
        (item) => {
          const matchesCategory =
            selectedCategoryId ===
              null ||
            item.category_id ===
              selectedCategoryId;

          const matchesSearch =
            !cleanSearch ||
            item.name
              .toLowerCase()
              .includes(
                cleanSearch
              ) ||
            item.description
              ?.toLowerCase()
              .includes(
                cleanSearch
              );

          return (
            matchesCategory &&
            matchesSearch
          );
        }
      );
    }, [
      items,
      search,
      selectedCategoryId,
    ]);

  const featuredCount =
    items.filter(
      (item) =>
        item.is_featured
    ).length;

  const availableCount =
    items.filter(
      (item) =>
        item.is_available
    ).length;

  /* ======================================================== */
  /* OPEN ITEM MODAL                                          */
  /* ======================================================== */

  function openNewItem() {
    setErrorMessage('');
    setSelectedFile(
      null
    );
    setPreviewUrl(
      null
    );

    setItemForm({
      ...emptyForm,

      categoryId:
        selectedCategoryId ??
        categories[0]?.id ??
        '',
    });

    setShowItemModal(true);
  }

  function openEditItem(
    item: MenuItem
  ) {
    setErrorMessage('');
    setOpenMenuId(null);
    setSelectedFile(
      null
    );
    setPreviewUrl(
      getMenuItemImageUrl(
        item
      )
    );

    setItemForm({
      id: item.id,

      categoryId:
        item.category_id ??
        '',

      name:
        item.name,

      description:
        item.description ??
        '',

      price:
        String(
          item.price
        ),

      isAvailable:
        item.is_available,

      isFeatured:
        item.is_featured,

      dietaryLabels:
        item.dietary_labels.join(
          ', '
        ),

      allergens:
        item.allergens.join(
          ', '
        ),
    });

    setShowItemModal(true);
  }

  function handleItemImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] ??
      null;

    setErrorMessage('');

    if (!file) {
      setSelectedFile(
        null
      );

      return;
    }

    if (
      !ALLOWED_MENU_IMAGE_TYPES.includes(
        file.type
      )
    ) {
      event.target.value =
        '';

      setErrorMessage(
        'La imagen debe ser JPG, PNG o WebP.'
      );

      return;
    }

    if (
      file.size >
      MAX_MENU_IMAGE_SIZE
    ) {
      event.target.value =
        '';

      setErrorMessage(
        'La imagen no puede superar los 8 MB.'
      );

      return;
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
  /* SAVE ITEM                                                */
  /* ======================================================== */

  async function handleSaveItem() {
    setErrorMessage('');
    setSuccessMessage('');

    const cleanName =
      itemForm.name.trim();

    const price =
      Number(
        itemForm.price
      );

    if (
      cleanName.length < 2
    ) {
      setErrorMessage(
        'Escribe un nombre válido para el plato.'
      );

      return;
    }

    if (
      !Number.isFinite(
        price
      ) ||
      price < 0
    ) {
      setErrorMessage(
        'El precio no es válido.'
      );

      return;
    }

    setIsSaving(true);

    const existingItem =
      itemForm.id
        ? items.find(
            (item) =>
              item.id ===
              itemForm.id
          ) ??
          null
        : null;

    let uploadedStoragePath:
      string | null =
      null;

    let nextStoragePath =
      existingItem?.storage_path ??
      null;

    let nextExternalUrl =
      existingItem?.external_url ??
      null;

    try {
      if (selectedFile) {
        const uploadFile =
          await prepareImageForUpload(
            selectedFile,
            {
              maxWidth: 1600,
              maxHeight: 1600,
              targetBytes:
                1024 * 1024,
              skipIfBelowBytes:
                500 * 1024,
            }
          );

        const extension =
          getExtensionFromMimeType(
            uploadFile.type
          );

        const storagePath =
          `${restaurantId}/${crypto.randomUUID()}.${extension}`;

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              MENU_IMAGE_BUCKET
            )
            .upload(
              storagePath,
              uploadFile,
              {
                cacheControl:
                  '31536000',

                contentType:
                  uploadFile.type,

                upsert:
                  false,
              }
            );

        if (
          uploadError
        ) {
          console.error(
            'Error subiendo fotografía del plato:',
            uploadError
          );

          setErrorMessage(
            getUserFacingErrorMessage(uploadError, 'No se pudo subir la fotografía.')
          );

          return;
        }

        uploadedStoragePath =
          storagePath;

        nextStoragePath =
          storagePath;

        nextExternalUrl =
          null;
      }

      const payload = {
        restaurant_id:
          restaurantId,

        category_id:
          itemForm.categoryId ||
          null,

        name:
          cleanName,

        description:
          itemForm.description.trim() ||
          null,

        price,

        currency:
          'NIO',

        storage_path:
          nextStoragePath,

        external_url:
          nextExternalUrl,

        is_available:
          itemForm.isAvailable,

        is_featured:
          itemForm.isFeatured,

        dietary_labels:
          parseList(
            itemForm.dietaryLabels
          ),

        allergens:
          parseList(
            itemForm.allergens
          ),
      };

      if (itemForm.id) {
        const {
          data,
          error,
        } = await supabase
          .from('menu_items')
          .update(payload)
          .eq(
            'id',
            itemForm.id
          )
          .eq(
            'restaurant_id',
            restaurantId
          )
          .select(`
            id,
            restaurant_id,
            category_id,
            name,
            description,
            price,
            currency,
            storage_path,
            external_url,
            is_available,
            is_featured,
            dietary_labels,
            allergens,
            sort_order
          `)
          .single();

        if (error) {
          if (
            uploadedStoragePath
          ) {
            await supabase.storage
              .from(
                MENU_IMAGE_BUCKET
              )
              .remove([
                uploadedStoragePath,
              ]);
          }

          console.error(
            'Error actualizando plato:',
            error
          );

          setErrorMessage(
            getUserFacingErrorMessage(error, 'No se pudo actualizar el plato.')
          );

          return;
        }

        if (
          selectedFile &&
          existingItem?.storage_path &&
          existingItem.storage_path !==
            uploadedStoragePath
        ) {
          const {
            error:
              cleanupError,
          } =
            await supabase.storage
              .from(
                MENU_IMAGE_BUCKET
              )
              .remove([
                existingItem.storage_path,
              ]);

          if (
            cleanupError
          ) {
            console.warn(
              'El plato fue actualizado, pero no se pudo limpiar la fotografía anterior:',
              cleanupError
            );
          }
        }

        setItems(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                itemForm.id
                  ? (data as MenuItem)
                  : item
            )
        );

        setSuccessMessage(
          `"${cleanName}" fue actualizado.`
        );
      } else {
        const nextOrder =
          getNextItemOrder(
            items,
            itemForm.categoryId ||
              null
          );

        const {
          data,
          error,
        } = await supabase
          .from('menu_items')
          .insert({
            ...payload,
            sort_order:
              nextOrder,
          })
          .select(`
            id,
            restaurant_id,
            category_id,
            name,
            description,
            price,
            currency,
            storage_path,
            external_url,
            is_available,
            is_featured,
            dietary_labels,
            allergens,
            sort_order
          `)
          .single();

        if (error) {
          if (
            uploadedStoragePath
          ) {
            await supabase.storage
              .from(
                MENU_IMAGE_BUCKET
              )
              .remove([
                uploadedStoragePath,
              ]);
          }

          console.error(
            'Error creando plato:',
            error
          );

          setErrorMessage(
            getUserFacingErrorMessage(error, 'No se pudo crear el plato.')
          );

          return;
        }

        setItems(
          (current) => [
            ...current,
            data as MenuItem,
          ]
        );

        setSuccessMessage(
          `"${cleanName}" fue agregado al menú.`
        );
      }

      setShowItemModal(
        false
      );

      setItemForm(
        emptyForm
      );

      setSelectedFile(
        null
      );

      setPreviewUrl(
        null
      );
    } finally {
      setIsSaving(false);
    }
  }

  /* ======================================================== */
  /* DELETE ITEM                                              */
  /* ======================================================== */

  async function handleDeleteItem(
    item: MenuItem
  ) {
    setOpenMenuId(null);
    setActionId(item.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } =
        await supabase
          .from('menu_items')
          .delete()
          .eq(
            'id',
            item.id
          )
          .eq(
            'restaurant_id',
            restaurantId
          );

      if (error) {
        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo eliminar el plato.')
        );

        return;
      }

      setItems(
        (current) =>
          current.filter(
            (currentItem) =>
              currentItem.id !==
              item.id
          )
      );

      if (
        item.storage_path
      ) {
        const {
          error:
            storageError,
        } =
          await supabase.storage
            .from(
              MENU_IMAGE_BUCKET
            )
            .remove([
              item.storage_path,
            ]);

        if (
          storageError
        ) {
          console.warn(
            'El plato fue eliminado, pero su fotografía no pudo limpiarse de Storage:',
            storageError
          );

          setErrorMessage(
            `"${item.name}" fue eliminado, pero no se pudo limpiar su fotografía almacenada.`
          );

          return;
        }
      }

      setSuccessMessage(
        `"${item.name}" fue eliminado.`
      );
    } finally {
      setActionId(null);
    }
  }

  /* ======================================================== */
  /* TOGGLE AVAILABLE                                         */
  /* ======================================================== */

  async function handleAvailability(
    item: MenuItem
  ) {
    setActionId(item.id);

    const nextValue =
      !item.is_available;

    const { error } =
      await supabase
        .from('menu_items')
        .update({
          is_available:
            nextValue,
        })
        .eq(
          'id',
          item.id
        );

    if (error) {
      setErrorMessage(
        getUserFacingErrorMessage(
          error,
          'No se pudo actualizar la disponibilidad.'
        )
      );

      setActionId(null);

      return;
    }

    setItems(
      (current) =>
        current.map(
          (currentItem) =>
            currentItem.id ===
            item.id
              ? {
                  ...currentItem,
                  is_available:
                    nextValue,
                }
              : currentItem
        )
    );

    setActionId(null);
  }

  /* ======================================================== */
  /* TOGGLE FEATURED                                          */
  /* ======================================================== */

  async function handleFeatured(
    item: MenuItem
  ) {
    setActionId(item.id);

    const nextValue =
      !item.is_featured;

    const { error } =
      await supabase
        .from('menu_items')
        .update({
          is_featured:
            nextValue,
        })
        .eq(
          'id',
          item.id
        );

    if (error) {
      setErrorMessage(
        getUserFacingErrorMessage(
          error,
          'No se pudo actualizar el plato destacado.'
        )
      );

      setActionId(null);

      return;
    }

    setItems(
      (current) =>
        current.map(
          (currentItem) =>
            currentItem.id ===
            item.id
              ? {
                  ...currentItem,
                  is_featured:
                    nextValue,
                }
              : currentItem
        )
    );

    setActionId(null);
  }

  /* ======================================================== */
  /* CATEGORY                                                 */
  /* ======================================================== */

  function openCreateCategory() {
    setEditingCategoryId(
      null
    );
    setCategoryName('');
    setCategoryDescription('');
    setErrorMessage('');
    setShowCategoryModal(
      true
    );
  }

  function openEditCategory(
    category: MenuCategory
  ) {
    setEditingCategoryId(
      category.id
    );
    setCategoryName(
      category.name
    );
    setCategoryDescription(
      category.description ??
        ''
    );
    setErrorMessage('');
    setShowCategoryModal(
      true
    );
  }

  async function handleSaveCategory() {
    const cleanName =
      categoryName.trim();

    if (
      cleanName.length < 2
    ) {
      setErrorMessage(
        'Escribe un nombre válido para la categoría.'
      );

      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editingCategoryId) {
        const {
          data,
          error,
        } = await supabase
          .from(
            'menu_categories'
          )
          .update({
            name:
              cleanName,

            description:
              categoryDescription.trim() ||
              null,
          })
          .eq(
            'id',
            editingCategoryId
          )
          .eq(
            'restaurant_id',
            restaurantId
          )
          .select(`
            id,
            restaurant_id,
            name,
            description,
            sort_order,
            is_active
          `)
          .single();

        if (error) {
          setErrorMessage(
            getUserFacingErrorMessage(error, 'No se pudo actualizar la categoría.')
          );

          return;
        }

        setCategories(
          (current) =>
            current.map(
              (category) =>
                category.id ===
                editingCategoryId
                  ? (data as MenuCategory)
                  : category
            )
        );

        setSuccessMessage(
          `La categoría "${cleanName}" fue actualizada.`
        );
      } else {
        const {
          data,
          error,
        } = await supabase
          .from(
            'menu_categories'
          )
          .insert({
            restaurant_id:
              restaurantId,

            name:
              cleanName,

            description:
              categoryDescription.trim() ||
              null,

            sort_order:
              getNextCategoryOrder(
                categories
              ),

            is_active:
              true,
          })
          .select(`
            id,
            restaurant_id,
            name,
            description,
            sort_order,
            is_active
          `)
          .single();

        if (error) {
          setErrorMessage(
            getUserFacingErrorMessage(error, 'No se pudo crear la categoría.')
          );

          return;
        }

        setCategories(
          (current) => [
            ...current,
            data as MenuCategory,
          ]
        );

        setSuccessMessage(
          `La categoría "${cleanName}" fue creada.`
        );
      }

      setCategoryName('');
      setCategoryDescription('');
      setEditingCategoryId(
        null
      );
      setShowCategoryModal(
        false
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleCategory(
    category: MenuCategory
  ) {
    setActionId(
      category.id
    );
    setErrorMessage('');
    setSuccessMessage('');

    const nextValue =
      !category.is_active;

    try {
      const { error } =
        await supabase
          .from(
            'menu_categories'
          )
          .update({
            is_active:
              nextValue,
          })
          .eq(
            'id',
            category.id
          )
          .eq(
            'restaurant_id',
            restaurantId
          );

      if (error) {
        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo cambiar el estado de la categoría.')
        );

        return;
      }

      setCategories(
        (current) =>
          current.map(
            (currentCategory) =>
              currentCategory.id ===
              category.id
                ? {
                    ...currentCategory,
                    is_active:
                      nextValue,
                  }
                : currentCategory
          )
      );

      setSuccessMessage(
        nextValue
          ? `La categoría "${category.name}" está activa.`
          : `La categoría "${category.name}" fue desactivada.`
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  const confirm = useConfirm();

  async function handleDeleteCategory(
    category: MenuCategory
  ) {
    const itemCount =
      items.filter(
        (item) =>
          item.category_id ===
          category.id
      ).length;

    if (itemCount > 0) {
      setErrorMessage(
        `No puedes eliminar "${category.name}" porque contiene ${itemCount} ${itemCount === 1 ? 'plato' : 'platos'}. Mueve o elimina esos platos primero.`
      );

      return;
    }

    const confirmed =
      await confirm({
        title: `¿Eliminar la categoría "${category.name}"?`,
        description: 'Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar categoría',
        tone: 'danger',
      });

    if (!confirmed) {
      return;
    }

    setActionId(
      category.id
    );
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } =
        await supabase
          .from(
            'menu_categories'
          )
          .delete()
          .eq(
            'id',
            category.id
          )
          .eq(
            'restaurant_id',
            restaurantId
          );

      if (error) {
        setErrorMessage(
          getUserFacingErrorMessage(error, 'No se pudo eliminar la categoría.')
        );

        return;
      }

      setCategories(
        (current) =>
          current.filter(
            (currentCategory) =>
              currentCategory.id !==
              category.id
          )
      );

      if (
        selectedCategoryId ===
        category.id
      ) {
        setSelectedCategoryId(
          null
        );
      }

      setSuccessMessage(
        `La categoría "${category.name}" fue eliminada.`
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  /* ======================================================== */
  /* UI                                                       */
  /* ======================================================== */

  return (
    <div className="space-y-6">
      {/* ====================================================== */}
      {/* SUMMARY                                                */}
      {/* ====================================================== */}

      <section className="relative overflow-hidden rounded-sheet bg-ink p-6 text-white shadow-overlay sm:p-8">

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-white/40">
              <UtensilsCrossed className="h-3.5 w-3.5" />

              Tu carta gastronómica
            </div>

            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              {items.length}{' '}
              {items.length === 1
                ? 'plato'
                : 'platos'}{' '}
              en el menú
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              Organiza tu oferta y mantén actualizada la disponibilidad para tus
              clientes.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <SummaryStat
              value={
                categories.length
              }
              label="Categorías"
            />

            <SummaryStat
              value={
                availableCount
              }
              label="Disponibles"
            />

            <SummaryStat
              value={
                featuredCount
              }
              label="Destacados"
            />
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* ACTIONS                                                */}
      {/* ====================================================== */}

      <section className="rounded-sheet border border-border/70 bg-white p-5 shadow-none sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Administración
            </p>

            <h2 className="mt-1 text-lg font-bold text-ink">
              Gestiona tu menú
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={
                openCreateCategory
              }
              className="h-10 rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" />

              Nueva categoría
            </Button>

            <Button
              type="button"
              onClick={
                openNewItem
              }
              className="h-10 rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" />

              Agregar plato
            </Button>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* CATEGORIES                                             */}
      {/* ====================================================== */}

      <section className="rounded-sheet border border-border/70 bg-white p-5 shadow-none sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
              Categorías
            </p>

            <h2 className="mt-1 text-lg font-bold text-ink">
              Organiza las secciones de tu carta
            </h2>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Puedes editar, ocultar o eliminar categorías vacías.
            </p>
          </div>

          <span className="text-xs font-semibold text-muted-foreground">
            {categories.length}{' '}
            {categories.length === 1
              ? 'categoría'
              : 'categorías'}
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-canvas p-6 text-center">
            <p className="text-sm font-bold text-ink">
              Todavía no hay categorías
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crea la primera para empezar a organizar el menú.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {categories.map(
              (category) => {
                const categoryItemCount =
                  items.filter(
                    (item) =>
                      item.category_id ===
                      category.id
                  ).length;

                const busy =
                  actionId ===
                  category.id;

                return (
                  <article
                    key={
                      category.id
                    }
                    className={`rounded-2xl border p-4 transition ${
                      category.is_active
                        ? 'border-border/70 bg-white'
                        : 'border-border/50 bg-canvas opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-ink">
                            {category.name}
                          </h3>

                          <span
                            className={`rounded-full px-2 py-1 text-xs font-bold ${
                              category.is_active
                                ? 'bg-success-soft text-success'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {category.is_active
                              ? 'Activa'
                              : 'Oculta'}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-2 min-h-[36px] text-xs leading-[18px] text-muted-foreground">
                          {category.description ||
                            'Sin descripción.'}
                        </p>
                      </div>

                      {busy && (
                        <LoaderCircle className="h-4 w-4 flex-shrink-0 animate-spin text-action" />
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {categoryItemCount}{' '}
                        {categoryItemCount === 1
                          ? 'plato'
                          : 'platos'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            openEditCategory(
                              category
                            )
                          }
                          className="rounded-lg px-2.5 py-2 text-xs font-bold text-action transition hover:bg-primary/[0.06] disabled:opacity-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleToggleCategory(
                              category
                            )
                          }
                          className="rounded-lg px-2.5 py-2 text-xs font-bold text-ink transition hover:bg-muted disabled:opacity-50"
                        >
                          {category.is_active
                            ? 'Ocultar'
                            : 'Activar'}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleDeleteCategory(
                              category
                            )
                          }
                          className="rounded-lg px-2.5 py-2 text-xs font-bold text-danger transition hover:bg-danger-soft disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
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
      {/* FILTERS                                                */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-sheet border border-border/70 bg-white shadow-none">
        <div className="border-b border-border/60 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="flex w-max gap-2">
                <CategoryChip
                  label="Todo el menú"
                  active={
                    selectedCategoryId ===
                    null
                  }
                  onClick={() =>
                    setSelectedCategoryId(
                      null
                    )
                  }
                />

                {categories.map(
                  (category) => (
                    <CategoryChip
                      key={
                        category.id
                      }
                      label={
                        category.name
                      }
                      active={
                        selectedCategoryId ===
                        category.id
                      }
                      onClick={() =>
                        setSelectedCategoryId(
                          category.id
                        )
                      }
                    />
                  )
                )}
              </div>
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Buscar plato..."
                className="h-11 w-full rounded-xl border border-border bg-canvas pl-10 pr-4 text-sm outline-none transition focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/[0.06]"
              />
            </div>
          </div>
        </div>

        {/* ITEMS */}

        <div className="p-5 sm:p-6">
          {filteredItems.length ===
          0 ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-card border border-dashed border-border bg-canvas p-6 text-center">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <UtensilsCrossed className="h-5 w-5 text-action" />
                </div>

                <h3 className="mt-4 text-sm font-bold text-ink">
                  No encontramos platos
                </h3>

                <p className="mt-2 text-xs text-muted-foreground">
                  Agrega un plato nuevo o cambia los filtros.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map(
                (item) => (
                  <MenuItemCard
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                    categoryName={
                      categories.find(
                        (
                          category
                        ) =>
                          category.id ===
                          item.category_id
                      )?.name ??
                      'Sin categoría'
                    }
                    busy={
                      actionId ===
                      item.id
                    }
                    menuOpen={
                      openMenuId ===
                      item.id
                    }
                    onToggleMenu={() =>
                      setOpenMenuId(
                        openMenuId ===
                          item.id
                          ? null
                          : item.id
                      )
                    }
                    onEdit={() =>
                      openEditItem(
                        item
                      )
                    }
                    onDelete={() =>
                      handleDeleteItem(
                        item
                      )
                    }
                    onAvailability={() =>
                      handleAvailability(
                        item
                      )
                    }
                    onFeatured={() =>
                      handleFeatured(
                        item
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* ====================================================== */}
      {/* ITEM MODAL                                             */}
      {/* ====================================================== */}

      {showItemModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-sheet border border-border bg-white shadow-modal">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-white px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  {itemForm.id
                    ? 'Editar plato'
                    : 'Nuevo plato'}
                </p>

                <h2 className="mt-1 text-xl font-bold text-ink">
                  {itemForm.id
                    ? itemForm.name ||
                      'Editar'
                    : 'Agrega un plato al menú'}
                </h2>
              </div>

              <button
                type="button"
                disabled={
                  isSaving
                }
                onClick={() =>
                  setShowItemModal(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-7 p-6">
              {/* Preview + basic */}

              <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Fotografía
                  </p>

                  <div className="h-52 overflow-hidden rounded-2xl bg-surface-2">
                    {previewUrl ? (
                      <img
                        src={
                          previewUrl
                        }
                        alt="Vista previa"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="mx-auto h-7 w-7 text-muted-foreground/40" />

                          <p className="mt-2 text-xs text-muted-foreground">
                            Sin imagen
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    label="Nombre del plato"
                  >
                    <input
                      value={
                        itemForm.name
                      }
                      onChange={(
                        event
                      ) =>
                        setItemForm(
                          (
                            current
                          ) => ({
                            ...current,

                            name:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Ej. Vigorón tradicional"
                      className="form-input"
                    />
                  </FormField>

                  <FormField
                    label="Categoría"
                  >
                    <select
                      value={
                        itemForm.categoryId
                      }
                      onChange={(
                        event
                      ) =>
                        setItemForm(
                          (
                            current
                          ) => ({
                            ...current,

                            categoryId:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="form-input"
                    >
                      <option value="">
                        Sin categoría
                      </option>

                      {categories.map(
                        (
                          category
                        ) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {
                              category.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </FormField>

                  <FormField
                    label="Precio"
                  >
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-action">
                        C$
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          itemForm.price
                        }
                        onChange={(
                          event
                        ) =>
                          setItemForm(
                            (
                              current
                            ) => ({
                              ...current,

                              price:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        className="form-input price-input"
                      />
                    </div>
                  </FormField>
                </div>
              </div>

              <FormField
                label="Descripción"
              >
                <textarea
                  value={
                    itemForm.description
                  }
                  onChange={(
                    event
                  ) =>
                    setItemForm(
                      (
                        current
                      ) => ({
                        ...current,

                        description:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  rows={4}
                  placeholder="Describe el plato de forma atractiva..."
                  className="form-input min-h-28 resize-none py-3"
                />
              </FormField>

              <FormField
                label="Fotografía del plato"
                hint="JPG, PNG o WebP · máximo 8 MB · se optimiza automáticamente"
              >
                <div className="rounded-2xl border border-dashed border-border bg-canvas p-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleItemImageChange
                    }
                    disabled={
                      isSaving
                    }
                    className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary/10 file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-action hover:file:bg-primary/15"
                  />

                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {selectedFile
                      ? `Seleccionada: ${selectedFile.name}`
                      : itemForm.id && previewUrl
                        ? 'Puedes conservar la fotografía actual o seleccionar una nueva.'
                        : 'Selecciona una fotografía desde tu dispositivo.'}
                  </p>
                </div>
              </FormField>

              {/* Status */}

              <div>
                <p className="mb-3 text-xs font-bold text-ink">
                  Publicación
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <OptionToggle
                    icon={
                      CheckCircle2
                    }
                    title="Disponible"
                    description="Los usuarios pueden encontrar este plato."
                    active={
                      itemForm.isAvailable
                    }
                    onClick={() =>
                      setItemForm(
                        (
                          current
                        ) => ({
                          ...current,

                          isAvailable:
                            !current.isAvailable,
                        })
                      )
                    }
                  />

                  <OptionToggle
                    icon={Sparkles}
                    title="Destacado"
                    description="Resalta este plato dentro del menú."
                    active={
                      itemForm.isFeatured
                    }
                    onClick={() =>
                      setItemForm(
                        (
                          current
                        ) => ({
                          ...current,

                          isFeatured:
                            !current.isFeatured,
                        })
                      )
                    }
                    featured
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Etiquetas dietarias"
                  hint="Separadas por comas"
                >
                  <input
                    value={
                      itemForm.dietaryLabels
                    }
                    onChange={(
                      event
                    ) =>
                      setItemForm(
                        (
                          current
                        ) => ({
                          ...current,

                          dietaryLabels:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="vegetariano, sin gluten..."
                    className="form-input"
                  />
                </FormField>

                <FormField
                  label="Alérgenos"
                  hint="Separados por comas"
                >
                  <input
                    value={
                      itemForm.allergens
                    }
                    onChange={(
                      event
                    ) =>
                      setItemForm(
                        (
                          current
                        ) => ({
                          ...current,

                          allergens:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="leche, maní, huevo..."
                    className="form-input"
                  />
                </FormField>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-canvas px-6 py-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={
                  isSaving
                }
                onClick={() =>
                  setShowItemModal(
                    false
                  )
                }
                className="rounded-xl"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={
                  handleSaveItem
                }
                disabled={
                  isSaving
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
                    <CheckCircle2 className="mr-2 h-4 w-4" />

                    {itemForm.id
                      ? 'Guardar cambios'
                      : 'Agregar plato'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* CATEGORY MODAL                                         */}
      {/* ====================================================== */}

      {showCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-sheet border border-border bg-white shadow-modal">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-action">
                  Organización
                </p>

                <h2 className="mt-1 text-xl font-bold text-ink">
                  {editingCategoryId
                    ? 'Editar categoría'
                    : 'Nueva categoría'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(
                    false
                  );
                  setEditingCategoryId(
                    null
                  );
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <FormField
                label="Nombre"
              >
                <input
                  value={
                    categoryName
                  }
                  onChange={(
                    event
                  ) =>
                    setCategoryName(
                      event.target
                        .value
                    )
                  }
                  placeholder="Ej. Entradas"
                  className="form-input"
                />
              </FormField>

              <FormField
                label="Descripción"
              >
                <textarea
                  value={
                    categoryDescription
                  }
                  onChange={(
                    event
                  ) =>
                    setCategoryDescription(
                      event.target
                        .value
                    )
                  }
                  rows={3}
                  placeholder="Una breve descripción..."
                  className="form-input min-h-24 resize-none py-3"
                />
              </FormField>

              {errorMessage && (
                <div className="rounded-xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
                  {errorMessage}
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
                onClick={() => {
                  setShowCategoryModal(
                    false
                  );
                  setEditingCategoryId(
                    null
                  );
                }}
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
                  handleSaveCategory
                }
                className="rounded-xl"
              >
                {isSaving ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                    {editingCategoryId
                      ? 'Guardando...'
                      : 'Creando...'}
                  </>
                ) : (
                  <>
                    {editingCategoryId ? (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}

                    {editingCategoryId
                      ? 'Guardar cambios'
                      : 'Crear categoría'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .form-input {
          height: 48px;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: #f8faf9;
          padding-left: 1rem;
          padding-right: 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: hsl(var(--primary) / 0.35);
          background: white;
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.06);
        }

        .form-input.price-input {
          padding-left: 3.25rem;
        }
      `}</style>
    </div>
  );
}

/* ========================================================== */
/* ITEM CARD                                                  */
/* ========================================================== */

function MenuItemCard({
  item,
  categoryName,
  busy,
  menuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
  onAvailability,
  onFeatured,
}: {
  item: MenuItem;

  categoryName: string;

  busy: boolean;
  menuOpen: boolean;

  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAvailability: () => void;
  onFeatured: () => void;
}) {
  const imageUrl =
    getMenuItemImageUrl(
      item
    );

  return (
    <article
      className={`group overflow-hidden rounded-card border bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-raised ${
        item.is_available
          ? 'border-border/70'
          : 'border-border/50 opacity-70'
      }`}
    >
      {/* Image */}

      <div className="relative h-56 overflow-hidden bg-[#EEF2F0]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-ink backdrop-blur">
            {categoryName}
          </span>

          {item.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950">
              <Star className="h-2.5 w-2.5 fill-current" />

              Destacado
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <button
            type="button"
            disabled={busy}
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
            <div className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
              <ActionMenuButton
                icon={
                  Edit3
                }
                label="Editar plato"
                onClick={
                  onEdit
                }
              />

              <ActionMenuButton
                icon={
                  CheckCircle2
                }
                label={
                  item.is_available
                    ? 'Marcar no disponible'
                    : 'Marcar disponible'
                }
                onClick={
                  onAvailability
                }
              />

              <ActionMenuButton
                icon={
                  Sparkles
                }
                label={
                  item.is_featured
                    ? 'Quitar destacado'
                    : 'Marcar destacado'
                }
                onClick={
                  onFeatured
                }
              />

              <ActionMenuButton
                icon={
                  Trash2
                }
                label="Eliminar plato"
                onClick={
                  onDelete
                }
                destructive
              />
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-4">
          <span className="rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
            {formatPrice(
              item.price
            )}
          </span>
        </div>
      </div>

      {/* Info */}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-ink">
              {item.name}
            </h3>

            <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-muted-foreground">
              {item.description ||
                'Sin descripción.'}
            </p>
          </div>
        </div>

        {/* Labels */}

        {(item.dietary_labels.length >
          0 ||
          item.allergens.length >
            0) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.dietary_labels
              .slice(0, 2)
              .map(
                (label) => (
                  <span
                    key={
                      label
                    }
                    className="rounded-full bg-primary/[0.07] px-2 py-1 text-xs font-semibold text-action"
                  >
                    {label}
                  </span>
                )
              )}

            {item.allergens
              .slice(0, 1)
              .map(
                (
                  allergen
                ) => (
                  <span
                    key={
                      allergen
                    }
                    className="rounded-full bg-warning-soft px-2 py-1 text-xs font-semibold text-warning"
                  >
                    Contiene{' '}
                    {
                      allergen
                    }
                  </span>
                )
              )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold ${
              item.is_available
                ? 'text-success'
                : 'text-muted-foreground'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                item.is_available
                  ? 'bg-emerald-500'
                  : 'bg-slate-300'
              }`}
            />

            {item.is_available
              ? 'Disponible'
              : 'No disponible'}
          </span>

          <button
            type="button"
            onClick={
              onEdit
            }
            className="text-xs font-bold text-action transition hover:underline"
          >
            Editar
          </button>
        </div>
      </div>
    </article>
  );
}

/* ========================================================== */
/* SMALL COMPONENTS                                           */
/* ========================================================== */

function SummaryStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="min-w-[80px] rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-center backdrop-blur">
      <p className="text-xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-white/40">
        {label}
      </p>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold transition ${
        active
          ? 'bg-action text-white shadow-sm'
          : 'border border-border bg-canvas text-muted-foreground hover:border-primary/20 hover:text-action'
      }`}
    >
      {label}
    </button>
  );
}

function ActionMenuButton({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-xs font-semibold transition ${
        destructive
          ? 'text-danger hover:bg-danger-soft'
          : 'text-ink hover:bg-canvas'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />

      {label}
    </button>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;

  children:
    React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label className="text-xs font-bold text-ink">
          {label}
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

function OptionToggle({
  icon: Icon,
  title,
  description,
  active,
  onClick,
  featured = false,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  title: string;
  description: string;
  active: boolean;
  onClick: () => void;

  featured?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
        active
          ? featured
            ? 'border-warning/25 bg-warning-soft'
            : 'border-primary/20 bg-primary/[0.05]'
          : 'border-border bg-canvas'
      }`}
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
          active
            ? featured
              ? 'bg-amber-500 text-white'
              : 'bg-action text-white'
            : 'bg-white text-muted-foreground'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <p className="text-xs font-bold text-ink">
          {title}
        </p>

        <p className="mt-1 text-xs leading-4 text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}

/* ========================================================== */
/* HELPERS                                                    */
/* ========================================================== */

function parseList(
  value: string
) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
    )
  );
}

function getNextItemOrder(
  items: MenuItem[],
  categoryId: string | null
) {
  const orders =
    items
      .filter(
        (item) =>
          item.category_id ===
          categoryId
      )
      .map(
        (item) =>
          item.sort_order
      );

  return orders.length
    ? Math.max(
        ...orders
      ) + 1
    : 0;
}

function getNextCategoryOrder(
  categories: MenuCategory[]
) {
  const orders =
    categories.map(
      (category) =>
        category.sort_order
    );

  return orders.length
    ? Math.max(
        ...orders
      ) + 1
    : 0;
}

function formatPrice(
  price: number
) {
  return `C$${Number(
    price
  ).toLocaleString(
    'es-NI',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}

function getExtensionFromMimeType(
  mimeType: string
) {
  switch (
    mimeType
  ) {
    case 'image/png':
      return 'png';

    case 'image/webp':
      return 'webp';

    default:
      return 'jpg';
  }
}

function getMenuItemImageUrl(
  item: MenuItem
) {
  if (
    item.external_url
  ) {
    return item.external_url;
  }

  if (
    item.storage_path
  ) {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/menu-images/${item.storage_path}`;
  }

  return null;
}