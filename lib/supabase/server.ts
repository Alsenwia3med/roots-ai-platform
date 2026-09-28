import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Creates a Supabase client for use in Server Components, Server Actions and
 * Route Handlers. A new client MUST be created per request — never cache or
 * share this one across requests.
 *
 * Cookie handling follows the official @supabase/ssr pattern:
 *  - `getAll` feeds the request cookies to the client (session read).
 *  - `setAll` writes refreshed session cookies back to the response
 *    (session persistence). Inside Server Components cookies cannot be
 *    mutated, so those failures are swallowed — `middleware.ts` guarantees
 *    token refreshes are always persisted.
 */
export function createClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined (see .env.local)."
    );
  }

  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore as long as middleware.ts keeps refreshing the
          // session — see Supabase SSR guides for Next.js App Router.
        }
      },
    },
  });
}

/**
 * Returns the user for the current request, verified against the Supabase
 * Auth server (`getUser()` validates the access token server-side; do not
 * trust the user object from `getSession()` in cookies). Returns null when
 * signed out or when the session is invalid/expired and could not refresh.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data.user;
}
