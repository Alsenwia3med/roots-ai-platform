import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Creates a Supabase client for use in Client Components ("use client").
 *
 * The session is persisted in cookies (see @supabase/ssr), so a session
 * started in the browser is immediately readable by Server Components,
 * Route Handlers and the middleware. Uses the PKCE auth flow, which pairs
 * with `app/auth/callback/route.ts` for Magic Link sign-in.
 *
 * In the browser `createBrowserClient` returns a cached singleton, so it is
 * safe to call this from module scope or inside a component. Never import
 * this module from Server Components / Route Handlers — use
 * `lib/supabase/server.ts` there instead, and never use the anon-key client
 * to bypass RLS.
 */
export function createClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined (see .env.local)."
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
