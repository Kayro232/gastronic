'use client';

import {
  useEffect,
  useState,
} from 'react';

import { motion } from 'framer-motion';

import {
  Cake,
  ChefHat,
  Coffee,
  Crown,
  DollarSign,
  Fish,
  Flame,
  Globe,
  Sparkles,
  Users,
  Utensils,
  Wine,
  Zap,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface CategoryChipsProps {
  selectedCategoryId:
    | string
    | null;

  onSelectCategory: (
    categoryId:
      | string
      | null
  ) => void;
}

function getCategoryIcon(
  icon: string | null,
  slug: string
) {
  const iconName = (
    icon || slug
  ).toLowerCase();

  switch (iconName) {
    case 'coffee':
    case 'cafe':
      return Coffee;

    case 'fish':
    case 'mariscos':
      return Fish;

    case 'cake':
    case 'postres':
      return Cake;

    case 'flame':
    case 'asados':
      return Flame;

    case 'zap':
    case 'comida-rapida':
      return Zap;

    case 'globe':
    case 'internacional':
      return Globe;

    case 'users':
    case 'buffet':
      return Users;

    case 'wine':
    case 'bar-grill':
      return Wine;

    case 'dollar-sign':
    case 'economico':
      return DollarSign;

    case 'crown':
    case 'premium':
      return Crown;

    case 'chef-hat':
      return ChefHat;

    case 'utensils':
    case 'comida-tipica':
    default:
      return Utensils;
  }
}

export function CategoryChips({
  selectedCategoryId,
  onSelectCategory,
}: CategoryChipsProps) {
  const [
    categories,
    setCategories,
  ] = useState<Category[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    async function fetchCategories() {
      setIsLoading(true);
      setErrorMessage('');

      const {
        data,
        error,
      } = await supabase
        .from('categories')
        .select(
          'id, name, slug, icon'
        )
        .eq('is_active', true)
        .order('name', {
          ascending: true,
        });

      if (error) {
        console.error(
          'Error cargando categorías:',
          error
        );

        setCategories([]);

        setErrorMessage(
          'No se pudieron cargar las categorías.'
        );
      } else {
        setCategories(
          data ?? []
        );
      }

      setIsLoading(false);
    }

    fetchCategories();
  }, []);

  function handleCategoryClick(
    categoryId: string
  ) {
    onSelectCategory(
      selectedCategoryId ===
        categoryId
        ? null
        : categoryId
    );
  }

  if (isLoading) {
    return (
      <div className="flex gap-2.5 overflow-hidden">
        {[
          1, 2, 3, 4, 5, 6,
        ].map((item) => (
          <div
            key={item}
            className="h-11 w-32 flex-shrink-0 animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-2 scrollbar-hide">
      <div className="flex w-max min-w-full gap-2.5">
        {/* Todas */}
        <CategoryButton
          selected={
            selectedCategoryId ===
            null
          }
          icon={Sparkles}
          onClick={() =>
            onSelectCategory(null)
          }
        >
          Todas
        </CategoryButton>

        {categories.map(
          (category) => {
            const Icon =
              getCategoryIcon(
                category.icon,
                category.slug
              );

            return (
              <CategoryButton
                key={category.id}
                selected={
                  selectedCategoryId ===
                  category.id
                }
                icon={Icon}
                onClick={() =>
                  handleCategoryClick(
                    category.id
                  )
                }
              >
                {category.name}
              </CategoryButton>
            );
          }
        )}
      </div>
    </div>
  );
}

function CategoryButton({
  selected,
  icon: Icon,
  onClick,
  children,
}: {
  selected: boolean;
  icon: React.ComponentType<{
    className?: string;
  }>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{
        y: -1,
      }}
      whileTap={{
        scale: 0.98,
      }}
      className={`group flex h-11 flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border px-4 text-sm font-semibold transition ${
        selected
          ? 'border-primary bg-action text-white shadow-overlay'
          : 'border-border/80 bg-white text-ink shadow-none hover:border-primary/25 hover:bg-primary/[0.035]'
      }`}
    >
      <Icon
        className={`h-4 w-4 transition ${
          selected
            ? 'text-white'
            : 'text-action'
        }`}
      />

      {children}
    </motion.button>
  );
}