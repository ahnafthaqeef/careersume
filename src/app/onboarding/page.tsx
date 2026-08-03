import type { Metadata } from "next";
import Link from "next/link";
import KeyWizard from "@/components/KeyWizard";
import { providerCards } from "@/lib/providers";
import { safeRelativePath } from "@/lib/safeRedirect";

export const metadata: Metadata = {
  title: "Connect your AI key | Careersume",
  description:
    "Connect your own AI key and start tailoring. The recommended key is free, needs no credit card, and takes about two minutes.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  // auth/callback forwards where the user was headed before the key gate.
  const { next } = await searchParams;
  const destination = safeRelativePath(typeof next === "string" ? next : null, "/builder");

  return (
    <main className="min-h-screen bg-paper px-6 py-14 md:py-20">
      <div className="mx-auto max-w-xl">
        <h1 className="sr-only">Connect your AI key</h1>
        <Link
          href="/"
          className="font-serif text-[22px] tracking-[-0.01em] text-ink transition-colors duration-200 hover:text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          Careersume
        </Link>

        <div className="mt-8">
          <KeyWizard providers={providerCards()} next={destination} />
        </div>

        <p className="mt-8 text-[14px] leading-[24px] text-ink-3">
          One key powers the whole app: tailoring, cover letters, and job analysis. Revoke it in
          your provider console at any time and it stops working immediately.
        </p>
      </div>
    </main>
  );
}
