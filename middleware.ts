import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log(`\n[Middleware START] ================================`);
  console.log(`[Middleware] Request Path: ${path}`);
  console.log(`[Middleware] Incoming Cookies: ${request.cookies.getAll().map(c => c.name).join(', ')}`);

  // 1. Initial Response Setup
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Supabase SSR Client setup with strict cookie sync
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          console.log(`[Middleware] setAll called - Updating ${cookiesToSet.length} cookies`);
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set({ name, value, ...options })
          );
        },
      },
    }
  );

  // 3. User Session Fetch (with explicit error catching)
  console.log(`[Middleware] Fetching user session via getUser()...`);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.log(`[Middleware] Auth Error: ${authError.message}`);
  }

  if (user) {
    console.log(`[Middleware] User Found: ${user.email} (ID: ${user.id})`);
  } else {
    console.log(`[Middleware] No User Session Found.`);
  }

  // 4. Route Definitions
  const isDashboardRoute = path.startsWith('/dashboard');
  const isAdminRoute = path.startsWith('/admin');
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');

  console.log(`[Middleware] Route Checks -> Dashboard: ${isDashboardRoute}, Admin: ${isAdminRoute}, Auth: ${isAuthRoute}`);

  // Helper Function for Flawless Redirects with Cookies
  const applyRedirect = (targetPath: string) => {
    console.log(`[Middleware] Executing Redirect to: ${targetPath}`);
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = targetPath;
    const redirectRes = NextResponse.redirect(targetUrl);
    
    const cookiesToPass = supabaseResponse.cookies.getAll();
    console.log(`[Middleware] Passing ${cookiesToPass.length} cookies to redirect response`);

    cookiesToPass.forEach((cookie) => {
      const { name, value, ...options } = cookie;
      redirectRes.cookies.set({ name, value, ...options });
    });
    
    return redirectRes;
  };

  // Logic 1: Guest trying to access protected routes
  if (!user && (isDashboardRoute || isAdminRoute)) {
    console.log("[Middleware] Logic 1 Triggered: Guest on protected route. Redirecting to /login");
    return applyRedirect('/login');
  }

  // Logic 2: Logged in user trying to access auth pages
  if (user && isAuthRoute) {
    console.log("[Middleware] Logic 2 Triggered: Logged-in user on auth route. Redirecting to /dashboard");
    return applyRedirect('/dashboard');
  }

  // Logic 3: Admin Role Protection via Updated RPC
  if (user && isAdminRoute) {
    console.log(`[Middleware] Logic 3 Triggered: Checking Admin Role via RPC for: ${user.email}`);
    
    // Yahan hum explicitly user.id bhej rahay hain taake Edge par auth context fail na ho
    const { data: role, error: rpcError } = await supabase.rpc('get_user_role', { 
      user_id: user.id 
    });

    if (rpcError) {
      console.log(`[Middleware] RPC Error Details:`, rpcError);
    } else {
      console.log(`[Middleware] RPC Returned Role: ${role}`);
    }

    if (rpcError || role !== 'admin') {
      console.log("[Middleware] Not an Admin (or RPC failed)! Redirecting to /dashboard");
      return applyRedirect('/dashboard');
    }
    console.log("[Middleware] Admin Verified successfully!");
  }

  console.log(`[Middleware END] Passing request through to: ${path}`);
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};