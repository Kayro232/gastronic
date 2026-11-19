'use client';

import { ErrorScreen } from '@/components/common/error-screen';
import { MainLayout } from '@/components/layout/main-layout';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <MainLayout>
      <ErrorScreen error={error} reset={reset} homeHref="/home" homeLabel="Ir al inicio" />
    </MainLayout>
  );
}
