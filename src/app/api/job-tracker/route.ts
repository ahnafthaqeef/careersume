import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";

// GET — fetch all saved jobs for current user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to use this feature." }, { status: 401 });

  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}

// POST — save a new job
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to use this feature." }, { status: 401 });

  const body = await request.json();
  const { job_id, title, company, company_logo, location, employment_type, source, apply_url, full_description } = body;

  if (!job_id || !title || !company) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Upsert — if same job_id for this user already exists, ignore
  const { data, error } = await supabase
    .from("job_applications")
    .upsert(
      { user_id: user.id, job_id, title, company, company_logo, location, employment_type, source, apply_url, full_description, status: "saved" },
      { onConflict: "user_id,job_id", ignoreDuplicates: true }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data });
}
