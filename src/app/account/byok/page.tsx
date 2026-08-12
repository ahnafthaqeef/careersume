import type { Metadata } from "next";
import Link from "next/link";
import KeyWizard from "@/components/KeyWizard";
import { providerCards } from "@/lib/providers";
import { safeRelativePath } from "@/lib/safeRedirect";

export const metadata: Metadata = {
  title: "Your AI key | Careersume",
  description: "Connect, replace, or review the AI key Careersume runs on.",
};

export default async function BYOKPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const destination = safeRelativePath(typeof next === "string" ? next : null, "/builder");

  return (
    <main className="min-h-screen bg-ground-2 px-6 py-14 md:py-20">
      <div className="mx-auto max-w-xl">
        <Link
          href="/builder"
          className="text-[14px] text-ink-3 transition-colors duration-200 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ground-2"
        >
          Back to the builder
        </Link>

        <h1 className="mt-4 font-display text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.02em]">
          Your AI key
        </h1>
        <p className="mt-3 text-[17px] leading-[28px] text-ink-2">
          Careersume runs on the key you connect. You pay your provider directly, nothing here is
          capped, and the key is encrypted at rest.
        </p>

        <div className="mt-8">
          <KeyWizard variant="settings" providers={providerCards()} next={destination} />
        </div>
      </div>
    </main>
  );
}
