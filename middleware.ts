import { NextResponse, type NextRequest } from "next/server";

/**
 * Keep the edge middleware intentionally dependency-free so public routes can
 * render on Vercel even when optional authentication configuration is absent.
 * Authentication is handled by the dedicated Supabase server/client modules.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    // Run on everything except static assets and Next.js internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
