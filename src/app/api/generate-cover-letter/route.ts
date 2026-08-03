import { NextRequest } from "next/server";
import { COVER_LETTER_SYSTEM, COVER_LETTER_USER } from "@/lib/prompts";
import { streamForUser, NoKeyError } from "@/lib/ai";
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
    const userId = await getUserId(request);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Please sign in.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { jobText, jobAnalysis, resumeContent, candidateName, companyName, jobTitle } =
      await request.json();

    if (!jobText || !resumeContent) {
      return new Response(
        JSON.stringify({ error: "Job description and resume content are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userPrompt = COVER_LETTER_USER(
      jobText,
      jobAnalysis ? JSON.stringify(jobAnalysis) : "Not available",
      typeof resumeContent === "string"
        ? resumeContent
        : JSON.stringify(resumeContent),
      candidateName || "the candidate",
      companyName || "",
      jobTitle || "the role"
    );

    const aiStream = streamForUser(userId, { system: COVER_LETTER_SYSTEM, user: userPrompt });

    // Pull the first chunk before streaming so a missing key comes back as a
    // plain 403 the client can act on instead of inline [ERROR: ...] text.
    let firstChunk: IteratorResult<string>;
    try {
      firstChunk = await aiStream.next();
    } catch (err) {
      if (err instanceof NoKeyError) {
        return new Response(
          JSON.stringify({ code: "NO_KEY", error: "Connect your AI key to continue." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      throw err;
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!firstChunk.done) controller.enqueue(encoder.encode(firstChunk.value));

          for await (const chunk of aiStream) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "AI generation failed";
          controller.enqueue(encoder.encode(`\n\n[ERROR: ${msg}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
