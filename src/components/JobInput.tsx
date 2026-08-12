"use client";

import { useState, useEffect, useRef } from "react";
import type { JobAnalysis } from "@/types";

interface JobInputProps {
  onAnalysisComplete: (text: string, analysis: JobAnalysis) => void;
  initialJobText?: string;
  initialSource?: string;
  initialApplyUrl?: string;
  initialAnalysis?: JobAnalysis;
}

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ground-2";
const PRIMARY = `w-full rounded-md bg-ink px-5 py-3 text-[15px] font-semibold text-ground transition-colors duration-200 hover:bg-ink-2 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-3 ${FOCUS}`;
const GHOST = `rounded-md border border-line px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors duration-200 hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const INPUT =
  "w-full rounded-md border border-line bg-ground px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-ground-2";
const CAPTION = "text-[13px] text-ink-3";
const CHIP = "rounded border px-1.5 py-0.5 text-[12px]";

function tabClass(isActive: boolean) {
  return `flex-1 py-2.5 px-4 text-[14px] font-medium transition-colors duration-200 ${FOCUS} ${
    isActive ? "bg-ink text-ground" : "bg-ground-2 text-ink-2 hover:text-ink"
  }`;
}

export default function JobInput({
  onAnalysisComplete,
  initialJobText,
  initialSource,
  initialApplyUrl,
  initialAnalysis,
}: JobInputProps) {
  const [mode, setMode] = useState<"paste" | "url">("paste");
  const [jobText, setJobText] = useState(initialJobText ?? "");
  const [jobUrl, setJobUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(initialAnalysis ?? null);

  // Auto-trigger once when scanner props arrive (may come after mount due to async sessionStorage read)
  const triggered = useRef(false);
  useEffect(() => {
    if (triggered.current) return;
    if (initialAnalysis && initialJobText) {
      triggered.current = true;
      onAnalysisComplete(initialJobText, initialAnalysis);
    } else if (initialJobText) {
      triggered.current = true;
      setJobText(initialJobText);
      setIsLoading(true);
      fetch("/api/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobText: initialJobText }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.analysis) {
            setAnalysis(data.analysis);
            onAnalysisComplete(initialJobText, data.analysis);
          } else {
            setError(data.error || "Analysis failed");
          }
        })
        .catch(() => setError("Analysis failed"))
        .finally(() => setIsLoading(false));
    } else if (initialApplyUrl) {
      triggered.current = true;
      setIsLoading(true);
      fetch("/api/fetch-job-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: initialApplyUrl }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.text) {
            setJobText(data.text);
            return fetch("/api/analyze-job", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jobText: data.text }),
            })
              .then((r) => r.json())
              .then((analysis) => {
                if (analysis.analysis) {
                  setAnalysis(analysis.analysis);
                  onAnalysisComplete(data.text, analysis.analysis);
                } else {
                  setError(analysis.error || "Analysis failed");
                }
              });
          } else {
            setError(data.error || "Could not fetch job description");
          }
        })
        .catch(() => setError("Could not fetch job description from URL"))
        .finally(() => setIsLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFetchUrl = async () => {
    if (!jobUrl.trim()) {
      setError("Please enter a URL");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/fetch-job-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch URL");
      setJobText(data.text);
      setMode("paste");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch URL");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobText.trim()) {
      setError("Please enter a job description");
      return;
    }
    setIsLoading(true);
    setError("");
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data.analysis);
      onAnalysisComplete(jobText, data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {initialSource && (
        <p className="rounded-md border border-line bg-ground px-3 py-2 text-[13px] text-ink-2">
          Pre-filled from the job scanner: <span className="text-ink">{initialSource}</span>
        </p>
      )}

      {/* Mode Toggle */}
      <div className="flex overflow-hidden rounded-md border border-line">
        <button type="button" onClick={() => setMode("paste")} className={tabClass(mode === "paste")}>
          Paste job description
        </button>
        <button type="button" onClick={() => setMode("url")} className={tabClass(mode === "url")}>
          Enter job URL
        </button>
      </div>

      {/* URL Input */}
      {mode === "url" && (
        <div className="flex gap-2">
          <input
            type="url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://company.com/jobs/software-engineer"
            className={INPUT}
            onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
          />
          <button
            type="button"
            onClick={handleFetchUrl}
            disabled={isLoading}
            className={`flex-none whitespace-nowrap ${GHOST}`}
          >
            {isLoading ? "Fetching..." : "Fetch"}
          </button>
        </div>
      )}

      {/* Text Area */}
      {(mode === "paste" || jobText) && (
        <div>
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder={
              "Paste the full job description here...\n\nInclude the job title, responsibilities, required skills, and qualifications for best results."
            }
            className={`resize-none ${INPUT}`}
            rows={mode === "url" && jobText ? 8 : 10}
          />
          <p className={`mt-1 ${CAPTION}`}>
            {jobText.length} characters
            {jobText.length < 200 && jobText.length > 0 && ", add more detail for better results"}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p
          role="alert"
          className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-[14px] text-bad"
        >
          {error}
        </p>
      )}

      {/* Analyze Button */}
      {(mode === "paste" || jobText) && (
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isLoading || !jobText.trim()}
          className={PRIMARY}
        >
          {isLoading ? "Analyzing..." : "Analyze job description"}
        </button>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="animate-fade-in space-y-3 rounded-md border border-line bg-ground p-4">
          <h3 className="text-[15px] font-semibold text-good">Job analyzed</h3>

          <dl className="grid grid-cols-2 gap-3 text-[14px]">
            <div>
              <dt className={CAPTION}>Position</dt>
              <dd className="font-medium text-ink">{analysis.jobTitle}</dd>
            </div>
            {analysis.company && (
              <div>
                <dt className={CAPTION}>Company</dt>
                <dd className="text-ink">{analysis.company}</dd>
              </div>
            )}
            <div>
              <dt className={CAPTION}>Level</dt>
              <dd className="text-ink">{analysis.seniorityLevel}</dd>
            </div>
          </dl>

          {analysis.requiredSkills.length > 0 && (
            <div>
              <p className={CAPTION}>Required skills</p>
              {/* No match state exists at this stage (analysis only, no profile yet), so
                  these are plain chips, not marks. */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                {analysis.requiredSkills.map((skill, i) => (
                  <span key={i} className={`${CHIP} border-line bg-ground-2 text-ink-2`}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.preferredSkills.length > 0 && (
            <div>
              <p className={CAPTION}>Preferred skills</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {analysis.preferredSkills.map((skill, i) => (
                  <span key={i} className={`${CHIP} border-line bg-ground-2 text-ink-2`}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.tools.length > 0 && (
            <div>
              <p className={CAPTION}>Tools and technologies</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {analysis.tools.map((tool, i) => (
                  <span key={i} className={`${CHIP} border-line bg-ground-2 text-ink-2`}>
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
