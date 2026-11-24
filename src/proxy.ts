import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isSupabaseLive } from '@/lib/supabase/status';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isProtectedPath = pathname.startsWith('/dashboard') || pathname === '/mfa';
  const isAuthPath = pathname === '/login' || pathname === '/register';
  if (!isProtectedPath && !isAuthPath) return response;

  if (!isSupabaseLive() || !supabaseUrl || !supabaseAnonKey) {
    if (isProtectedPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const authResult = await supabase.auth.getUser().catch(() => null);
  if (!authResult) {
    if (isProtectedPath) {
      return NextResponse.json(
        { error: 'Layanan autentikasi sedang tidak tersedia. Coba lagi.' },
        { status: 503 }
      );
    }
    return response;
  }

  const { data: { user }, error } = authResult;

  if ((error || !user) && isProtectedPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!error && user && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
