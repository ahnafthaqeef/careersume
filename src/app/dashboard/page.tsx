"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { createClient } from "@/lib/supabase/client";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const QUIET = `inline-flex min-h-[44px] items-center rounded px-2 text-[13px] text-ink-2 transition-colors duration-200 hover:text-ink ${FOCUS}`;
const CAPTION = "text-[13px] text-ink-3";

const NAV_CARDS = [
  {
    href: "/job-scanner",
    title: "Job scanner",
    description: "Browse live job listings and analyze role fit before you apply.",
  },
  {
    href: "/builder",
    title: "Resume builder",
    description: "Tailor your resume to any job description in seconds.",
  },
  {
    href: "/cover-letter",
    title: "Cover letter",
    description: "Write a personalised cover letter from the same facts.",
  },
  {
    href: "/job-tracker",
    title: "Job tracker",
    description: "Track every application from saved to offer in one place.",
  },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      setUserEmail(user.email ?? null);
      setUserName(user.user_metadata?.full_name ?? null);
    });
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const displayName = userName || userEmail?.split("@")[0] || "there";

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <AppNav
        container="max-w-5xl"
        right={
          <>
            {userEmail && (
              <span className={`hidden max-w-[180px] truncate md:block ${CAPTION}`}>
                {userEmail}
              </span>
            )}
            <button onClick={handleLogout} className={QUIET}>
              Sign out
            </button>
          </>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-14 md:py-20">
        <div className="animate-fade-in">
          <h1 className="font-serif text-[clamp(2.25rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.01em]">
            Welcome back, {displayName}.
          </h1>
          <p className="mt-4 text-[17px] leading-[28px] text-ink-2">
            Where do you want to pick the hunt back up?
          </p>
        </div>

        <div className="mt-12 grid animate-slide-up grid-cols-1 gap-4 sm:grid-cols-2">
          {NAV_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`flex h-full flex-col rounded-md border border-line bg-surface p-6 transition-colors duration-200 hover:border-ink ${FOCUS}`}
            >
              <h2 className="text-[17px] font-semibold text-ink">{card.title}</h2>
              <p className="mt-2 text-[15px] leading-[24px] text-ink-2">{card.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-6">
          <Link href="/history" className={QUIET}>
            Resume history
          </Link>
          <Link href="/account/byok" className={QUIET}>
            Your AI key
          </Link>
        </div>
      </main>
    </div>
  );
}
