"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import CheckingKey from "@/components/CheckingKey";
import { loadMasterProfile } from "@/lib/profile";
import { useRequireKey } from "@/lib/useRequireKey";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const PRIMARY = `rounded-md bg-ink px-5 py-3 text-[15px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const GHOST = `inline-flex min-h-[44px] items-center rounded-md border border-line bg-surface px-3 text-[13px] font-semibold text-ink transition-colors duration-200 hover:border-ink ${FOCUS}`;
const INPUT =
  "w-full rounded-md border border-line bg-paper px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface";
const LABEL = "block text-[13px] text-ink-3";
const CAPTION = "text-[13px] text-ink-3";
const PANEL = "rounded-md border border-line bg-surface p-5";

export default function CoverLetterPage() {
  const router = useRouter();
  const { checking } = useRequireKey();
  const [jobTitle, setJobTitle]     = useState("");
  const [company, setCompany]       = useState("");
  const [jobText, setJobText]       = useState("");
  const [profileText, setProfileText] = useState("");
  const [output, setOutput]         = useState("");
  const [streaming, setStreaming]   = useState(false);
  const [error, setError]           = useState("");
  const [copied, setCopied]         = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // Load from sessionStorage (when coming from scanner) + profile from localStorage
  useEffect(() => {
    // Hold off until the key check clears, so a user on the way to the wizard
    // never triggers the profile load.
    if (checking) return;

    const stored = sessionStorage.getItem("cover_letter_job");
    if (stored) {
      try {
        const { title, company: c, text } = JSON.parse(stored);
        setJobTitle(title ?? "");
        setCompany(c ?? "");
        setJobText(text ?? "");
        sessionStorage.removeItem("cover_letter_job");
      } catch { /* ignore */ }
    }
    loadMasterProfile()
      .then((profile) => {
        if (typeof profile === "string" && profile) setProfileText(profile);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

  const generate = async () => {
    if (!jobText.trim() || !profileText.trim()) return;
    setOutput("");
    setError("");
    setStreaming(true);

    try {
      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobText,
          resumeContent: profileText,
          candidateName: "",
          companyName: company,
          jobTitle,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.code === "NO_KEY") {
          router.push("/onboarding");
          return;
        }
        throw new Error(data.error || "Generation failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setOutput(full);
        outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: "smooth" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setStreaming(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasProfile = profileText.trim().length > 50;
  const hasJob = jobText.trim().length > 50;

  if (checking) return <CheckingKey />;

  return (
    <div className="min-h-screen bg-paper">
      <AppNav
        active="/cover-letter"
        right={
          <Link href="/job-scanner" className={`${GHOST} px-4 py-2 text-[14px]`}>
            Find jobs
          </Link>
        }
      />

      <div className="mx-auto max-w-screen-xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-[clamp(2rem,4vw,2.75rem)] leading-[1.1] tracking-[-0.01em]">
            Cover letter
          </h1>
          <p className="mt-2 text-[17px] leading-[28px] text-ink-2">
            Written from the same facts as your resume, tailored to the job.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: inputs */}
          <div className="space-y-4">
            {/* Job info */}
            <div className={`space-y-4 ${PANEL}`}>
              <h2 className="text-[15px] font-semibold text-ink">Job details</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="cl-title" className={LABEL}>Job title</label>
                  <input
                    id="cl-title"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Product Manager"
                    className={`mt-1.5 min-h-[44px] ${INPUT}`}
                  />
                </div>
                <div>
                  <label htmlFor="cl-company" className={LABEL}>Company</label>
                  <input
                    id="cl-company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className={`mt-1.5 min-h-[44px] ${INPUT}`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="cl-job" className={LABEL}>Job description</label>
                <textarea
                  id="cl-job"
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={10}
                  className={`mt-1.5 resize-none ${INPUT}`}
                />
                <p className={`mt-1 ${CAPTION}`}>{jobText.length} characters</p>
              </div>
            </div>

            {/* Profile */}
            <div className={`space-y-3 ${PANEL}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold text-ink">Your profile</h2>
                {hasProfile && (
                  <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[11px] text-accent">
                    Loaded from your master profile
                  </span>
                )}
              </div>
              {!hasProfile && (
                <p className={CAPTION}>
                  No profile saved yet.{" "}
                  <Link
                    href="/builder"
                    className="text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent"
                  >
                    Go to the resume builder
                  </Link>{" "}
                  to set up your master profile, or paste it below.
                </p>
              )}
              <label htmlFor="cl-profile" className="sr-only">Your profile</label>
              <textarea
                id="cl-profile"
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                placeholder="Paste your resume or profile here..."
                rows={6}
                className={`resize-none ${INPUT}`}
              />
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="rounded-md border border-score-missing/30 bg-score-missing/5 p-3 text-[14px] text-score-missing"
              >
                {error}
              </p>
            )}

            <button
              onClick={generate}
              disabled={streaming || !hasJob || !hasProfile}
              className={`w-full min-h-[44px] ${PRIMARY}`}
            >
              {streaming ? "Writing your cover letter..." : "Generate cover letter"}
            </button>
          </div>

          {/* Right: output */}
          <div
            className="flex flex-col overflow-hidden rounded-md border border-line bg-surface"
            style={{ minHeight: "500px" }}
          >
            {/* Output header */}
            <div className="flex items-center justify-between border-b border-line bg-paper px-5 py-3">
              <span className="text-[15px] font-semibold text-ink">Cover letter</span>
              {output && (
                <button
                  onClick={copyToClipboard}
                  className={`${GHOST} ${copied ? "border-accent text-accent" : ""}`}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            {/* Output body */}
            <div ref={outputRef} className="flex-1 overflow-y-auto p-5">
              {!output && !streaming && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-[15px] text-ink-2">Your cover letter will appear here.</p>
                  {!hasJob && (
                    <p className={`mt-1 ${CAPTION}`}>Add a job description to get started.</p>
                  )}
                  {!hasProfile && (
                    <p className={`mt-1 ${CAPTION}`}>Add your profile to personalise the letter.</p>
                  )}
                </div>
              )}

              {(output || streaming) && (
                <div className="whitespace-pre-wrap font-serif text-[15px] leading-[26px] text-ink">
                  {output}
                  {streaming && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-ink align-middle" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
