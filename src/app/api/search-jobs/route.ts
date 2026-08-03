import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkAndIncrementUsage } from "@/lib/usage";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

// JSearch via RapidAPI — aggregates LinkedIn, Indeed, Glassdoor, Jobstreet & more
const JSEARCH_BASE = "https://jsearch.p.rapidapi.com/search";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = checkRateLimit(`search-jobs:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } });
  }

  // Auth: job search requires a signed-in user
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

  // JSEARCH_API_KEY is optional: an instance without one still does everything
  // else, so say so plainly and do not spend the user's daily search quota on a
  // request that cannot succeed.
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Job search is not configured on this instance." },
      { status: 503 }
    );
  }

  const usage = await checkAndIncrementUsage(userId, "search-jobs", 30);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "Daily limit for this helper reached. It resets at midnight UTC. Resume generation itself is never limited." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get("keywords") || "";
  const location = searchParams.get("location") || "";
  const datePosted = searchParams.get("datePosted") || "";
  const remote = searchParams.get("remote") || "";
  const page = parseInt(searchParams.get("page") || "1");

  if (!keywords.trim()) {
    return NextResponse.json({ error: "Keywords are required" }, { status: 400 });
  }

  let query = keywords.trim();
  if (location.trim()) query += ` in ${location.trim()}`;

  const dateMap: Record<string, string> = {
    today: "today",
    "3days": "3days",
    week: "week",
    month: "month",
  };

  try {
    const params = new URLSearchParams({
      query,
      page: String(page),
      num_pages: "1",
      ...(datePosted && dateMap[datePosted] ? { date_posted: dateMap[datePosted] } : {}),
      ...(remote === "1" ? { remote_jobs_only: "true" } : {}),
    });

    const res = await fetch(`${JSEARCH_BASE}?${params.toString()}`, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("JSearch error:", res.status, text);
      throw new Error(`Search API error: ${res.status}`);
    }

    const data = await res.json();
    const raw: JSearchJob[] = data.data || [];

    const jobs = raw.map((j, idx) => {
      const fullDescription = j.job_description || `Job Title: ${j.job_title}\nCompany: ${j.employer_name}`;

      return {
        id: j.job_id || `${j.job_title}-${idx}`.replace(/\s+/g, "-").toLowerCase(),
        title: j.job_title || "",
        company: j.employer_name || "",
        companyLogo: j.employer_logo || null,
        locations: j.job_city ? [`${j.job_city}${j.job_country ? ", " + j.job_country : ""}`] : [],
        categories: [],
        levels: [],
        employmentType: j.job_employment_type || "",
        description: fullDescription.substring(0, 10000) + (fullDescription.length > 10000 ? "..." : ""),
        fullDescription,
        applyUrl: j.job_apply_link || "",
        postedAt: j.job_posted_at_datetime_utc || "",
        isRemote: j.job_is_remote || remote === "1",
        source: j.job_publisher || "JSearch",
      };
    });

    return NextResponse.json({
      jobs,
      total: jobs.length,
      page,
      hasMore: jobs.length === 10,
    });
  } catch (error) {
    console.error("Job search error:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("timeout")) {
      return NextResponse.json({ error: `Search timed out: ${message}` }, { status: 408 });
    }
    return NextResponse.json({ error: `Job search failed: ${message}` }, { status: 500 });
  }
}

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string;
  job_publisher: string;
  job_employment_type: string;
  job_description: string;
  job_apply_link: string;
  job_city: string;
  job_country: string;
  job_is_remote: boolean;
  job_posted_at_datetime_utc: string;
}
