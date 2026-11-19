'use client';

import {
  Banknote,
  Check,
} from 'lucide-react';

interface BudgetOption {
  label: string;
  shortLabel: string;
  min: number | null;
  max: number | null;
}

interface BudgetFilterProps {
  selectedMinPrice:
    | number
    | null;

  selectedMaxPrice:
    | number
    | null;

  onSelectBudget: (
    minPrice:
      | number
      | null,

    maxPrice:
      | number
      | null
  ) => void;
}

const budgetOptions: BudgetOption[] =
  [
    {
      label: 'Todos',
      shortLabel: 'C$',
      min: null,
      max: null,
    },

    {
      label: 'Hasta C$200',
      shortLabel: 'C$',
      min: 0,
      max: 200,
    },

    {
      label:
        'C$200 - C$400',
      shortLabel: 'C$$',
      min: 200,
      max: 400,
    },

    {
      label:
        'C$400 - C$700',
      shortLabel: 'C$$',
      min: 400,
      max: 700,
    },

    {
      label:
        'C$700 - C$1,000',
      shortLabel: 'C$$$',
      min: 700,
      max: 1000,
    },

    {
      label: 'C$1,000+',
      shortLabel: 'C$$$$',
      min: 1000,
      max: null,
    },
  ];

export function BudgetFilter({
  selectedMinPrice,
  selectedMaxPrice,
  onSelectBudget,
}: BudgetFilterProps) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-2 scrollbar-hide">
      <div className="flex w-max min-w-full gap-2.5">
        {budgetOptions.map(
          (option) => {
            const isSelected =
              selectedMinPrice ===
                option.min &&
              selectedMaxPrice ===
                option.max;

            return (
              <button
                key={option.label}
                type="button"
                onClick={() =>
                  onSelectBudget(
                    option.min,
                    option.max
                  )
                }
                className={`group flex h-11 flex-shrink-0 items-center gap-2.5 whitespace-nowrap rounded-2xl border px-4 text-sm font-semibold transition duration-200 ${
                  isSelected
                    ? 'border-primary bg-action text-white shadow-overlay'
                    : 'border-border/80 bg-white text-ink shadow-none hover:border-primary/25 hover:bg-primary/[0.035]'
                }`}
              >
                <div
                  className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-xs font-bold tracking-[-0.08em] transition ${
                    isSelected
                      ? 'bg-white/15 text-white'
                      : 'bg-primary/[0.08] text-action'
                  }`}
                >
                  {option.shortLabel}
                </div>

                {option.label}

                {isSelected && (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
            );
          }
        )}
      </div>  
    </div>
  );
}