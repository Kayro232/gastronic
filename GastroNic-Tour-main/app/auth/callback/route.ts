 import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { createClient } from '@/lib/supabase/server';

const ALLOWED_NEXT_PATHS = new Set([
  '/auth/update-password',
]);

export async function GET(
  request: NextRequest
) {
  const code =
    request.nextUrl.searchParams.get(
      'code'
    );

  const requestedNext =
    request.nextUrl.searchParams.get(
      'next'
    );

  const next =
    requestedNext &&
    ALLOWED_NEXT_PATHS.has(
      requestedNext
    )
      ? requestedNext
      : '/auth/login';

  if (!code) {
    return NextResponse.redirect(
      new URL(
        '/auth/forgot-password?error=invalid_link',
        request.url
      )
    );
  }

  const supabase =
    await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(
      code
    );

  if (error) {
    console.error(
      'Error intercambiando código de recuperación:',
      error
    );

    return NextResponse.redirect(
      new URL(
        '/auth/forgot-password?error=invalid_link',
        request.url
      )
    );
  }

  return NextResponse.redirect(
    new URL(next, request.url)
  );
}
