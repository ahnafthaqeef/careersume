import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

const PANEL = "rounded-md border border-line bg-ground-2";
const CAPTION = "text-[13px] text-ink-3";
const SECTION_TITLE = "text-[15px] font-semibold text-ink";
const TH = "px-4 py-3 text-center text-[13px] font-semibold text-ink-3";
const TD = "px-4 py-3 text-center text-[13px] text-ink-2";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Check admin role
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  // Date boundaries (UTC)
  const nowUTC = new Date();
  const todayStart = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate()));
  const todayISO = todayStart.toISOString();

  const weekDay = nowUTC.getUTCDay();
  const weekDiff = weekDay === 0 ? -6 : 1 - weekDay;
  const weekStart = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate() + weekDiff));
  const weekISO = weekStart.toISOString();

  const monthStart = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), 1));
  const monthISO = monthStart.toISOString();

  const yearStart = new Date(Date.UTC(nowUTC.getUTCFullYear(), 0, 1));
  const yearISO = yearStart.toISOString();

  // Fetch all stats in parallel
  const [
    { count: totalUsers },
    { count: todayUsers },
    { count: totalResumes },
    { count: todayResumes },
    { data: recentUsers },
    { data: recentGenerations },
    { data: providerData },
    { data: totalTokensData },
    { data: todayTokensData },
    { data: allGenerations },
  ] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
    adminClient.from("resume_generations").select("*", { count: "exact", head: true }),
    adminClient.from("resume_generations").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
    adminClient.from("profiles").select("email, full_name, role, created_at").order("created_at", { ascending: false }).limit(20),
    adminClient.from("resume_generations").select("id, user_id, template, ai_provider, tokens_used, created_at, profiles(email)").order("created_at", { ascending: false }).limit(20),
    adminClient.from("resume_generations").select("ai_provider").gte("created_at", todayISO),
    adminClient.from("resume_generations").select("tokens_used"),
    adminClient.from("resume_generations").select("tokens_used").gte("created_at", todayISO),
    // Fetch all generations for per-user stats grouping
    adminClient.from("resume_generations").select("user_id, created_at, profiles(email)"),
  ]);

  const { data: feedbackItems } = await adminClient
    .from('feedback')
    .select('id, type, message, screenshot_url, page_url, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(100)

  // Resolve emails separately (feedback.user_id FK → auth.users, not profiles)
  const feedbackUserIds = [...new Set((feedbackItems ?? []).map((f: { user_id: string | null }) => f.user_id).filter(Boolean))] as string[]
  const { data: feedbackProfiles } = feedbackUserIds.length > 0
    ? await adminClient.from('profiles').select('id, email').in('id', feedbackUserIds)
    : { data: [] }
  const feedbackEmailMap: Record<string, string> = Object.fromEntries(
    (feedbackProfiles ?? []).map((p: { id: string; email: string }) => [p.id, p.email])
  )

  type FeedbackItem = {
    id: string
    type: string
    message: string
    screenshot_url: string | null
    page_url: string | null
    created_at: string
    user_id: string | null
  }

  const totalTokens = (totalTokensData ?? []).reduce((sum: number, r: { tokens_used: number | null }) => sum + (r.tokens_used ?? 0), 0);
  const todayTokens = (todayTokensData ?? []).reduce((sum: number, r: { tokens_used: number | null }) => sum + (r.tokens_used ?? 0), 0);

  // Count provider breakdown
  const providerCounts = (providerData ?? []).reduce(
    (acc: Record<string, number>, row: { ai_provider: string }) => {
      const p = row.ai_provider ?? "unknown";
      acc[p] = (acc[p] ?? 0) + 1;
      return acc;
    },
    {}
  );

  // Build per-user stats table
  type GenRow = { user_id: string; created_at: string; profiles: { email: string } | { email: string }[] | null };
  type UserStatRow = {
    userId: string;
    email: string;
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    allTime: number;
  };

  const userStatMap: Record<string, UserStatRow> = {};
  for (const row of (allGenerations ?? []) as unknown as GenRow[]) {
    const uid = row.user_id;
    const profilesData = row.profiles;
    const email = Array.isArray(profilesData)
      ? (profilesData[0]?.email ?? "unknown")
      : (profilesData?.email ?? "unknown");
    const createdAt = new Date(row.created_at);

    if (!userStatMap[uid]) {
      userStatMap[uid] = { userId: uid, email, today: 0, thisWeek: 0, thisMonth: 0, thisYear: 0, allTime: 0 };
    }
    userStatMap[uid].allTime++;
    if (createdAt >= yearStart) userStatMap[uid].thisYear++;
    if (createdAt >= monthStart) userStatMap[uid].thisMonth++;
    if (createdAt >= weekStart) userStatMap[uid].thisWeek++;
    if (createdAt >= todayStart) userStatMap[uid].today++;
  }

  const perUserStats: UserStatRow[] = Object.values(userStatMap).sort(
    (a, b) => b.allTime - a.allTime
  );

  const stats = [
    { label: "Total users", value: totalUsers ?? 0 },
    { label: "New today", value: todayUsers ?? 0 },
    { label: "Total resumes", value: totalResumes ?? 0 },
    { label: "Resumes today", value: todayResumes ?? 0 },
  ];

  const tokenStats = [
    { label: "Tokens today", value: todayTokens.toLocaleString() },
    { label: "Total tokens", value: totalTokens.toLocaleString() },
  ];

  return (
    <div className="min-h-screen bg-ground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line bg-ground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-display text-xl font-bold leading-none tracking-[-0.02em] text-ink"
            >
              Career<span className="mark">sume</span>
            </Link>
            <span className="text-[14px] text-ink-2">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={CAPTION}>{user.email}</span>
            <Link
              href="/"
              className="rounded-md border border-line px-3 py-1.5 text-[13px] font-medium text-ink transition-colors duration-200 hover:border-ink"
            >
              Back to the app
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(({ label, value }) => (
            <div key={label} className={`${PANEL} p-5`}>
              <p className={CAPTION}>{label}</p>
              <p className="mt-1 font-display font-bold text-[32px] leading-none tabular-nums text-ink">{value}</p>
            </div>
          ))}
        </div>

        {/* Token Usage */}
        <div className="grid grid-cols-2 gap-4">
          {tokenStats.map(({ label, value }) => (
            <div key={label} className={`${PANEL} p-5`}>
              <p className={CAPTION}>{label}</p>
              <p className="mt-1 font-display font-bold text-[32px] leading-none tabular-nums text-ink">{value}</p>
              <p className={`mt-1 ${CAPTION}`}>Estimated from response size</p>
            </div>
          ))}
        </div>

        {/* Provider Breakdown */}
        <div className={`${PANEL} p-6`}>
          <h2 className={SECTION_TITLE}>API provider usage today</h2>
          {Object.keys(providerCounts).length === 0 ? (
            <p className={`mt-3 ${CAPTION}`}>No generations today.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              {Object.entries(providerCounts).map(([provider, count]) => (
                <div
                  key={provider}
                  className="flex items-center gap-2 rounded-md border border-line bg-ground px-4 py-2"
                >
                  <span className="text-[14px] font-medium capitalize text-ink">{provider}</span>
                  <span className={CAPTION}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-User Resume Stats */}
        <div className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-line px-6 py-4">
            <h2 className={SECTION_TITLE}>Per-user resume stats</h2>
            <p className={`mt-0.5 ${CAPTION}`}>Sorted by all-time resume count.</p>
          </div>
          {perUserStats.length === 0 ? (
            <p className={`p-6 ${CAPTION}`}>No resume generations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-ground">
                    <th className="px-6 py-3 text-left text-[13px] font-semibold text-ink-3">Email</th>
                    <th className={TH}>Today</th>
                    <th className={TH}>This week</th>
                    <th className={TH}>This month</th>
                    <th className={TH}>This year</th>
                    <th className={TH}>All time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {perUserStats.map((row) => (
                    <tr key={row.userId}>
                      <td className="max-w-[200px] truncate px-6 py-3 text-[13px] font-medium text-ink">
                        {row.email}
                      </td>
                      <td className={TD}>{row.today}</td>
                      <td className={TD}>{row.thisWeek}</td>
                      <td className={TD}>{row.thisMonth}</td>
                      <td className={TD}>{row.thisYear}</td>
                      <td className="px-4 py-3 text-center text-[13px] font-semibold text-ink">
                        {row.allTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Users */}
          <div className={`${PANEL} overflow-hidden`}>
            <div className="border-b border-line px-6 py-4">
              <h2 className={SECTION_TITLE}>Recent users</h2>
            </div>
            <div className="divide-y divide-line">
              {(recentUsers ?? []).length === 0 ? (
                <p className={`p-6 ${CAPTION}`}>No users yet.</p>
              ) : (
                (recentUsers ?? []).map((u: { email: string; full_name: string; role: string; created_at: string }) => (
                  <div key={u.email} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-[14px] font-medium text-ink">{u.full_name || "Unnamed"}</p>
                      <p className={CAPTION}>{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      {u.role === "admin" && (
                        <span className="rounded border border-line px-1.5 py-0.5 text-[11px] text-ink-2">
                          admin
                        </span>
                      )}
                      <span className={CAPTION}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Generations */}
          <div className={`${PANEL} overflow-hidden`}>
            <div className="border-b border-line px-6 py-4">
              <h2 className={SECTION_TITLE}>Recent generations</h2>
            </div>
            <div className="divide-y divide-line">
              {(recentGenerations ?? []).length === 0 ? (
                <p className={`p-6 ${CAPTION}`}>No generations yet.</p>
              ) : (
                (recentGenerations ?? []).map((g: { id: string; template: string; ai_provider: string; tokens_used: number | null; created_at: string; profiles: { email: string } | { email: string }[] | null }) => (
                  <div key={g.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-[13px] text-ink-2">{Array.isArray(g.profiles) ? (g.profiles[0]?.email ?? "unknown") : (g.profiles?.email ?? "unknown")}</p>
                      <p className={`capitalize ${CAPTION}`}>
                        Template: {g.template ?? "none"} · {g.ai_provider ?? "none"}{g.tokens_used ? ` · about ${g.tokens_used.toLocaleString()} tokens` : ""}
                      </p>
                    </div>
                    <span className={CAPTION}>
                      {new Date(g.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <section>
          <h2 className="font-display font-bold text-[28px] leading-tight tracking-[-0.02em]">
            User feedback{' '}
            <span className={CAPTION}>({feedbackItems?.length ?? 0})</span>
          </h2>
          <div className={`mt-4 ${PANEL} overflow-hidden`}>
            {!feedbackItems || feedbackItems.length === 0 ? (
              <p className={`py-12 text-center ${CAPTION}`}>No feedback yet.</p>
            ) : (
              <div className="divide-y divide-line">
                {(feedbackItems as unknown as FeedbackItem[]).map((item) => {
                  const email = (item.user_id ? feedbackEmailMap[item.user_id] : null) ?? 'unknown'
                  // Class strings are written out in full so Tailwind can see them.
                  const badgeColors: Record<string, string> = {
                    bug: 'border-bad/40 text-bad',
                    idea: 'border-line text-ink',
                    other: 'border-line text-ink-3',
                  }
                  return (
                    <div key={item.id} className="flex items-start gap-4 p-5">
                      <span className={`h-fit whitespace-nowrap rounded border px-2 py-0.5 text-[12px] capitalize ${badgeColors[item.type] ?? badgeColors.other}`}>
                        {item.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-[14px] text-ink">{item.message}</p>
                        <div className={`mt-1 flex flex-wrap gap-x-3 ${CAPTION}`}>
                          <span>{email}</span>
                          {item.page_url && <span>{item.page_url}</span>}
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      {item.screenshot_url && (
                        <a href={item.screenshot_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.screenshot_url}
                            alt="feedback screenshot"
                            className="h-16 w-24 rounded border border-line object-cover transition-opacity duration-200 hover:opacity-80"
                          />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
