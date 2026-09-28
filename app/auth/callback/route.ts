import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Magic Link callback — the URL Supabase Auth redirects to after a user
 * clicks the link in their email (configured as `emailRedirectTo` in the
 * sign-in form). Runs the PKCE exchange: `?code=...` -> session cookies on
 * this response, which is what actually persists the login server-side.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (!code) {
    // Either Auth reported a failure (error / error_code params) or the link
    // was mangled (e.g. email scanners stripping query params).
    const reason =
      searchParams.get("error_description") ??
      searchParams.get("error") ??
      "The sign-in link is missing its authorization code. Copy the full link from the email into your browser address bar.";
    return redirectToSignIn(origin, next, reason);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Common causes: the link was already used (codes are single-use),
    // it expired, or it was opened in a different browser than the one that
    // requested it (the PKCE verifier cookie lives in the original browser).
    return redirectToSignIn(origin, next, error.message);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

/**
 * Only allow same-origin absolute paths ("/...", never "//host" or
 * "/\host") so the `next` parameter can never be abused as an open redirect.
 */
function safeRedirectPath(next: string | null): string {
  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
  ) {
    return next;
  }
  return "/";
}

function redirectToSignIn(origin: string, next: string, reason: string) {
  const params = new URLSearchParams();
  params.set("error", reason.slice(0, 300));
  if (next !== "/") {
    params.set("next", next);
  }
  return NextResponse.redirect(`${origin}/auth/sign-in?${params.toString()}`, {
    status: 303,
  });
}
