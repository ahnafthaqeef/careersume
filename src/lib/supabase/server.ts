import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const raw = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined;
  const domain = raw?.startsWith('.') ? raw.slice(1) : raw;
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { domain },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, ...(domain ? { domain } : {}) })
            );
          } catch {}
        },
      },
    }
  );
}
