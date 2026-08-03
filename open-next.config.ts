import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Careersume is fully dynamic (BYOK generation, Supabase-backed pages); the only
// prerendered route is the landing page, which is served straight from assets.
// With no ISR and no revalidation there is nothing for an incremental cache to
// hold, so the defaults stand and the deploy needs no R2 bucket.
export default defineCloudflareConfig();
