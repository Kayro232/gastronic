import { redirect } from 'next/navigation';

import {
  Settings2,
} from 'lucide-react';

import { OwnerLayout } from '@/components/owner/owner-layout';
import { OwnerSettingsForm } from '@/components/owner/owner-settings-form';
import { createClient } from '@/lib/supabase/server';

export default async function OwnerSettingsPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect('/owner/login');
  }

  const [
    profileResult,
    privateResult,
    settingsResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        username,
        avatar_path,
        bio,
        created_at
      `)
      .eq('id', user.id)
      .maybeSingle(),

    supabase
      .from('user_private_data')
      .select(`
        phone
      `)
      .eq('user_id', user.id)
      .maybeSingle(),

    supabase
      .from('user_settings')
      .select(`
        language,
        theme,
        email_notifications,
        push_notifications,
        route_notifications,
        review_notifications
      `)
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    console.error(
      'Error cargando perfil:',
      profileResult.error
    );
  }

  if (privateResult.error) {
    console.error(
      'Error cargando datos privados:',
      privateResult.error
    );
  }

  if (settingsResult.error) {
    console.error(
      'Error cargando preferencias:',
      settingsResult.error
    );
  }

  if (!profileResult.data) {
    redirect('/owner/dashboard');
  }

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1450px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-action">
                <Settings2 className="h-3.5 w-3.5" />

                Cuenta
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl">
                Configuración
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Administra tu identidad, datos de contacto y preferencias del
                portal GastroNic Business.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Cuenta
              </p>

              <p className="mt-1 max-w-[260px] truncate text-sm font-bold text-ink">
                {user.email}
              </p>
            </div>
          </header>

          <div className="mt-7">
            <OwnerSettingsForm
              email={
                user.email ?? ''
              }
              createdAt={
                profileResult.data.created_at
              }
              initialProfile={{
                fullName:
                  profileResult.data.full_name ??
                  '',

                username:
                  profileResult.data.username ??
                  '',

                bio:
                  profileResult.data.bio ??
                  '',

                avatarPath:
                  profileResult.data.avatar_path ??
                  null,

                phone:
                  privateResult.data?.phone ??
                  '',
              }}
              initialSettings={{
                language:
                  settingsResult.data?.language ??
                  'es',

                theme:
                  settingsResult.data?.theme ??
                  'system',

                emailNotifications:
                  settingsResult.data?.email_notifications ??
                  true,

                pushNotifications:
                  settingsResult.data?.push_notifications ??
                  true,

                routeNotifications:
                  settingsResult.data?.route_notifications ??
                  true,

                reviewNotifications:
                  settingsResult.data?.review_notifications ??
                  true,
              }}
            />
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}