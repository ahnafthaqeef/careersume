import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getTodayStartUTC(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString();
}

interface ProviderRow {
  provider: string;
  tokens: number;
  count: number;
}

// Every call now runs on a key the user brought themselves, so there is no
// pooled quota to track against. This just groups what was actually logged
// by the real ai_provider id (gemini/groq/openai/anthropic).
function groupByProvider(
  rows: { ai_provider: string | null; tokens_used: number | null }[]
): ProviderRow[] {
  const totals = new Map<string, { tokens: number; count: number }>();
  for (const row of rows) {
    const provider = row.ai_provider ?? "unknown";
    const entry = totals.get(provider) ?? { tokens: 0, count: 0 };
    entry.tokens += row.tokens_used ?? 0;
    entry.count += 1;
    totals.set(provider, entry);
  }
  return Array.from(totals.entries())
    .map(([provider, { tokens, count }]) => ({ provider, tokens, count }))
    .sort((a, b) => b.tokens - a.tokens);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to use this feature." }, { status: 401 });
    }

    // Org-wide totals read through the service-role client, so this stays
    // admin-only, same check as the admin page.
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const todayStart = getTodayStartUTC();

    const [todayRes, allTimeRes] = await Promise.all([
      adminClient
        .from("resume_generations")
        .select("ai_provider, tokens_used")
        .gte("created_at", todayStart),
      adminClient.from("resume_generations").select("ai_provider, tokens_used"),
    ]);

    return NextResponse.json({
      today: groupByProvider(todayRes.data ?? []),
      allTime: groupByProvider(allTimeRes.data ?? []),
    });
  } catch (err) {
    console.error("token-stats error:", err);
    return NextResponse.json({ error: "Failed to fetch token stats" }, { status: 500 });
  }
}
