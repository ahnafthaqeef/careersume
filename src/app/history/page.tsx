"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { createClient } from "@/lib/supabase/client";
import { withBasePath } from "@/lib/basePath";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const PRIMARY = `rounded-md bg-ink px-4 py-2 text-[14px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 ${FOCUS}`;
const GHOST = `inline-flex min-h-[44px] items-center rounded-md border border-line bg-surface px-3 text-[13px] font-medium text-ink transition-colors duration-200 hover:border-ink ${FOCUS}`;
const CAPTION = "text-[13px] text-ink-3";
const SECTION_LABEL = "text-[13px] font-semibold text-ink";
const QUIET = `inline-flex min-h-[44px] items-center rounded text-[13px] text-ink-3 transition-colors duration-200 hover:text-ink ${FOCUS}`;

type ResumeItem = {
  type: "resume";
  id: string;
  job_title: string | null;
  company: string | null;
  template: string | null;
  ai_provider: string | null;
  resume_json: Record<string, unknown> | null;
  job_description_text: string | null;
  created_at: string;
};

type CoverLetterItem = {
  type: "cover_letter";
  id: string;
  job_title: string | null;
  company: string | null;
  cover_letter_text: string | null;
  job_description_text: string | null;
  created_at: string;
};

type HistoryItem = ResumeItem | CoverLetterItem;

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - itemDay.getTime();
  if (diff === 0) return "Today";
  if (diff === 86_400_000) return "Yesterday";
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(items: HistoryItem[]): [string, HistoryItem[]][] {
  const map = new Map<string, HistoryItem[]>();
  for (const item of items) {
    const label = formatDate(item.created_at);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(item);
  }
  return Array.from(map.entries());
}

// Class strings are written out in full so Tailwind can see them.
function scoreTone(score: number) {
  if (score >= 70) return "text-accent";
  if (score >= 50) return "text-score-partial";
  return "text-score-missing";
}

function ResumeCard({ item }: { item: ResumeItem }) {
  const [expanded, setExpanded] = useState(false);
  const [showJobDesc, setShowJobDesc] = useState(false);
  const resume = item.resume_json as {
    resume?: { personalInfo?: { name?: string }; summary?: string; skills?: string[]; workExperience?: { company: string; title: string; bullets: string[] }[] };
    matchScore?: number;
    suggestions?: string[];
  } | null;

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex-none rounded border border-line bg-paper px-2 py-0.5 text-[12px] text-ink-2">
            Resume
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-ink">
              {item.job_title ?? "Untitled role"}{item.company ? ` at ${item.company}` : ""}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {item.template && <span className={`capitalize ${CAPTION}`}>{item.template}</span>}
              {item.ai_provider && (
                <span className={`capitalize ${CAPTION}`}>· {item.ai_provider}</span>
              )}
              {resume?.matchScore != null && (
                <span className={`text-[13px] font-medium ${scoreTone(resume.matchScore)}`}>
                  · {resume.matchScore}% match
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-none items-center gap-3">
          <span className={CAPTION}>{formatTime(item.created_at)}</span>
          <button onClick={() => setExpanded((v) => !v)} className={GHOST}>
            {expanded ? "Collapse" : "View"}
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-line">
          {/* Skills */}
          {resume?.resume?.skills?.length ? (
            <div className="px-4 py-3">
              <p className={SECTION_LABEL}>Skills</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {resume.resume.skills.slice(0, 15).map((s, i) => (
                  <span
                    key={i}
                    className="rounded border border-line bg-paper px-1.5 py-0.5 text-[12px] text-ink-2"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Summary */}
          {resume?.resume?.summary && (
            <div className="border-t border-line px-4 py-3">
              <p className={SECTION_LABEL}>Summary</p>
              <p className="mt-1.5 text-[14px] leading-[22px] text-ink-2">{resume.resume.summary}</p>
            </div>
          )}

          {/* Work Experience */}
          {resume?.resume?.workExperience?.length ? (
            <div className="border-t border-line px-4 py-3">
              <p className={SECTION_LABEL}>Experience</p>
              {resume.resume.workExperience.slice(0, 3).map((job, i) => (
                <div key={i} className="mt-2 last:mb-0">
                  <p className="text-[14px] font-semibold text-ink">
                    {job.title}, {job.company}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {job.bullets.slice(0, 3).map((b, j) => (
                      <li key={j} className="text-[13px] leading-[20px] text-ink-2">{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}

          {/* Suggestions */}
          {resume?.suggestions?.length ? (
            <div className="border-t border-line px-4 py-3">
              <p className={SECTION_LABEL}>Suggestions</p>
              <ul className="mt-1.5 space-y-1">
                {resume.suggestions.map((s, i) => (
                  <li key={i} className="text-[13px] leading-[20px] text-ink-2">{s}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Job description toggle */}
          {item.job_description_text && (
            <div className="border-t border-line px-4 py-3">
              <button onClick={() => setShowJobDesc((v) => !v)} className={QUIET}>
                {showJobDesc ? "Hide" : "Show"} job description
              </button>
              {showJobDesc && (
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[20px] text-ink-2">
                  {item.job_description_text.slice(0, 1500)}{item.job_description_text.length > 1500 ? "..." : ""}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CoverLetterCard({ item }: { item: CoverLetterItem }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showJobDesc, setShowJobDesc] = useState(false);

  const handleCopy = () => {
    if (item.cover_letter_text) {
      navigator.clipboard.writeText(item.cover_letter_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex-none rounded border border-line bg-paper px-2 py-0.5 text-[12px] text-ink-2">
            Cover letter
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-ink">
              {item.job_title ?? "Untitled role"}{item.company ? ` at ${item.company}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-none items-center gap-3">
          <span className={CAPTION}>{formatTime(item.created_at)}</span>
          <button
            onClick={handleCopy}
            className={`${GHOST} ${copied ? "border-accent text-accent" : ""}`}
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={() => setExpanded((v) => !v)} className={GHOST}>
            {expanded ? "Collapse" : "View"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-line">
          <div className="px-4 py-3">
            <p className="whitespace-pre-wrap font-serif text-[15px] leading-[26px] text-ink">
              {item.cover_letter_text}
            </p>
          </div>
          {item.job_description_text && (
            <div className="border-t border-line px-4 py-3">
              <button onClick={() => setShowJobDesc((v) => !v)} className={QUIET}>
                {showJobDesc ? "Hide" : "Show"} job description
              </button>
              {showJobDesc && (
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[20px] text-ink-2">
                  {item.job_description_text.slice(0, 1500)}{item.job_description_text.length > 1500 ? "..." : ""}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }
      fetch(withBasePath("/api/history"))
        .then((r) => r.json())
        .then((data) => {
          if (data.error) setError(data.error);
          else setItems(data.items ?? []);
        })
        .catch(() => setError("Failed to load history."))
        .finally(() => setLoading(false));
    });
  }, [router]);

  const groups = groupByDate(items);

  return (
    <div className="min-h-screen bg-paper">
      <AppNav
        active="/history"
        container="max-w-3xl"
        right={
          <Link href="/builder" className={PRIMARY}>
            New resume
          </Link>
        }
      />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-[clamp(2rem,4vw,2.75rem)] leading-[1.1] tracking-[-0.01em]">
            Activity history
          </h1>
          <p className="mt-2 text-[17px] leading-[28px] text-ink-2">
            Every resume and cover letter you have generated, in one place.
          </p>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-line" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p
            role="alert"
            className="rounded-md border border-score-missing/30 bg-score-missing/5 p-4 text-[14px] text-score-missing"
          >
            {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="py-16 text-center">
            <h2 className="font-serif text-[28px] leading-tight tracking-[-0.01em]">
              No activity yet
            </h2>
            <p className="mt-3 text-[17px] leading-[28px] text-ink-2">
              Generate your first resume to see it here.
            </p>
            <Link href="/builder" className={`mt-8 inline-block ${PRIMARY}`}>
              Build a resume
            </Link>
          </div>
        )}

        {!loading && groups.length > 0 && (
          <div className="space-y-8">
            {groups.map(([dateLabel, groupItems]) => (
              <div key={dateLabel}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-[13px] font-semibold text-ink">{dateLabel}</span>
                  <div className="h-px flex-1 bg-line" />
                  <span className={CAPTION}>
                    {groupItems.length} item{groupItems.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {groupItems.map((item) =>
                    item.type === "resume" ? (
                      <ResumeCard key={item.id} item={item} />
                    ) : (
                      <CoverLetterCard key={item.id} item={item} />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
