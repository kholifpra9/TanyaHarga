import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Cukup panggil getUser() supaya token session di-refresh otomatis kalau perlu.
  // TIDAK ada logic redirect/blokir di sini — semua halaman tetap bisa diakses,
  // pengecekan kuota dilakukan di masing-masing Route Handler (section 6).
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: ['/report-price/:path*', '/api/:path*'],
};