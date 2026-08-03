import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const raw = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined;
  const domain = raw?.startsWith('.') ? raw.slice(1) : raw;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { domain } }
  );
}
