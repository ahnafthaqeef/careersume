import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { adminClient } from "@/lib/supabase/admin";
import { completeForUser, NoKeyError } from "@/lib/ai";
import { ATS_BOOST_SYSTEM, ATS_BOOST_USER } from "@/lib/prompts";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // 0. Anti-hammering (per-IP, minute window). Generation itself is never
  // capped by policy — this only guards against abusive burst traffic.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = checkRateLimit(`ats-boost:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

  // 1. Auth
  let userId: string | null = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Please sign in to use this feature." }, { status: 401 });
  }

  // 2. Parse input
  let resume: unknown, jobDescription: string;
  try {
    const body = await request.json();
    resume = body.resume;
    jobDescription = body.jobDescription;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!resume || !jobDescription) {
    return NextResponse.json({ error: "Missing resume or jobDescription." }, { status: 400 });
  }

  // 3. AI boost
  let raw: string;
  try {
    raw = await completeForUser(userId, {
      system: ATS_BOOST_SYSTEM,
      user: ATS_BOOST_USER(JSON.stringify(resume, null, 2), jobDescription),
      // The whole improved resume comes back as JSON, so keep the output budget
      // at the ceiling the free providers allow. 4000 truncates and fails parse.
      maxTokens: 8000,
    });
  } catch (err) {
    if (err instanceof NoKeyError) {
      return NextResponse.json(
        { code: "NO_KEY", error: "Connect your AI key to continue." },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI boost failed: ${msg}` }, { status: 500 });
  }

  // 4. Parse AI response
  let result: {
    original_score: number;
    boosted_score: number;
    improvements: string[];
    improved_resume: unknown;
  };

  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    result = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON. Please try again." }, { status: 500 });
  }

  // Validate required fields
  if (
    typeof result.original_score !== "number" ||
    typeof result.boosted_score !== "number" ||
    !Array.isArray(result.improvements) ||
    !result.improved_resume
  ) {
    return NextResponse.json({ error: "AI response was incomplete. Please try again." }, { status: 500 });
  }

  // 5. Log to ats_boosts
  await adminClient.from("ats_boosts").insert({
    user_id: userId,
    original_score: result.original_score,
    boosted_score: result.boosted_score,
  });

  // 6. Return
  return NextResponse.json({
    original_score: result.original_score,
    boosted_score: result.boosted_score,
    improvements: result.improvements,
    improved_resume: result.improved_resume,
  });
}
