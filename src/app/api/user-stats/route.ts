import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getMidnightUTC(daysOffset = 0): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  return new Date(Date.UTC(y, m, d + daysOffset, 0, 0, 0, 0)).toISOString();
}

function getStartOfWeekUTC(): string {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as first day
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  return new Date(Date.UTC(y, m, d + diff, 0, 0, 0, 0)).toISOString();
}

function getStartOfMonthUTC(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
}

function getStartOfYearUTC(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0)).toISOString();
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please sign in to use this feature." }, { status: 401 });
    }

    const todayStart = getMidnightUTC(0);
    const weekStart = getStartOfWeekUTC();
    const monthStart = getStartOfMonthUTC();
    const yearStart = getStartOfYearUTC();

    const [todayRes, weekRes, monthRes, yearRes, allTimeRes] = await Promise.all([
      supabase
        .from("resume_generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart),
      supabase
        .from("resume_generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", weekStart),
      supabase
        .from("resume_generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", monthStart),
      supabase
        .from("resume_generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", yearStart),
      supabase
        .from("resume_generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    return NextResponse.json({
      today: todayRes.count ?? 0,
      thisWeek: weekRes.count ?? 0,
      thisMonth: monthRes.count ?? 0,
      thisYear: yearRes.count ?? 0,
      allTime: allTimeRes.count ?? 0,
    });
  } catch (err) {
    console.error("user-stats error:", err);
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 });
  }
}
