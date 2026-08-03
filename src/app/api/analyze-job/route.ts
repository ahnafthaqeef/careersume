import { NextRequest, NextResponse } from "next/server";
import { JOB_ANALYSIS_SYSTEM, JOB_ANALYSIS_USER } from "@/lib/prompts";
import { completeForUser, NoKeyError } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { createServerClient } from "@supabase/ssr";
import type { JobAnalysis } from "@/types";

export const runtime = "nodejs";

async function getUserId(request: NextRequest): Promise<string | null> {
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
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    const rl = checkRateLimit(`analyze-job:${ip}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to use this feature." }, { status: 401 });
    }

    const { jobText } = await request.json();

    if (!jobText || typeof jobText !== "string" || jobText.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide a job description with at least 50 characters." },
        { status: 400 }
      );
    }

    const rawText = await completeForUser(userId, {
      system: JOB_ANALYSIS_SYSTEM,
      user: JOB_ANALYSIS_USER(jobText.trim()),
      maxTokens: 8000,
    });

    let analysis: JobAnalysis;
    try {
      // Extract JSON object from response (handles markdown wrappers and leading text)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      analysis = JSON.parse(jsonMatch[0]);
    } catch {
      console.error(`Failed to parse job analysis JSON from a ${rawText.length}-char response`);
      return NextResponse.json(
        { error: "Failed to parse job analysis. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    if (error instanceof NoKeyError) {
      return NextResponse.json(
        { code: "NO_KEY", error: "Connect your AI key to continue." },
        { status: 403 }
      );
    }
    console.error("Job analysis error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to analyze job: ${msg}` },
      { status: 500 }
    );
  }
}
