import { MainLayout } from '@/components/layout/main-layout';
import { RouteDetail } from '@/components/routes/route-detail';

type RoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RoutePage({
  params,
}: RoutePageProps) {
  const { id } = await params;

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <RouteDetail routeId={id} />
      </div>
    </MainLayout>
  );
}