import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ITEM_LIMIT = 100;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const [resumesRes, coverLettersRes] = await Promise.all([
    adminClient
      .from("resume_generations")
      .select("id, job_title, company, template, ai_provider, resume_json, job_description_text, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(ITEM_LIMIT),
    adminClient
      .from("cover_letters")
      .select("id, job_title, company, cover_letter_text, job_description_text, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(ITEM_LIMIT),
  ]);

  const resumes = (resumesRes.data ?? []).map((r) => ({ type: "resume" as const, ...r }));
  const coverLetters = (coverLettersRes.data ?? []).map((c) => ({ type: "cover_letter" as const, ...c }));

  const items = [...resumes, ...coverLetters]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, ITEM_LIMIT);

  return NextResponse.json({ items });
}
