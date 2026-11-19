'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ChevronDown,
  LoaderCircle,
  MapPin,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface Department {
  id: string;
  name: string;
}

interface Municipality {
  id: string;
  name: string;
  department:
    | Department
    | Department[]
    | null;
}

interface LocationFilterProps {
  selectedMunicipalityId:
    | string
    | null;

  onSelectMunicipality: (
    municipalityId:
      | string
      | null
  ) => void;
}

function getDepartment(
  department:
    | Department
    | Department[]
    | null
) {
  if (!department) {
    return null;
  }

  return Array.isArray(
    department
  )
    ? department[0] ?? null
    : department;
}

export function LocationFilter({
  selectedMunicipalityId,
  onSelectMunicipality,
}: LocationFilterProps) {
  const [
    municipalities,
    setMunicipalities,
  ] = useState<Municipality[]>(
    []
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    async function fetchMunicipalities() {
      setIsLoading(true);
      setErrorMessage('');

      const {
        data,
        error,
      } = await supabase
        .from('municipalities')
        .select(`
          id,
          name,

          department:departments (
            id,
            name
          )
        `)
        .order('name', {
          ascending: true,
        });

      if (error) {
        console.error(
          'Error cargando municipios:',
          error
        );

        setMunicipalities([]);

        setErrorMessage(
          'No se pudieron cargar las ubicaciones.'
        );

        setIsLoading(false);
        return;
      }

      setMunicipalities(
        (data ??
          []) as unknown as Municipality[]
      );

      setIsLoading(false);
    }

    fetchMunicipalities();
  }, []);

  const selectedMunicipality =
    useMemo(
      () =>
        municipalities.find(
          (municipality) =>
            municipality.id ===
            selectedMunicipalityId
        ) ?? null,
      [
        municipalities,
        selectedMunicipalityId,
      ]
    );

  const selectedDepartment =
    selectedMunicipality
      ? getDepartment(
          selectedMunicipality.department
        )
      : null;

  if (isLoading) {
    return (
      <div className="flex h-12 w-full max-w-md items-center gap-3 rounded-2xl border border-border/70 bg-white px-4 text-sm text-muted-foreground shadow-sm">
        <LoaderCircle className="h-4 w-4 animate-spin text-action" />

        Cargando ubicaciones...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="max-w-md rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <div className="group relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-primary/[0.08]">
          <MapPin className="h-4 w-4 text-action" />
        </div>

        <select
          value={
            selectedMunicipalityId ??
            ''
          }
          onChange={(event) =>
            onSelectMunicipality(
              event.target.value ||
                null
            )
          }
          className="h-14 w-full cursor-pointer appearance-none rounded-2xl border border-border/70 bg-white py-2 pl-14 pr-11 text-sm font-semibold text-ink shadow-none outline-none transition hover:border-primary/25 hover:shadow-md focus:border-primary/30 focus:ring-4 focus:ring-primary/[0.07]"
        >
          <option value="">
            Toda Nicaragua
          </option>

          {municipalities.map(
            (municipality) => {
              const department =
                getDepartment(
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
                  {municipality.name}
                  {department
                    ? `, ${department.name}`
                    : ''}
                </option>
              );
            }
          )}
        </select>

        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition group-hover:text-action" />
      </div>

      {selectedMunicipality && (
        <p className="mt-2 pl-1 text-xs text-muted-foreground">
          Explorando{' '}
          <span className="font-semibold text-action">
            {
              selectedMunicipality.name
            }
          </span>

          {selectedDepartment &&
            ` · ${selectedDepartment.name}`}
        </p>
      )}
    </div>
  );
}