"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import CheckingKey from "@/components/CheckingKey";
import { loadMasterProfile } from "@/lib/profile";
import { useRequireKey } from "@/lib/useRequireKey";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const PRIMARY = `inline-flex min-h-[44px] items-center justify-center rounded-md bg-ink px-5 text-[14px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const GHOST = `inline-flex min-h-[44px] items-center justify-center rounded-md border border-line bg-surface px-4 text-[14px] font-semibold text-ink transition-colors duration-200 hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const INPUT =
  "w-full rounded-md border border-line bg-paper px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface";
const CAPTION = "text-[13px] text-ink-3";
const CHIP = "rounded border px-2 py-0.5 text-[12px]";
const CHIP_LINE = `${CHIP} border-line bg-paper text-ink-2`;
const CHIP_ACCENT = `${CHIP} border-accent/30 bg-accent/10 text-accent`;
const SECTION_LABEL = "text-[13px] font-semibold text-ink";

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  locations: string[];
  categories: string[];
  levels: string[];
  employmentType: string;
  description: string;
  fullDescription: string;
  applyUrl: string;
  postedAt: string;
  isRemote: boolean;
  source: string;
}

interface JobAnalysis {
  jobTitle: string;
  seniorityLevel: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  keywords: string[];
  tools: string[];
}

const DATE_FILTERS = [
  { value: "month", label: "Past month" },
  { value: "week",  label: "Past week" },
  { value: "3days", label: "Past 3 days" },
  { value: "today", label: "Today" },
];

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function CompanyMark({ job, size }: { job: Job; size: "sm" | "lg" }) {
  const box = size === "sm" ? "h-10 w-10" : "h-14 w-14";
  if (job.companyLogo) {
    return (
      <img
        src={job.companyLogo}
        alt={job.company}
        className={`${box} flex-none rounded border border-line bg-surface object-contain`}
      />
    );
  }
  return (
    <div
      className={`${box} flex flex-none items-center justify-center rounded border border-line bg-paper font-serif text-lg text-ink`}
    >
      {job.company.charAt(0)}
    </div>
  );
}

function JobCard({ job, isSelected, onClick }: { job: Job; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-md border bg-surface p-4 text-left transition-colors duration-200 ${FOCUS} ${
        isSelected ? "border-ink" : "border-line hover:border-ink"
      }`}
    >
      <div className="flex items-start gap-3">
        <CompanyMark job={job} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight text-ink">{job.title}</p>
          <p className={`mt-0.5 truncate ${CAPTION}`}>{job.company}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {job.isRemote && <span className={CHIP_ACCENT}>Remote</span>}
            {job.locations.slice(0, 1).map((loc) => (
              <span key={loc} className={CHIP_LINE}>{loc}</span>
            ))}
            {job.employmentType && (
              <span className={CHIP_LINE}>{job.employmentType.replace(/_/g, " ")}</span>
            )}
            {job.source && <span className={CHIP_LINE}>{job.source}</span>}
          </div>
        </div>
        <span className={`flex-none ${CAPTION}`}>{timeAgo(job.postedAt)}</span>
      </div>
    </button>
  );
}

interface MatchResult {
  score: number;
  matched: string[];
  missing: string[];
}

function computeMatch(analysis: JobAnalysis, profileText: string): MatchResult {
  const profileLower = profileText.toLowerCase();
  const allSkills = [...new Set([...analysis.requiredSkills, ...analysis.tools])];
  const matched = allSkills.filter((s) => profileLower.includes(s.toLowerCase()));
  const missing = allSkills.filter((s) => !profileLower.includes(s.toLowerCase()));
  const score = allSkills.length > 0 ? Math.round((matched.length / allSkills.length) * 100) : 0;
  return { score, matched, missing };
}

// Class strings are written out in full so Tailwind can see them.
function matchTone(score: number) {
  if (score >= 75) return { text: "text-accent", bar: "bg-accent" };
  if (score >= 50) return { text: "text-score-partial", bar: "bg-score-partial" };
  return { text: "text-ink-2", bar: "bg-ink-3" };
}

function JobDetail({ job, onBuildResume, onAnalysis }: { job: Job; onBuildResume: (job: Job) => void; onAnalysis: (a: JobAnalysis | null) => void }) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [match, setMatch] = useState<MatchResult | null>(null);

  // Reset state when job changes
  useEffect(() => { setSaved(false); setMatch(null); }, [job.id]);

  const handleSaveJob = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/job-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          title: job.title,
          company: job.company,
          company_logo: job.companyLogo,
          location: job.locations[0] ?? "",
          employment_type: job.employmentType,
          source: job.source,
          apply_url: job.applyUrl,
          full_description: job.fullDescription,
        }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!job.fullDescription) return;
    setAnalysis(null);
    onAnalysis(null);
    setAnalyzeError("");
    setAnalyzing(true);

    fetch("/api/analyze-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobText: job.fullDescription }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.code === "NO_KEY") {
          router.push("/onboarding");
          return;
        }
        if (data.analysis) {
          setAnalysis(data.analysis);
          onAnalysis(data.analysis);
          const profile = await loadMasterProfile();
          if (typeof profile === "string" && profile) setMatch(computeMatch(data.analysis, profile));
        } else setAnalyzeError(data.error || "Analysis failed");
      })
      .catch(() => setAnalyzeError("Analysis failed"))
      .finally(() => setAnalyzing(false));
  }, [job.id]);

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="border-b border-line p-6">
        <div className="flex items-start gap-4">
          <CompanyMark job={job} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-[24px] leading-tight tracking-[-0.01em]">{job.title}</h2>
            <p className="mt-1 text-[14px] text-ink-2">{job.company}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {job.isRemote && <span className={CHIP_ACCENT}>Remote</span>}
              {job.locations.map((loc) => (
                <span key={loc} className={CHIP_LINE}>{loc}</span>
              ))}
              {job.employmentType && (
                <span className={CHIP_LINE}>{job.employmentType.replace(/_/g, " ")}</span>
              )}
              {job.source && <span className={CHIP_LINE}>via {job.source}</span>}
            </div>
          </div>
        </div>

        {/* Match score */}
        {match && (() => {
          const tone = matchTone(match.score);
          return (
            <div className="mt-4 flex items-center gap-4 rounded-md border border-line bg-paper px-4 py-3">
              <span className={`font-serif text-[28px] leading-none ${tone.text}`}>
                {match.score}%
              </span>
              <div className="min-w-0 flex-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full rounded-full transition-all ${tone.bar}`}
                    style={{ width: `${match.score}%` }}
                  />
                </div>
                <p className={`mt-1.5 ${CAPTION}`}>
                  {match.matched.length} of {match.matched.length + match.missing.length} required
                  skills matched
                </p>
              </div>
            </div>
          );
        })()}

        {/* CTAs */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => onBuildResume(job)} className={`flex-1 whitespace-nowrap ${PRIMARY}`}>
            Build resume
          </button>
          <Link
            href={`/cover-letter?job=${encodeURIComponent(job.id)}`}
            onClick={() => {
              sessionStorage.setItem("cover_letter_job", JSON.stringify({
                title: job.title, company: job.company,
                text: job.fullDescription, analysis,
              }));
            }}
            className={`whitespace-nowrap ${GHOST}`}
          >
            Cover letter
          </Link>
          <button
            onClick={handleSaveJob}
            disabled={saving || saved}
            className={`whitespace-nowrap ${GHOST} ${saved ? "border-accent text-accent" : ""}`}
          >
            {saved ? "Saved" : saving ? "Saving..." : "Save job"}
          </button>
          {job.applyUrl && (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`whitespace-nowrap ${GHOST}`}
            >
              Apply
            </a>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* AI Analysis */}
        <div className="border-b border-line p-6">
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-[15px] font-semibold text-ink">Job description analysis</h3>
            {analyzing && <span className={`ml-auto ${CAPTION}`}>Analyzing...</span>}
          </div>

          {analyzeError && (
            <p role="alert" className="text-[13px] text-score-missing">{analyzeError}</p>
          )}

          {analysis && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`w-24 flex-none ${CAPTION}`}>Seniority</span>
                <span className={CHIP_LINE}>{analysis.seniorityLevel}</span>
              </div>

              {analysis.requiredSkills?.length > 0 && (
                <div>
                  <p className={SECTION_LABEL}>Required skills</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {analysis.requiredSkills.map((s) => {
                      const isMatched = match?.matched.includes(s);
                      const isMissing = match && !isMatched;
                      return (
                        <span
                          key={s}
                          className={
                            isMatched
                              ? CHIP_ACCENT
                              : isMissing
                              ? `${CHIP} border-score-missing/30 bg-score-missing/5 text-score-missing`
                              : CHIP_LINE
                          }
                        >
                          {s}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {analysis.tools?.length > 0 && (
                <div>
                  <p className={SECTION_LABEL}>Tools and tech</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {analysis.tools.map((t) => (
                      <span key={t} className={CHIP_LINE}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.preferredSkills?.length > 0 && (
                <div>
                  <p className={SECTION_LABEL}>Nice to have</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {analysis.preferredSkills.map((s) => (
                      <span key={s} className={CHIP_LINE}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.keywords?.length > 0 && (
                <div>
                  <p className={SECTION_LABEL}>ATS keywords</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {analysis.keywords.map((k) => (
                      <span key={k} className={CHIP_ACCENT}>{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.responsibilities?.length > 0 && (
                <div>
                  <p className={SECTION_LABEL}>Key responsibilities</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {analysis.responsibilities.slice(0, 5).map((r, i) => (
                      <li key={i} className="text-[14px] leading-[22px] text-ink-2">{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!analyzing && !analysis && !analyzeError && (
            <p className={CAPTION}>No description available to analyze.</p>
          )}
        </div>

        {/* Raw Description */}
        <div className="p-6">
          <h3 className={SECTION_LABEL}>Full description</h3>
          <div className="mt-3 whitespace-pre-line text-[14px] leading-[22px] text-ink-2">
            {job.fullDescription}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobScannerPage() {
  const router = useRouter();
  const { checking } = useRequireKey();
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [datePosted, setDatePosted] = useState("month");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [selectedJobAnalysis, setSelectedJobAnalysis] = useState<JobAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [savedSearches, setSavedSearches] = useState<{ keywords: string; location: string; datePosted: string; remoteOnly: boolean }[]>([]);

  // Load saved searches and restore last search on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("job_scanner_saved_searches");
      if (stored) setSavedSearches(JSON.parse(stored));
    } catch { /* ignore */ }

    try {
      const last = localStorage.getItem("job_scanner_last_search");
      if (last) {
        const { keywords: k, location: l, datePosted: d, remoteOnly: r } = JSON.parse(last);
        if (k) setKeywords(k);
        if (l) setLocation(l);
        if (d) setDatePosted(d);
        if (typeof r === "boolean") setRemoteOnly(r);
      }
    } catch { /* ignore */ }
  }, []);

  // Auto-save job to tracker when user selects it
  useEffect(() => {
    if (!selectedJob) return;
    fetch('/api/job-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: selectedJob.id,
        title: selectedJob.title,
        company: selectedJob.company,
        company_logo: selectedJob.companyLogo,
        location: selectedJob.locations[0] ?? '',
        employment_type: selectedJob.employmentType,
        source: selectedJob.source,
        apply_url: selectedJob.applyUrl,
        full_description: selectedJob.fullDescription,
      }),
    }).catch(() => {}); // silent fail — upsert handles duplicates
  }, [selectedJob]);

  const saveCurrentSearch = () => {
    if (!keywords.trim()) return;
    const entry = { keywords, location, datePosted, remoteOnly };
    const next = [entry, ...savedSearches.filter((s) => s.keywords !== keywords || s.location !== location)].slice(0, 10);
    setSavedSearches(next);
    localStorage.setItem("job_scanner_saved_searches", JSON.stringify(next));
    setToastMsg("Search saved");
  };

  const deleteSavedSearch = (idx: number) => {
    const next = savedSearches.filter((_, i) => i !== idx);
    setSavedSearches(next);
    localStorage.setItem("job_scanner_saved_searches", JSON.stringify(next));
  };

  const applySavedSearch = async (s: { keywords: string; location: string; datePosted: string; remoteOnly: boolean }) => {
    setKeywords(s.keywords);
    setLocation(s.location);
    setDatePosted(s.datePosted);
    setRemoteOnly(s.remoteOnly);
    setJobs([]);
    setSelectedJob(null);
    setSelectedJobAnalysis(null);
    setHasSearched(true);
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ keywords: s.keywords, location: s.location, datePosted: s.datePosted, remote: s.remoteOnly ? "1" : "", page: "1" });
      const res = await fetch(`/api/search-jobs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      const newJobs = data.jobs || [];
      setJobs(newJobs);
      setHasMore(data.hasMore);
      setPage(1);
      if (newJobs.length > 0) { setSelectedJob(newJobs[0]); setSelectedJobAnalysis(null); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const search = useCallback(async (nextPage = 1, append = false) => {
    if (!keywords.trim()) return;
    setIsLoading(true);
    setError("");
    if (!append) {
      setHasSearched(true);
      try {
        localStorage.setItem("job_scanner_last_search", JSON.stringify({ keywords, location, datePosted, remoteOnly }));
      } catch { /* ignore */ }
    }

    try {
      const params = new URLSearchParams({ keywords, location, datePosted, remote: remoteOnly ? "1" : "", page: String(nextPage) });
      const res = await fetch(`/api/search-jobs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      const newJobs = data.jobs || [];
      setJobs((prev) => (append ? [...prev, ...newJobs] : newJobs));
      setHasMore(data.hasMore);
      setPage(nextPage);
      if (!append && newJobs.length > 0) { setSelectedJob(newJobs[0]); setSelectedJobAnalysis(null); }
      // Auto-save search to history on every new search
      if (!append && keywords.trim()) {
        const entry = { keywords, location, datePosted, remoteOnly };
        setSavedSearches(prev => {
          const next = [entry, ...prev.filter(s => s.keywords !== keywords || s.location !== location)].slice(0, 10);
          try { localStorage.setItem("job_scanner_saved_searches", JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }, [keywords, location, datePosted, remoteOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setJobs([]);
    setSelectedJob(null);
    setMobileView("list");
    search(1, false);
  };

  const handleBuildResume = (job: Job) => {
    const fullText = job.fullDescription || `Job Title: ${job.title}\nCompany: ${job.company}`;
    // Store full JD in sessionStorage to avoid URL length limits
    sessionStorage.setItem("scanner_job", JSON.stringify({ text: fullText, title: job.title, company: job.company }));
    const params = new URLSearchParams({
      jd_title: job.title,
      jd_company: job.company,
      from_scanner: "1",
    });
    setToastMsg(`Opening the builder for ${job.title} at ${job.company}...`);
    setTimeout(() => router.push(`/builder?${params.toString()}`), 800);
  };

  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  if (checking) return <CheckingKey />;

  return (
    <div className="min-h-screen bg-paper">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 text-[14px] font-medium text-paper">
          {toastMsg}
        </div>
      )}

      <AppNav
        active="/job-scanner"
        right={
          <Link href="/builder" className={PRIMARY}>
            Build resume
          </Link>
        }
      />

      {/* Search bar */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-screen-xl px-4 pb-3 pt-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 overflow-x-hidden sm:flex-row">
            <div className="flex-1">
              <label htmlFor="scan-keywords" className="sr-only">Keywords</label>
              <input
                id="scan-keywords"
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Job title, skills, or keywords..."
                className={`min-h-[44px] ${INPUT}`}
              />
            </div>
            <div>
              <label htmlFor="scan-location" className="sr-only">Location</label>
              <input
                id="scan-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location or remote"
                className={`min-h-[44px] sm:w-44 ${INPUT}`}
              />
            </div>
            <label htmlFor="scan-date" className="sr-only">Date posted</label>
            <select
              id="scan-date"
              value={datePosted}
              onChange={(e) => setDatePosted(e.target.value)}
              className={`min-h-[44px] w-full cursor-pointer sm:w-auto ${INPUT}`}
            >
              {DATE_FILTERS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setRemoteOnly((v) => !v)}
              aria-pressed={remoteOnly}
              className={`min-h-[44px] w-full whitespace-nowrap sm:w-auto ${GHOST} ${
                remoteOnly ? "border-accent text-accent" : ""
              }`}
            >
              Remote only
            </button>
            <button
              type="submit"
              disabled={isLoading || !keywords.trim()}
              className={`min-h-[44px] w-full whitespace-nowrap sm:w-auto ${PRIMARY}`}
            >
              {isLoading && !jobs.length ? "Searching..." : "Search jobs"}
            </button>
            {keywords.trim() && (
              <button
                type="button"
                onClick={saveCurrentSearch}
                className={`min-h-[44px] w-full whitespace-nowrap sm:w-auto ${GHOST}`}
              >
                Save
              </button>
            )}
          </form>

          {/* Saved search pills */}
          {savedSearches.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={CAPTION}>Saved</span>
              {savedSearches.map((s, i) => (
                <span
                  key={i}
                  className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-[12px]"
                >
                  <button
                    onClick={() => applySavedSearch(s)}
                    className={`text-ink-2 transition-colors duration-200 hover:text-ink ${FOCUS}`}
                  >
                    {s.keywords}{s.location ? ` · ${s.location}` : ""}{s.remoteOnly ? " · Remote" : ""}
                  </button>
                  <button
                    onClick={() => deleteSavedSearch(i)}
                    className={`text-ink-3 transition-colors duration-200 hover:text-ink ${FOCUS}`}
                    aria-label={`Remove saved search ${s.keywords}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-screen-xl px-4 py-6">
        {/* Intro state */}
        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h1 className="font-serif text-[clamp(2rem,4vw,2.75rem)] leading-[1.1] tracking-[-0.01em]">
              Find your next role
            </h1>
            <p className="mt-4 max-w-[52ch] text-[17px] leading-[28px] text-ink-2">
              Search across LinkedIn, Jobstreet, Indeed, and more, then build a tailored, ATS-safe
              resume from whatever you find.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["Product Manager", "Software Engineer", "Data Analyst", "UX Designer", "Marketing"].map((kw) => (
                <button
                  key={kw}
                  onClick={() => { setKeywords(kw); setTimeout(() => { document.querySelector("form")?.requestSubmit(); }, 50); }}
                  className={`rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2 transition-colors duration-200 hover:border-ink hover:text-ink ${FOCUS}`}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md border border-score-missing/30 bg-score-missing/5 p-4 text-[14px] text-score-missing"
          >
            {error}
          </p>
        )}

        {/* Results layout */}
        {hasSearched && (
          <div className="flex min-h-[calc(100vh-220px)] gap-4 sm:h-[calc(100vh-220px)]">
            <div
              className={`fixed inset-0 z-30 overflow-y-auto bg-paper sm:hidden ${mobileView === 'detail' ? 'block' : 'hidden'}`}
            >
              <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper px-4 py-3">
                <button
                  onClick={() => setMobileView('list')}
                  className={`flex min-h-[44px] items-center text-[14px] text-ink-2 transition-colors duration-200 hover:text-ink ${FOCUS}`}
                >
                  Back to results
                </button>
              </div>
              {selectedJob && <JobDetail job={selectedJob} onBuildResume={handleBuildResume} onAnalysis={setSelectedJobAnalysis} />}
            </div>
            {/* Job list */}
            <div className={`w-full min-w-0 flex-shrink-0 sm:w-80 lg:w-96 ${mobileView === 'detail' ? 'hidden sm:flex' : 'flex'} flex-col`}>
              {isLoading && jobs.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse rounded-md border border-line bg-surface p-4">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded bg-line" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-3/4 rounded bg-line" />
                          <div className="h-3 w-1/2 rounded bg-line" />
                          <div className="mt-1 flex gap-1.5">
                            <div className="h-4 w-12 rounded-full bg-line" />
                            <div className="h-4 w-16 rounded-full bg-line" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                  <p className={CAPTION}>No jobs found. Try different keywords.</p>
                </div>
              ) : (
                <>
                  <p className={`mb-3 ${CAPTION}`}>
                    {jobs.length} result{jobs.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {jobs.map((job) => (
                      <JobCard key={job.id} job={job} isSelected={selectedJob?.id === job.id} onClick={() => { setSelectedJob(job); setMobileView('detail'); }} />
                    ))}
                    {hasMore && (
                      <button
                        onClick={() => search(page + 1, true)}
                        disabled={isLoading}
                        className={`w-full py-3 text-[14px] font-medium text-ink-2 transition-colors duration-200 hover:text-ink disabled:opacity-40 ${FOCUS}`}
                      >
                        {isLoading ? "Loading..." : "Load more"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Job detail */}
            <div className="hidden flex-1 overflow-hidden rounded-md border border-line sm:block">
              {selectedJob ? (
                <JobDetail job={selectedJob} onBuildResume={handleBuildResume} onAnalysis={setSelectedJobAnalysis} />
              ) : (
                <div className={`flex h-full items-center justify-center bg-surface ${CAPTION}`}>
                  Select a job to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
