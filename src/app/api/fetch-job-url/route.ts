import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkAndIncrementUsage } from "@/lib/usage";
import { createServerClient } from "@supabase/ssr";

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
    const rl = checkRateLimit(`fetch-job-url:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
    }

    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to use this feature." }, { status: 401 });
    }

    const usage = await checkAndIncrementUsage(userId, "fetch-job-url", 30);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Daily limit for this helper reached. It resets at midnight UTC. Resume generation itself is never limited." },
        { status: 429 }
      );
    }

    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Only HTTP/HTTPS URLs are supported" },
        { status: 400 }
      );
    }

    // Block SSRF: reject private/internal hostnames
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
    const privateRanges = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./];
    if (
      blockedHosts.includes(hostname) ||
      privateRanges.some((r) => r.test(hostname)) ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return NextResponse.json(
        { error: "URL not allowed" },
        { status: 400 }
      );
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Extract text content using cheerio
    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);

    // Remove script, style, nav, header, footer elements
    $(
      "script, style, nav, header, footer, aside, .nav, .header, .footer, .sidebar, .advertisement, .cookie-banner"
    ).remove();

    // Try to find the main job content area
    const selectors = [
      '[class*="job-description"]',
      '[class*="jobDescription"]',
      '[class*="job_description"]',
      '[id*="job-description"]',
      '[id*="jobDescription"]',
      '[class*="job-details"]',
      '[class*="jobDetails"]',
      '[class*="posting"]',
      '[class*="description"]',
      "main",
      "article",
      "#main-content",
      ".main-content",
    ];

    let text = "";
    for (const selector of selectors) {
      const el = $(selector).first();
      if (el.length > 0) {
        text = el.text();
        if (text.trim().length > 200) break;
      }
    }

    // Fall back to body text if we didn't find a good match
    if (!text.trim() || text.trim().length < 200) {
      text = $("body").text();
    }

    // Clean up whitespace
    text = text
      .replace(/\t/g, " ")
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();

    // Limit length
    if (text.length > 10000) {
      text = text.substring(0, 10000) + "...";
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from this URL. Please paste the job description directly." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Job URL fetch error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    if (message.includes("timeout") || message.includes("TimeoutError")) {
      return NextResponse.json(
        { error: "Request timed out. Please paste the job description directly." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch job posting. Please paste the description directly." },
      { status: 500 }
    );
  }
}
