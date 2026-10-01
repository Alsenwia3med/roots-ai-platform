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

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        // 1. Mirror the new cookies onto the request so downstream Server
        //    Components / Route Handlers created in this request see them.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // 2. Recreate the response and persist the cookies on the client.
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
        // 3. Responses that set auth cookies must not be cached.
        Object.entries(headersToSet).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value)
        );
      },
    },
  });

  // IMPORTANT: do not remove — without this call the client never loads the
  // session from cookies, so expired tokens would never be refreshed (and
  // setAll above would never run).
  await supabase.auth.getClaims();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on everything except static assets and Next.js internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
