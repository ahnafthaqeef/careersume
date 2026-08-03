// src/app/api/byok/status/route.ts
// Reports whether the signed-in user has connected an AI key. Returns the
// provider id only, never any key material.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProviderId } from "@/lib/providers";

export const runtime = "nodejs";

// Pages gate on this answer, so a cached one would send the wrong people to
// the wizard.
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401, headers: NO_STORE });
  }

  const { data, error } = await supabase
    .from("user_api_keys")
    .select("provider")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Never answer "no key" because the lookup itself broke: callers gate on this
  // and would send a user who has a key back to the wizard.
  if (error) {
    return NextResponse.json(
      { error: "Could not read your key settings." },
      { status: 500, headers: NO_STORE }
    );
  }

  return NextResponse.json(
    {
      hasKey: Boolean(data),
      provider: (data?.provider as ProviderId | undefined) ?? null,
    },
    { headers: NO_STORE }
  );
}
