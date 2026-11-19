import { MainLayout } from '@/components/layout/main-layout';

import { SmartRouteBuilder } from '@/components/routes/smart-route-builder';

export default function CreateSmartRoutePage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-canvas py-8 sm:py-12 lg:py-16">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <SmartRouteBuilder />

        </div>

      </div>
    </MainLayout>
  );
}