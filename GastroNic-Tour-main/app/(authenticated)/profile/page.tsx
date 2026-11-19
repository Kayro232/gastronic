import {
  CalendarDays,
  Heart,
  MapPin,
  MessageSquareText,
  Route,
} from 'lucide-react';

import { MainLayout } from '@/components/layout/main-layout';
import { UserProfile } from '@/components/profile/user-profile';
import { GastronomicProfile } from '@/components/profile/gastronomic-profile';
import { PointsDisplay } from '@/components/gamification/points-display';
import { BadgesDisplay } from '@/components/gamification/badges-display';
import { VisitedRestaurants } from '@/components/profile/visited-restaurants';
import { FavoriteRestaurants } from '@/components/profile/favorite-restaurants';
import { CompletedRoutes } from '@/components/profile/completed-routes';
import { UserReservations } from '@/components/profile/user-reservations';
import { UserReviews } from '@/components/profile/user-reviews';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function ProfilePage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-canvas pb-24 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 md:py-16 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-action sm:text-xs sm:tracking-[0.08em]">
              Tu espacio en GastroNic
            </p>

            <h1 className="mt-1.5 text-[2rem] font-bold tracking-[-0.035em] text-ink sm:mt-2 sm:text-4xl">
              Mi perfil
            </h1>

            <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-muted-foreground sm:mt-2 sm:text-sm sm:leading-6">
              Reúne tu identidad gastronómica, progreso, reservaciones, lugares
              favoritos, visitas, reseñas y rutas en un solo espacio.
            </p>
          </div>

          <UserProfile />

          <GastronomicProfile />

          <div className="mt-5 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-2">
            <PointsDisplay />
            <BadgesDisplay />
          </div>

          <section className="mt-9 sm:mt-12">
            <div className="mb-4 sm:mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-action sm:text-xs sm:tracking-[0.08em]">
                Tu actividad
              </p>

              <h2 className="mt-1.5 text-[1.55rem] font-bold tracking-[-0.025em] text-ink sm:mt-2 sm:text-3xl">
                Tu recorrido gastronómico
              </h2>

              <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-muted-foreground sm:mt-2 sm:text-sm">
                Consulta todo lo que has ido construyendo dentro de GastroNic.
              </p>
            </div>

            <Tabs
              defaultValue="visited"
              className="w-full"
            >
              <div className="-mx-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0">
                <TabsList className="inline-flex h-auto min-w-max gap-1.5 rounded-2xl border border-border/70 bg-white p-1 shadow-sm sm:gap-2 sm:p-1.5">
                  <ProfileTab
                    value="visited"
                    icon={MapPin}
                    label="Visitados"
                  />

                  <ProfileTab
                    value="reservations"
                    icon={CalendarDays}
                    label="Reservaciones"
                  />

                  <ProfileTab
                    value="favorites"
                    icon={Heart}
                    label="Favoritos"
                  />

                  <ProfileTab
                    value="routes"
                    icon={Route}
                    label="Rutas"
                  />

                  <ProfileTab
                    value="reviews"
                    icon={MessageSquareText}
                    label="Reseñas"
                  />
                </TabsList>
              </div>

              <TabsContent
                value="visited"
                className="mt-5 sm:mt-8"
              >
                <VisitedRestaurants />
              </TabsContent>

              <TabsContent
                value="reservations"
                className="mt-5 sm:mt-8"
              >
                <UserReservations />
              </TabsContent>

              <TabsContent
                value="favorites"
                className="mt-5 sm:mt-8"
              >
                <FavoriteRestaurants />
              </TabsContent>

              <TabsContent
                value="routes"
                className="mt-5 sm:mt-8"
              >
                <CompletedRoutes />
              </TabsContent>

              <TabsContent
                value="reviews"
                className="mt-5 sm:mt-8"
              >
                <UserReviews />
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

function ProfileTab({
  value,
  icon:
    Icon,
  label,
}: {
  value:
    string;

  icon:
    React.ComponentType<{
      className?: string;
    }>;

  label:
    string;
}) {
  return (
    <TabsTrigger
      value={
        value
      }
      className="gap-1.5 rounded-xl px-3 py-2 text-xs data-[state=active]:bg-action data-[state=active]:text-white sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
    >
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />

      {label}
    </TabsTrigger>
  );
}
