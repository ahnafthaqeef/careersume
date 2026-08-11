import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { safeRelativePath } from "@/lib/safeRedirect";
import { withBasePath } from "@/lib/basePath";

export async function GET(request: NextRequest) {
  // `origin` is the bare scheme and host, so every Location built below has to
  // add the app's basePath back itself: the paths carried in `next` and
  // `redirect_to` are app-relative, which is what `safeRelativePath` validates.
  const { searchParams, origin } = new URL(request.url);

  // If the OAuth provider returned an error, abort immediately
  const oauthError = searchParams.get("error");
  if (oauthError) {
    return NextResponse.redirect(`${origin}${withBasePath("/auth/login")}?error=oauth_failed`);
  }

  const code = searchParams.get("code");

  // No code means something went wrong — send back to login
  if (!code) {
    return NextResponse.redirect(`${origin}${withBasePath("/auth/login")}`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.exchangeCodeForSession(code);

  // Validate the next param if present — only allow relative paths (open redirect prevention)
  const requested = searchParams.get("next") ?? searchParams.get("redirect_to");
  const redirectTo = safeRelativePath(requested, "/builder");

  // Nothing in the app works without a connected AI key, so a session that has
  // none goes straight to the wizard instead of a page it cannot use. Where
  // they were headed is carried along so the wizard can finish the trip.
  if (data?.user) {
    const { data: key } = await supabase
      .from("user_api_keys")
      .select("provider")
      .eq("user_id", data.user.id)
      .limit(1)
      .maybeSingle();
    if (!key) {
      const carry = safeRelativePath(requested, "");
      const wizard = carry ? `/onboarding?next=${encodeURIComponent(carry)}` : "/onboarding";
      return NextResponse.redirect(`${origin}${withBasePath(wizard)}`);
    }
  }

  return NextResponse.redirect(`${origin}${withBasePath(redirectTo)}`);
}
