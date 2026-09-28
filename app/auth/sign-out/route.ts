import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Server-side sign-out. Clears the session server-side (auth cookies are
 * removed via the server client's `setAll`) and returns to the sign-in page.
 * A POST-only handler avoids CSRF-style forced logouts via <img> tags.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();

  // signOut() also fails when the session is already expired — the local
  // cookies are cleared regardless, so this is intentionally non-fatal.
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/auth/sign-in?signedOut=1", request.url), {
    status: 303,
  });
}
