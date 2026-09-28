import type { Metadata } from "next";
import { SystemCard, SystemShell } from "../../../components/system/SystemShell";
import { MagicLinkSignIn } from "../../../components/auth/MagicLinkSignIn";

export const metadata: Metadata = {
  title: "Sign in — ROOTS-AI™",
  description: "Sign in to the ROOTS-AI platform with a secure magic link.",
};

// Only forward same-origin relative paths (the callback re-sanitizes too).
function safeRedirectPath(next: string | null): string | undefined {
  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
  ) {
    return next;
  }
  return undefined;
}

export default function SignInPage({
  searchParams,
}: {
  searchParams?: { next?: string; error?: string; signedOut?: string };
}) {
  const next = safeRedirectPath(searchParams?.next ?? null);
  const initialError = searchParams?.error ? decodeURIComponent(searchParams.error).slice(0, 300) : undefined;
  const signedOut = searchParams?.signedOut === "1";

  return (
    <SystemShell title="Sign in to ROOTS-AI">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-0">
        <SystemCard>
          <h2 className="text-xl font-bold text-[#1A2A4A]">Welcome back</h2>
          <p className="mt-2 text-sm text-[#5B6577]">
            Enter your email and we will send you a secure, one-time sign-in link.
          </p>
          <div className="mt-6">
            <MagicLinkSignIn next={next} initialError={initialError} signedOut={signedOut} />
          </div>
        </SystemCard>
      </div>
    </SystemShell>
  );
}
