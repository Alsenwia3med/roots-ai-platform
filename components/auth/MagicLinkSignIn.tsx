"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "../../lib/supabase/client";
import { systemButton } from "../system/SystemShell";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_COOLDOWN_SECONDS = 60;

type Status = "idle" | "sending" | "sent" | "error";

export function MagicLinkSignIn({
  next,
  initialError,
  signedOut,
}: {
  next?: string;
  initialError?: string;
  signedOut?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(initialError ? "error" : "idle");
  const [message, setMessage] = useState<string | null>(initialError ?? null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
      return;
    }
    cooldownTimer.current = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, [cooldown]);

  const sendMagicLink = useCallback(async (address: string) => {
    setStatus("sending");
    setMessage(null);
    try {
      const supabase = createClient();
      // PKCE flow: the browser client stores the code verifier in a cookie;
      // the callback route on THIS origin exchanges it for the session.
      const callbackUrl = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: address,
        options: {
          emailRedirectTo: callbackUrl,
          shouldCreateUser: true, // DB trigger 0001 creates the matching profile row.
        },
      });
      if (error) {
        setStatus("error");
        setMessage(describeAuthError(error.message, error.status, error.name));
        return;
      }
      setStatus("sent");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof TypeError
          ? "Could not reach the sign-in service. Check your connection and try again."
          : "Something went wrong while sending the sign-in link. Please try again."
      );
    }
  }, [next]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(address)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    await sendMagicLink(address);
  }

  const sending = status === "sending";

  return (
    <div className="space-y-6">
      {signedOut && status !== "sent" ? (
        <p className="rounded-lg border border-[#D8DEE8] bg-[#EEF2F8] px-4 py-3 text-sm text-[#1A2A4A]" role="status">
          You have been signed out.
        </p>
      ) : null}

      {status === "sent" ? (
        <div className="rounded-lg border border-[#D8DEE8] bg-white px-4 py-5" role="status" aria-live="polite">
          <p className="text-sm font-semibold text-[#1A2A4A]">Check your inbox</p>
          <p className="mt-1 text-sm text-[#1A1A1A]">
            We sent a magic sign-in link to <span className="font-semibold">{email.trim().toLowerCase()}</span>.
            Open it in this same browser to continue. It expires after a short time.
          </p>
          <button
            type="button"
            onClick={() => sendMagicLink(email.trim().toLowerCase())}
            disabled={cooldown > 0 || sending}
            className={`${systemButton} mt-4 border border-[#1A2A4A] text-[#1A2A4A] hover:bg-[#1A2A4A] hover:text-white disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {sending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend link"}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="magic-link-email" className="block text-sm font-semibold text-[#1A2A4A]">
              Email address
            </label>
            <input
              id="magic-link-email"
              type="email"
              name="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={message ? "magic-link-feedback" : "magic-link-hint"}
              aria-invalid={status === "error"}
              className="mt-2 block min-h-11 w-full rounded-lg border border-[#D8DEE8] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#8A93A5] focus:border-[#1A2A4A] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#1A2A4A]"
              placeholder="you@example.com"
            />
            <p id="magic-link-hint" className="mt-2 text-xs text-[#5B6577]">
              No password needed — we email you a one-time secure sign-in link.
            </p>
          </div>

          {message ? (
            <p id="magic-link-feedback" role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={sending}
            className={`${systemButton} w-full bg-[#1A2A4A] text-white hover:bg-[#24365C] disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {sending ? "Sending link…" : "Send magic link"}
          </button>
        </form>
      )}
    </div>
  );
}

function describeAuthError(
  rawMessage: string,
  status?: string | number,
  name?: string
): string {
  const message = rawMessage ?? "";
  const lower = message.toLowerCase();
  // Unreachable Auth server (offline, DNS failure, wrong project URL):
  // auth-js surfaces these as AuthRetryableFetchError / "Failed to fetch".
  if (
    name === "AuthRetryableFetchError" ||
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("fetch failed")
  ) {
    const base = "Could not reach the sign-in service. Check your connection and try again.";
    // In development, surface the underlying reason (e.g. NXDOMAIN for a
    // misconfigured NEXT_PUBLIC_SUPABASE_URL) to speed up diagnosis.
    return process.env.NODE_ENV === "development" && message
      ? `${base} (dev detail: ${message})`
      : base;
  }
  if (String(status) === "429" || lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many sign-in requests. Please wait a minute, then request a new link.";
  }
  if (lower.includes("invalid") && (lower.includes("link") || lower.includes("token") || lower.includes("expired"))) {
    return "That sign-in link is invalid or has expired. Request a new one below.";
  }
  if (lower.includes("sign up disabled") || lower.includes("not allowed")) {
    return "Sign-ups are currently disabled for this platform. Please contact support.";
  }
  return message || "We could not send the sign-in link. Please try again.";
}

