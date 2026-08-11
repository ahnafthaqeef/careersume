"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { withBasePath } from "@/lib/basePath";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const PRIMARY = `rounded-md bg-ink px-4 py-2 text-[14px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const GHOST = `inline-flex min-h-[44px] items-center rounded-md border border-line bg-surface px-3 text-[13px] font-medium text-ink transition-colors duration-200 hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
// Kanban columns are narrow, so a card's secondary actions are text links rather
// than a row of buttons that would wrap three deep.
const CARD_LINK = `inline-flex min-h-[44px] items-center text-[13px] text-ink-2 transition-colors duration-200 hover:text-ink ${FOCUS}`;
const CAPTION = "text-[13px] text-ink-3";

interface SavedJob {
  id: string;
  job_id: string;
  title: string;
  company: string;
  company_logo: string | null;
  location: string;
  employment_type: string;
  source: string;
  apply_url: string;
  full_description: string;
  status: "saved" | "applied" | "interviewing" | "offer" | "rejected";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Class strings are written out in full so Tailwind can see them.
const COLUMNS: { key: SavedJob["status"]; label: string; dot: string; text: string; chip: string }[] = [
  { key: "saved",        label: "Saved",        dot: "bg-ink-3",         text: "text-ink-3",         chip: "border-line bg-paper text-ink-2" },
  { key: "applied",      label: "Applied",      dot: "bg-ink",           text: "text-ink",           chip: "border-line bg-paper text-ink" },
  { key: "interviewing", label: "Interviewing", dot: "bg-score-partial", text: "text-score-partial", chip: "border-score-partial/30 bg-score-partial/5 text-score-partial" },
  { key: "offer",        label: "Offer",        dot: "bg-accent",        text: "text-accent",        chip: "border-accent/30 bg-accent/10 text-accent" },
  { key: "rejected",     label: "Rejected",     dot: "bg-score-missing", text: "text-score-missing", chip: "border-score-missing/30 bg-score-missing/5 text-score-missing" },
];

const STATUS_NEXT: Record<SavedJob["status"], SavedJob["status"] | null> = {
  saved: "applied",
  applied: "interviewing",
  interviewing: "offer",
  offer: null,
  rejected: null,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function JobCard({
  job,
  onStatusChange,
  onDelete,
  onBuildResume,
  onNotesChange,
}: {
  job: SavedJob;
  onStatusChange: (id: string, status: SavedJob["status"]) => void;
  onDelete: (id: string) => void;
  onBuildResume: (job: SavedJob) => void;
  onNotesChange: (id: string, notes: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(job.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const nextStatus = STATUS_NEXT[job.status];
  const nextColumn = nextStatus ? COLUMNS.find((c) => c.key === nextStatus)! : null;

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await onNotesChange(job.id, notes);
    setSavingNotes(false);
  };

  return (
    <div className="rounded-md border border-line bg-surface p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {job.company_logo ? (
          <img
            src={job.company_logo}
            alt={job.company}
            className="h-9 w-9 flex-none rounded border border-line bg-surface object-contain"
          />
        ) : (
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded border border-line bg-paper font-serif text-[15px] text-ink">
            {job.company.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight text-ink">{job.title}</p>
          <p className={`mt-0.5 truncate ${CAPTION}`}>{job.company}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {job.location && (
              <span className="whitespace-nowrap rounded border border-line bg-paper px-1.5 py-0.5 text-[12px] text-ink-2">
                {job.location}
              </span>
            )}
            {job.source && (
              <span className="whitespace-nowrap rounded border border-line bg-paper px-1.5 py-0.5 text-[12px] text-ink-2">
                {job.source}
              </span>
            )}
          </div>
        </div>
        <span className={`flex-none ${CAPTION}`}>{timeAgo(job.created_at)}</span>
      </div>

      {/* Actions */}
      <div className="mt-3 space-y-1">
        {nextStatus && nextColumn && (
          <button
            onClick={() => onStatusChange(job.id, nextStatus)}
            className={`min-h-[44px] w-full whitespace-nowrap rounded-md border px-2 py-1.5 text-[13px] font-medium transition-opacity duration-200 hover:opacity-80 ${FOCUS} ${nextColumn.chip}`}
          >
            Move to {nextColumn.label.toLowerCase()}
          </button>
        )}
        <div className="flex flex-wrap items-center gap-x-4">
          <button onClick={() => onBuildResume(job)} className={CARD_LINK}>
            Resume
          </button>
          <a
            href="/cover-letter"
            onClick={() => sessionStorage.setItem("cover_letter_job", JSON.stringify({ title: job.title, company: job.company, text: job.full_description }))}
            className={CARD_LINK}
          >
            Cover letter
          </a>
          {job.apply_url && (
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className={CARD_LINK}>
              Apply
            </a>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className={CARD_LINK}
          >
            {expanded ? "Less" : "More"}
          </button>
          {job.status !== "rejected" && (
            <button
              onClick={() => onStatusChange(job.id, "rejected")}
              className={`ml-auto inline-flex min-h-[44px] items-center text-[13px] text-ink-3 transition-colors duration-200 hover:text-score-missing ${FOCUS}`}
            >
              Rejected
            </button>
          )}
        </div>
      </div>

      {/* Expanded: notes */}
      {expanded && (
        <div className="mt-3 border-t border-line pt-3">
          <label htmlFor={`notes-${job.id}`} className={CAPTION}>
            Notes
          </label>
          <textarea
            id={`notes-${job.id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add notes, contacts, next steps..."
            className="mt-1.5 w-full resize-none rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
          />
          <div className="mt-2 flex items-center justify-between">
            <button onClick={handleSaveNotes} disabled={savingNotes} className={GHOST}>
              {savingNotes ? "Saving..." : "Save notes"}
            </button>
            <button
              onClick={() => onDelete(job.id)}
              className={`text-[13px] text-ink-3 transition-colors duration-200 hover:text-score-missing ${FOCUS}`}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobTrackerPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(withBasePath("/api/job-tracker"))
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setJobs(data.jobs ?? []);
      })
      .catch(() => setError("Failed to load jobs"))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: SavedJob["status"]) => {
    const res = await fetch(withBasePath(`/api/job-tracker/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.job) setJobs((prev) => prev.map((j) => (j.id === id ? data.job : j)));
  };

  const updateNotes = async (id: string, notes: string) => {
    const res = await fetch(withBasePath(`/api/job-tracker/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    const data = await res.json();
    if (data.job) setJobs((prev) => prev.map((j) => (j.id === id ? data.job : j)));
  };

  const deleteJob = async (id: string) => {
    const res = await fetch(withBasePath(`/api/job-tracker/${id}`), { method: "DELETE" });
    if (!res.ok) return;
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleBuildResume = (job: SavedJob) => {
    sessionStorage.setItem("job_scanner_jd", JSON.stringify({
      title: job.title,
      company: job.company,
      text: job.full_description,
    }));
    router.push("/builder");
  };

  const byStatus = (status: SavedJob["status"]) => jobs.filter((j) => j.status === status);

  return (
    <div className="min-h-screen bg-paper">
      <AppNav
        active="/job-tracker"
        right={
          <Link href="/job-scanner" className={PRIMARY}>
            Find jobs
          </Link>
        }
      />

      <div className="mx-auto max-w-screen-xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-[clamp(2rem,4vw,2.75rem)] leading-[1.1] tracking-[-0.01em]">
              Job tracker
            </h1>
            <p className="mt-2 text-[17px] leading-[28px] text-ink-2">
              {jobs.length} job{jobs.length !== 1 ? "s" : ""} tracked.
            </p>
          </div>
          {/* Summary pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {COLUMNS.map((col) => {
              const count = byStatus(col.key).length;
              if (count === 0) return null;
              return (
                <span
                  key={col.key}
                  className={`whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-medium ${col.chip}`}
                >
                  {col.label} {count}
                </span>
              );
            })}
          </div>
        </div>

        {loading && <p className={CAPTION}>Loading your tracked jobs...</p>}

        {error && (
          <p
            role="alert"
            className="mb-6 rounded-md border border-score-missing/30 bg-score-missing/5 p-4 text-[14px] text-score-missing"
          >
            {error === "Unauthorized" ? (
              <>
                You need to{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  sign in
                </Link>{" "}
                to use the job tracker.
              </>
            ) : error}
          </p>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="font-serif text-[28px] leading-tight tracking-[-0.01em]">
              No jobs tracked yet
            </h2>
            <p className="mt-3 max-w-[52ch] text-[17px] leading-[28px] text-ink-2">
              Find jobs in the scanner and save them to start tracking your applications here.
            </p>
            <Link href="/job-scanner" className={`mt-8 ${PRIMARY}`}>
              Go to the job scanner
            </Link>
          </div>
        )}

        {/* Kanban board */}
        {!loading && jobs.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {COLUMNS.map((col) => {
              const colJobs = byStatus(col.key);
              return (
                <div key={col.key}>
                  {/* Column header */}
                  <div className="mb-3 flex items-center gap-2 border-b border-line px-1 pb-2">
                    <span className={`h-2 w-2 flex-none rounded-full ${col.dot}`} />
                    <span className={`text-[13px] font-semibold ${col.text}`}>{col.label}</span>
                    <span className={`ml-auto ${CAPTION}`}>{colJobs.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {colJobs.length === 0 && (
                      <p
                        className={`rounded-md border border-dashed border-line p-4 text-center ${CAPTION}`}
                      >
                        Empty
                      </p>
                    )}
                    {colJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onStatusChange={updateStatus}
                        onDelete={deleteJob}
                        onBuildResume={handleBuildResume}
                        onNotesChange={updateNotes}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
