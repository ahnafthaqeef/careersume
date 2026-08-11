"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/basePath";

/**
 * Gates a page on the signed-in user having a connected AI key. Sends them to
 * the key wizard when they have none. Returns `checking` so a page can hold
 * back its own work until the answer is in.
 */
export function useRequireKey(): { checking: boolean } {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    fetch(withBasePath("/api/byok/status"))
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { hasKey?: boolean } | null) => {
        if (!active) return;
        // A 401 means middleware is already sending them to login, so only a
        // clear "no key" answer routes to the wizard.
        if (data && !data.hasKey) router.push("/onboarding");
        setChecking(false);
      })
      .catch(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  return { checking };
}
