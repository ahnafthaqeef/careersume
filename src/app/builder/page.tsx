"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import JobInput from "@/components/JobInput";
import ProfileInput from "@/components/ProfileInput";
import TemplateSelector from "@/components/TemplateSelector";
import ResumeOutput from "@/components/ResumeOutput";
import CheckingKey from "@/components/CheckingKey";
import { createClient } from "@/lib/supabase/client";
import { useRequireKey } from "@/lib/useRequireKey";
import { withBasePath } from "@/lib/basePath";
import type { JobAnalysis, GeneratedResume, TemplateName } from "@/types";

type Step = "job" | "profile" | "template" | "output";

interface UserStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
}

interface TokenProviderRow {
  provider: string;
  tokens: number;
  count: number;
}

interface TokenStats {
  today: TokenProviderRow[];
  allTime: TokenProviderRow[];
}

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const PRIMARY = `w-full rounded-md bg-ink px-5 py-3 text-[15px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const GHOST = `inline-flex min-h-[44px] items-center rounded-md border border-line px-3 text-[13px] font-semibold text-ink transition-colors duration-200 hover:border-ink ${FOCUS}`;
const QUIET = `inline-flex min-h-[44px] items-center rounded px-2 text-[13px] text-ink-2 transition-colors duration-200 hover:text-ink ${FOCUS}`;
const PANEL = "rounded-md border border-line bg-surface p-6 shadow-paper";
const CAPTION = "text-[13px] text-ink-3";

const FEATURES = ["ATS optimized", "Match score", "AI rewriting", "URL import"];

function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-line ${className ?? "h-4 w-20"}`} />;
}

function TokenRow({ row }: { row: TokenProviderRow }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-1.5 text-[13px] last:border-b-0">
      <span className="font-medium capitalize text-ink">{row.provider}</span>
      <span className="text-ink-3">
        {row.tokens.toLocaleString()} tokens · {row.count} {row.count === 1 ? "run" : "runs"}
      </span>
    </div>
  );
}

const STATUS_MESSAGES = [
  "Reading the job description",
  "Matching your experience to the role",
  "Rewriting your bullets around the requirements",
  "Putting the sections in the order a reader expects",
  "Checking keyword coverage against the posting",
  "Formatting so a parser can read every line",
  "Almost there",
];

export default function BuilderPage() {
  const router = useRouter();
  const { checking } = useRequireKey();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [jobText, setJobText] = useState("");
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [scannerJob, setScannerJob] = useState<{ text: string; source: string; analysis: JobAnalysis | null } | null>(null);
  const [profileText, setProfileText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateName>("experienced");
  const [profilePicture, setProfilePicture] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [displayMessage, setDisplayMessage] = useState("");
  const [fakeProgress, setFakeProgress] = useState(0);
  const [result, setResult] = useState<GeneratedResume | null>(null);
  const [error, setError] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);
  const [tokenStatsLoading, setTokenStatsLoading] = useState(false);

  useEffect(() => {
    // Hold off until the key check clears, so a user on the way to the wizard
    // never triggers these lookups.
    if (checking) return;

    // Read job data from sessionStorage (set by job scanner) or URL params fallback
    const params = new URLSearchParams(window.location.search);
    const title = params.get("jd_title");
    const company = params.get("jd_company");
    const fromScanner = params.get("from_scanner");

    if (fromScanner === "1") {
      try {
        const stored = sessionStorage.getItem("scanner_job");
        if (stored) {
          const { text } = JSON.parse(stored);
          sessionStorage.removeItem("scanner_job");
          setScannerJob({ text, source: `${title} at ${company}`, analysis: null });
        }
      } catch { /* ignore */ }
    } else {
      const jd = params.get("jd");
      if (jd) {
        setScannerJob({ text: jd, source: `${title} at ${company}`, analysis: null });
      }
    }

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (data?.role) setUserRole(data.role);

        setUserStatsLoading(true);
        fetch(withBasePath("/api/user-stats"))
          .then((r) => r.json())
          .then((data) => {
            if (!data.error) setUserStats(data);
          })
          .catch(() => {})
          .finally(() => setUserStatsLoading(false));
      }
    });
  }, [checking]);

  // Pooled token usage is an admin-only panel, so only an admin asks for it.
  useEffect(() => {
    if (checking || userRole !== "admin") return;

    setTokenStatsLoading(true);
    fetch(withBasePath("/api/token-stats"))
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setTokenStats(data);
      })
      .catch(() => {})
      .finally(() => setTokenStatsLoading(false));
  }, [checking, userRole]);

  useEffect(() => {
    if (!isGenerating) {
      setDisplayMessage("");
      return;
    }
    let idx = 0;
    setDisplayMessage(STATUS_MESSAGES[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % STATUS_MESSAGES.length;
      setDisplayMessage(STATUS_MESSAGES[idx]);
    }, 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating) {
      if (fakeProgress > 0) {
        setFakeProgress(100);
        const t = setTimeout(() => setFakeProgress(0), 400);
        return () => clearTimeout(t);
      }
      return;
    }
    setFakeProgress(10);
    const interval = setInterval(() => {
      setFakeProgress((prev) => {
        if (prev >= 85) return prev;
        return Math.min(85, prev + 1.5);
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const completedJob = !!jobAnalysis;
  const completedProfile = profileText.trim().length > 100;
  const canGenerate = completedJob && completedProfile;

  const currentStep: Step = result
    ? "output"
    : canGenerate
    ? "template"
    : completedJob
    ? "profile"
    : "job";

  const handleJobAnalyzed = (text: string, analysis: JobAnalysis) => {
    setJobText(text);
    setJobAnalysis(analysis);
    setResult(null);
    setError("");
  };

  const handleProfileReady = (text: string) => {
    setProfileText(text);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setError("");
    setResult(null);
    setGenerationStatus("Starting resume generation...");

    try {
      const response = await fetch(withBasePath("/api/generate-resume"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobText,
          jobAnalysis,
          profileText,
          templateName: selectedTemplate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.code === "NO_KEY") {
          router.push("/onboarding");
          return;
        }
        throw new Error(data.error || "Generation failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "status") {
                setGenerationStatus(data.message);
                setDisplayMessage(data.message);
              } else if (data.type === "error") {
                throw new Error(data.message);
              } else if (data.type === "complete") {
                setResult(data.data as GeneratedResume);
                setGenerationStatus("");
                setTimeout(() => {
                  outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message !== "Unexpected token") {
                throw parseErr;
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulletUpdate = (original: string, replacement: string) => {
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        resume: {
          ...prev.resume,
          workExperience: prev.resume.workExperience.map((job) => ({
            ...job,
            bullets: job.bullets.map((b) => (b === original ? replacement : b)),
          })),
        },
      };
    });
  };

  const [atsBoostResult, setAtsBoostResult] = useState<{
    original_score: number;
    boosted_score: number;
    improvements: string[];
  } | null>(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [boostError, setBoostError] = useState("");

  const handleAtsBoost = async () => {
    if (!result) return;
    setIsBoosting(true);
    setBoostError("");
    try {
      const res = await fetch(withBasePath("/api/ats-boost"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: result.resume,
          jobDescription: jobText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "NO_KEY") {
          router.push("/onboarding");
          return;
        }
        setBoostError(data.error || "ATS boost failed.");
        return;
      }
      setAtsBoostResult({
        original_score: data.original_score,
        boosted_score: data.boosted_score,
        improvements: data.improvements,
      });
      setResult((prev) => prev ? { ...prev, resume: data.improved_resume, matchScore: data.boosted_score } : null);
    } catch {
      setBoostError("ATS boost failed. Please try again.");
    } finally {
      setIsBoosting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setAtsBoostResult(null);
    setBoostError("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const stepNumberClass = (state: "done" | "active" | "waiting") =>
    `flex h-7 w-7 flex-none items-center justify-center rounded-full border text-[13px] font-semibold ${
      state === "done"
        ? "border-accent bg-accent text-accent-ink"
        : state === "active"
        ? "border-ink bg-ink text-paper"
        : "border-line text-ink-3"
    }`;

  if (checking) return <CheckingKey />;

  return (
    <div className="min-h-screen bg-paper">
      <AppNav
        active="/builder"
        container="max-w-6xl"
        right={
          <>
            {result && (
              <button onClick={handleReset} className={GHOST}>
                Start over
              </button>
            )}
            {userRole === "admin" && (
              <a href="/admin" className={QUIET}>
                Admin
              </a>
            )}
            {userEmail && (
              <span className={`hidden max-w-[160px] truncate md:block ${CAPTION}`}>
                {userEmail}
              </span>
            )}
            <button onClick={handleLogout} className={QUIET}>
              Sign out
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <div className="pt-8">
          {!result && (
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-serif text-[clamp(2rem,4vw,2.75rem)] leading-[1.1] tracking-[-0.01em]">
                  Resume builder
                </h1>
                <p className="mt-2 text-[17px] leading-[28px] text-ink-2">
                  Tailor your resume to any job in seconds.
                </p>
              </div>
              <div className="hidden flex-wrap gap-1.5 lg:flex">
                {FEATURES.map((f) => (
                  <span
                    key={f}
                    className="rounded border border-line bg-surface px-2 py-0.5 text-[12px] text-ink-3"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Step progress. Stays up in the output state so the run reads as finished. */}
          <ol className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-line py-3">
            {[
              { step: "job", label: "Job", done: completedJob },
              { step: "profile", label: "Profile", done: completedProfile && completedJob },
              { step: "template", label: "Template", done: canGenerate },
              { step: "output", label: "Resume", done: !!result },
            ].map(({ step, label, done }, i) => {
              const isActive = currentStep === step;
              return (
                <li key={step} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden className="h-px w-6 bg-line" />}
                  <span
                    className={`text-[13px] ${
                      isActive
                        ? "font-semibold text-ink"
                        : done
                        ? "text-accent"
                        : "text-ink-3"
                    }`}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* User Activity + Token row */}
          {!result && (userEmail || userRole === "admin") && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {userEmail && (
                <div className="rounded-md border border-line bg-surface px-5 py-4">
                  <p className={CAPTION}>Your activity</p>
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {userStatsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5">
                          <SkeletonBox className="h-6 w-8" />
                          <SkeletonBox className="h-2.5 w-12" />
                        </div>
                      ))
                    ) : userStats ? (
                      [
                        { val: userStats.today, label: "Today" },
                        { val: userStats.thisWeek, label: "This week" },
                        { val: userStats.thisMonth, label: "This month" },
                        { val: userStats.allTime, label: "All time" },
                      ].map(({ val, label }) => (
                        <div key={label} className="flex flex-col items-center">
                          <span className="font-serif text-[24px] leading-none text-ink">
                            {val}
                          </span>
                          <span className={`mt-1 text-center ${CAPTION}`}>{label}</span>
                        </div>
                      ))
                    ) : (
                      <p className={`col-span-4 text-center ${CAPTION}`}>
                        Generate your first resume.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {userRole === "admin" && (
                <div className="rounded-md border border-line bg-surface px-5 py-4">
                  <p className={CAPTION}>AI usage by provider</p>
                  {tokenStatsLoading ? (
                    <div className="mt-3 flex flex-col gap-2">
                      {[0, 1].map((i) => (
                        <SkeletonBox key={i} className="h-4 w-full" />
                      ))}
                    </div>
                  ) : tokenStats ? (
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                          Today
                        </p>
                        <div className="mt-1.5">
                          {tokenStats.today.length ? (
                            tokenStats.today.map((row) => <TokenRow key={row.provider} row={row} />)
                          ) : (
                            <p className={CAPTION}>No usage yet today.</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                          All time
                        </p>
                        <div className="mt-1.5">
                          {tokenStats.allTime.length ? (
                            tokenStats.allTime.map((row) => <TokenRow key={row.provider} row={row} />)
                          ) : (
                            <p className={CAPTION}>No usage yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className={`mt-3 ${CAPTION}`}>Unavailable</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Step 1: Job Description */}
            <div className={PANEL}>
              <div className="mb-6 flex items-center gap-3">
                <div className={stepNumberClass(completedJob ? "done" : "active")}>1</div>
                <div>
                  <h2 className="text-[17px] font-semibold text-ink">Job description</h2>
                  <p className={CAPTION}>Paste the job posting or enter a URL.</p>
                </div>
              </div>
              <JobInput
                key={scannerJob?.source ?? "manual"}
                onAnalysisComplete={handleJobAnalyzed}
                initialJobText={scannerJob?.text}
                initialSource={scannerJob?.source}
                initialAnalysis={scannerJob?.analysis ?? undefined}
              />
            </div>

            {/* Step 2: Profile */}
            <div className={PANEL}>
              <div className="mb-6 flex items-center gap-3">
                <div
                  className={stepNumberClass(
                    completedProfile && completedJob ? "done" : completedJob ? "active" : "waiting"
                  )}
                >
                  2
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold text-ink">Your profile</h2>
                  <p className={CAPTION}>Upload your resume or use your master profile.</p>
                </div>
              </div>
              <ProfileInput
                onProfileReady={handleProfileReady}
                onProfilePictureChange={setProfilePicture}
              />
            </div>
          </div>
        </div>

        {/* Step 3: Template */}
        {canGenerate && !result && (
          <div className={`mt-6 animate-slide-up ${PANEL}`}>
            <div className="mb-6 flex items-center gap-3">
              <div className={stepNumberClass("active")}>3</div>
              <div>
                <h2 className="text-[17px] font-semibold text-ink">Choose a template</h2>
                <p className={CAPTION}>Pick a design that fits your industry and style.</p>
              </div>
            </div>
            <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
          </div>
        )}

        {/* Generate Button */}
        {canGenerate && !result && (
          <div className="mt-6">
            {error && (
              <div
                role="alert"
                className="mb-4 animate-fade-in rounded-md border border-score-missing/30 bg-score-missing/5 p-4"
              >
                <p className="text-[14px] font-semibold text-score-missing">Generation failed</p>
                <p className="mt-1 text-[14px] text-score-missing">{error}</p>
              </div>
            )}

            <button onClick={handleGenerate} disabled={isGenerating} className={PRIMARY}>
              {isGenerating
                ? displayMessage || generationStatus || "Generating your resume..."
                : "Generate tailored resume"}
            </button>

            {isGenerating && (
              <div className="mt-4 rounded-md border border-line bg-surface p-4">
                <p className="text-[14px] font-medium text-ink">
                  {displayMessage || generationStatus}
                </p>
                <p className={`mt-1 ${CAPTION}`}>
                  The AI is reading your experience and tailoring it to the job.
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${fakeProgress}%` }}
                  />
                </div>
              </div>
            )}

            <p className={`mt-3 text-center ${CAPTION}`}>Takes about 10 to 20 seconds.</p>
          </div>
        )}

        {/* Not ready yet */}
        {!canGenerate && (completedJob || completedProfile) && (
          <p className="mt-6 rounded-md border border-line bg-surface p-4 text-center text-[14px] text-ink-2">
            {!completedJob
              ? "Analyze a job description to continue."
              : "Add your profile to continue."}
          </p>
        )}

        {/* Output */}
        {result && (
          <div ref={outputRef} className={`mt-8 animate-slide-up ${PANEL}`}>
            <ResumeOutput
              result={{
                ...result,
                resume: {
                  ...result.resume,
                  personalInfo: {
                    ...result.resume.personalInfo,
                    ...(profilePicture ? { profilePicture } : {}),
                  },
                },
              }}
              template={selectedTemplate}
              jobText={jobText}
              jobAnalysis={jobAnalysis}
              onChangeTemplate={(t) => {
                setSelectedTemplate(t);
              }}
              onBulletUpdate={handleBulletUpdate}
            />

            {/* ATS Score Booster */}
            <div className="mt-6">
              {!atsBoostResult && (
                <>
                  <button onClick={handleAtsBoost} disabled={isBoosting} className={PRIMARY}>
                    {isBoosting ? "Boosting ATS score..." : "Boost ATS score"}
                  </button>
                  {boostError && (
                    <p role="alert" className="mt-2 text-center text-[13px] text-score-missing">
                      {boostError}
                    </p>
                  )}
                </>
              )}

              {atsBoostResult && (
                <div className="rounded-md border border-accent/30 bg-accent/5 p-4">
                  <p className="text-[15px] font-semibold text-accent">
                    ATS score: {atsBoostResult.original_score} to {atsBoostResult.boosted_score}, up{" "}
                    {atsBoostResult.boosted_score - atsBoostResult.original_score} points
                  </p>
                  <ul className="mt-2 space-y-1">
                    {atsBoostResult.improvements.map((imp, i) => (
                      <li key={i} className="text-[13px] leading-[20px] text-ink-2">
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
              <p className="text-[14px] text-ink-2">
                Want to try a different approach or update something?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`rounded-md bg-ink px-4 py-2 text-[14px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
                >
                  {isGenerating ? "Regenerating..." : "Regenerate"}
                </button>
                <button
                  onClick={handleReset}
                  className={`rounded-md border border-line px-4 py-2 text-[14px] font-semibold text-ink transition-colors duration-200 hover:border-ink ${FOCUS}`}
                >
                  Start over
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 sm:flex-row">
          <p className="font-serif text-lg leading-none">Careersume</p>
          <p className={CAPTION}>
            Your profile and your key stay in your own account. Nothing is sold.
          </p>
        </div>
      </footer>
    </div>
  );
}
