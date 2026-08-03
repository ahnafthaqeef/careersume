"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
const PRIMARY = `w-full rounded-md bg-ink px-5 py-3 text-[15px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const GHOST = `flex w-full items-center justify-center gap-3 rounded-md border border-line px-5 py-3 text-[15px] font-semibold text-ink transition-colors duration-200 hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const LABEL = "block text-[14px] text-ink-3";
const INPUT =
  "mt-1.5 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface";
const TEXT_LINK = `text-accent underline underline-offset-4 decoration-accent/40 transition-colors duration-200 hover:decoration-accent ${FOCUS}`;

/** Google's own mark, kept in its brand colours as their guidelines require. */
function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-14">
        <div className="w-full max-w-sm">
          <h1 className="sr-only">Check your email</h1>

          <div className="text-center">
            <Link
              href="/"
              className={`font-serif text-[28px] leading-none tracking-[-0.01em] text-ink transition-colors duration-200 hover:text-ink-2 ${FOCUS}`}
            >
              Careersume
            </Link>
          </div>

          <div className="mt-8 rounded-md border border-line bg-surface p-6 shadow-paper">
            <h2 className="font-serif text-[28px] leading-tight tracking-[-0.01em]">
              Check your email
            </h2>
            <p className="mt-3 text-[15px] leading-[24px] text-ink-2">
              We sent a confirmation link to <span className="text-ink">{email}</span>. Click it to
              activate your account.
            </p>
            <Link href="/auth/login" className={`mt-6 inline-block ${TEXT_LINK}`}>
              Back to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-14">
      <div className="w-full max-w-sm">
        <h1 className="sr-only">Create your Careersume account</h1>

        <div className="text-center">
          <Link
            href="/"
            className={`font-serif text-[28px] leading-none tracking-[-0.01em] text-ink transition-colors duration-200 hover:text-ink-2 ${FOCUS}`}
          >
            Careersume
          </Link>
          <p className="mt-2 text-[15px] text-ink-2">Create your free account</p>
        </div>

        <div className="mt-8 rounded-md border border-line bg-surface p-6 shadow-paper">
          <button type="button" onClick={handleGoogleLogin} disabled={loading} className={GHOST}>
            <GoogleMark />
            Sign up with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[13px] text-ink-3">or sign up with email</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <p
                role="alert"
                className="rounded-md border border-score-missing/30 bg-score-missing/5 px-3 py-2 text-[14px] text-score-missing"
              >
                {error}
              </p>
            )}
            <div>
              <label htmlFor="register-name" className={LABEL}>
                Full name
              </label>
              <input
                id="register-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                placeholder="John Smith"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="register-email" className={LABEL}>
                Email
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="register-password" className={LABEL}>
                Password
              </label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className={INPUT}
              />
            </div>
            <button type="submit" disabled={loading} className={PRIMARY}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 border-t border-line pt-6 text-[14px] leading-[22px] text-ink-3">
            An account stores your encrypted API key, your master profile, and your history. Nothing
            else.
          </p>
        </div>

        <p className="mt-6 text-center text-[14px] text-ink-2">
          Already have an account?{" "}
          <Link href="/auth/login" className={TEXT_LINK}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
