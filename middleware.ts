import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every request so cookies stay valid.
 *
 * Server Components cannot write cookies, so without this middleware an
 * expired access token would never be refreshed and users would be randomly
 * logged out. `@supabase/ssr` stores the session in chunks in the response
 * cookies, hence `setAll` must rebuild the response and copy both the new
 * cookies and the accompanying no-store cache headers (a response carrying
 * auth cookies must never be cached by a CDN/proxy).
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Keep public pages available when Supabase variables are not configured
  // (for example, during a preview deployment). Auth/session refresh is
  // skipped until both public variables are supplied in the deployment.
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
          Object.entries(headersToSet).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    });

    await supabase.auth.getClaims();
    return supabaseResponse;
  } catch {
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    // Run on everything except static assets and Next.js internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
