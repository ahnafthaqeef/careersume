import { NextRequest, NextResponse } from "next/server";
import { RESUME_GENERATION_SYSTEM, RESUME_GENERATION_USER } from "@/lib/prompts";
import { streamForUser, NoKeyError, type ResolvedProvider } from "@/lib/ai";
import { adminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { checkRateLimit } from "@/lib/rate-limit";
import type { GeneratedResume } from "@/types";

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
    const rl = checkRateLimit(`generate-resume:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. You can generate ${5} resumes per minute. Try again in ${rl.retryAfter}s.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to use this feature." }, { status: 401 });
    }

    const { jobText, jobAnalysis, profileText, templateName } =
      await request.json();

    if (!jobText || !profileText) {
      return NextResponse.json(
        { error: "Job description and profile text are required." },
        { status: 400 }
      );
    }

    if (profileText.trim().length < 100) {
      return NextResponse.json(
        { error: "Profile text is too short. Please provide more details about your experience." },
        { status: 400 }
      );
    }

    // Filled in once the stream resolves the user's key, so the log below can
    // record which provider actually ran.
    const resolved: ResolvedProvider = {};

    const aiStream = streamForUser(userId, {
      system: RESUME_GENERATION_SYSTEM,
      user: RESUME_GENERATION_USER(jobText, profileText, JSON.stringify(jobAnalysis, null, 2)),
      maxTokens: 16000,
    }, resolved);

    // Pull the first chunk before opening the SSE stream so a missing key comes
    // back as a plain 403 the client can act on instead of an in-stream error.
    let firstChunk: IteratorResult<string>;
    try {
      firstChunk = await aiStream.next();
    } catch (error) {
      if (error instanceof NoKeyError) {
        return NextResponse.json(
          { code: "NO_KEY", error: "Connect your AI key to continue." },
          { status: 403 }
        );
      }
      throw error;
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: object) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          sendEvent({ type: "status", message: "Analyzing your profile and job description..." });

          sendEvent({ type: "status", message: "Tailoring your resume to the job requirements..." });

          let fullText = firstChunk.done ? "" : firstChunk.value;
          let chunkCount = firstChunk.done ? 0 : 1;

          for await (const chunk of aiStream) {
            fullText += chunk;
            chunkCount++;

            if (chunkCount === 50) {
              sendEvent({ type: "status", message: "Writing tailored bullet points..." });
            } else if (chunkCount === 150) {
              sendEvent({ type: "status", message: "Computing match score and insights..." });
            }
          }

          // Parse the complete JSON response
          let result: GeneratedResume;
          try {
            const cleaned = fullText
              .replace(/^```(?:json)?\n?/m, "")
              .replace(/\n?```$/m, "")
              .trim();
            result = JSON.parse(cleaned);
          } catch {
            // Try to extract JSON from within the response
            const jsonMatch = fullText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                result = JSON.parse(jsonMatch[0]);
              } catch {
                console.error(`[generate-resume] unparseable JSON in a ${fullText.length}-char response`);
                sendEvent({
                  type: "error",
                  message: "The AI returned a malformed resume. Please try again.",
                });
                controller.close();
                return;
              }
            } else {
              console.error(`[generate-resume] no JSON in a ${fullText.length}-char response`);
              sendEvent({
                type: "error",
                message: "The AI did not return a resume. Please try again.",
              });
              controller.close();
              return;
            }
          }

          // Post-process: ensure weakBullet.original exactly matches a generated bullet
          // The AI sometimes paraphrases instead of copying verbatim
          if (result.weakBullets?.length) {
            const allBullets = (result.resume.workExperience ?? []).flatMap((job) => job.bullets ?? []);
            result.weakBullets = result.weakBullets
              .map((wb) => {
                if (allBullets.includes(wb.original)) return wb;
                // Find closest match: bullet that shares the most words with original
                const origWords = wb.original.toLowerCase().split(/\s+/);
                let bestMatch = "";
                let bestScore = 0;
                for (const b of allBullets) {
                  const bWords = b.toLowerCase().split(/\s+/);
                  const shared = origWords.filter((w) => bWords.includes(w)).length;
                  const score = shared / Math.max(origWords.length, bWords.length);
                  if (score > bestScore) { bestScore = score; bestMatch = b; }
                }
                // Lower threshold to 0.2 to handle Groq's more paraphrased output
                // If still no match, use the best candidate we found
                if (bestMatch) return { ...wb, original: bestMatch };
                return null;
              })
              .filter(Boolean) as typeof result.weakBullets;
          }

          if (!result.resume?.personalInfo) {
            sendEvent({
              type: "error",
              message: "Generated resume is incomplete. Please try again.",
            });
            controller.close();
            return;
          }

          // Log generation to database
          if (userId) {
            const tokensUsed = Math.round(fullText.length / 4);
            adminClient.from("resume_generations").insert({
              user_id: userId,
              template: templateName || "experienced",
              ai_provider: resolved.id,
              tokens_used: tokensUsed,
            }).then(() => {});
          }

          sendEvent({
            type: "complete",
            data: result,
            template: templateName || "classic",
          });

          controller.close();
        } catch (error) {
          console.error("Resume generation error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: "Failed to generate resume. Please try again.",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Generate resume error:", error);
    return NextResponse.json(
      { error: "Failed to generate resume. Please try again." },
      { status: 500 }
    );
  }
}
