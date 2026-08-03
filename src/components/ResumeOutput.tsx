"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { GeneratedResume, TemplateName } from "@/types";
import MatchScore from "./MatchScore";
import { renderResumeHTML } from "@/lib/templates";

interface ResumeOutputProps {
  result: GeneratedResume;
  template: TemplateName;
  jobText: string;
  jobAnalysis?: object | null;
  onChangeTemplate: (t: TemplateName) => void;
  onBulletUpdate: (original: string, replacement: string) => void;
}

const TEMPLATE_OPTIONS: Array<{ id: TemplateName; label: string }> = [
  { id: "experienced", label: "Classic" },
  { id: "entry-level", label: "Entry Level" },
  { id: "modern", label: "Modern" },
  { id: "executive", label: "Executive" },
  { id: "creative", label: "Creative" },
  { id: "minimal", label: "Minimal" },
  { id: "tech", label: "Tech" },
  { id: "compact", label: "Compact" },
  { id: "professional", label: "Professional" },
  { id: "elegant", label: "Elegant" },
];

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
const PRIMARY = `rounded-md bg-ink px-4 py-2 text-[14px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const GHOST = `rounded-md border border-line px-4 py-2 text-[14px] font-semibold text-ink transition-colors duration-200 hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const CAPTION = "text-[13px] text-ink-3";
const FRAME_HEADER = "flex items-center justify-between border-b border-line bg-paper px-4 py-2";

type ActiveTab = "resume" | "cover-letter";

function tabClass(isActive: boolean) {
  return `-mb-px border-b-2 px-5 py-2.5 text-[14px] font-semibold transition-colors duration-200 ${FOCUS} ${
    isActive ? "border-ink text-ink" : "border-transparent text-ink-2 hover:text-ink"
  }`;
}

export default function ResumeOutput({
  result,
  template,
  jobText,
  jobAnalysis,
  onChangeTemplate,
  onBulletUpdate,
}: ResumeOutputProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const resumeHTML = renderResumeHTML(result.resume, template);
  const [activeTab, setActiveTab] = useState<ActiveTab>("resume");
  const [coverLetter, setCoverLetter] = useState("");
  const [clLoading, setClLoading] = useState(false);
  const [clGenerated, setClGenerated] = useState(false);

  const jobTitle = (jobAnalysis as { jobTitle?: string } | null)?.jobTitle ?? "the role";
  const companyName = (jobAnalysis as { company?: string } | null)?.company ?? "";
  const candidateName = result.resume.personalInfo.name;

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    } else {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(resumeHTML);
        win.document.close();
        win.print();
      }
    }
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([resumeHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidateName.replace(/\s+/g, "_")}_Resume.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyResume = () => {
    navigator.clipboard.writeText(resumeHTML).catch(() => {});
  };

  const handleGenerateCoverLetter = useCallback(async () => {
    setClLoading(true);
    setCoverLetter("");
    setActiveTab("cover-letter");
    try {
      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobText,
          jobAnalysis,
          resumeContent: result.resume,
          candidateName,
          companyName,
          jobTitle,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "NO_KEY") {
          router.push("/onboarding");
          return;
        }
        throw new Error(data.error || "Generation failed");
      }
      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setCoverLetter(text);
      }
      setClGenerated(true);
    } catch {
      setCoverLetter("Failed to generate cover letter. Please try again.");
    } finally {
      setClLoading(false);
    }
  }, [router, jobText, jobAnalysis, result.resume, candidateName, companyName, jobTitle]);

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetter).catch(() => {});
  };

  const handlePrintCoverLetter = () => {
    const html = `<!DOCTYPE html><html><head><style>body{font-family:Georgia,serif;max-width:700px;margin:60px auto;font-size:11pt;line-height:1.7;color:#1a1a1a;}p{margin:0 0 1.2em;}@media print{body{margin:40px;}}</style></head><body>${coverLetter
      .split("\n\n")
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("")}</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-[28px] leading-tight tracking-[-0.01em]">
            Your tailored resume
          </h2>
          <p className={`mt-1 ${CAPTION}`}>Written for {candidateName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label htmlFor="template-switch" className="sr-only">
            Template
          </label>
          <select
            id="template-switch"
            value={template}
            onChange={(e) => onChangeTemplate(e.target.value as TemplateName)}
            className={`cursor-pointer rounded-md border border-line bg-paper px-3 py-2 text-[14px] text-ink transition-colors duration-200 hover:border-ink ${FOCUS}`}
          >
            {TEMPLATE_OPTIONS.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>

          <button type="button" onClick={handleDownloadHTML} className={GHOST}>
            Download HTML
          </button>
          <button type="button" onClick={handlePrint} className={PRIMARY}>
            Print or save PDF
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-line">
        <button
          type="button"
          onClick={() => setActiveTab("resume")}
          className={tabClass(activeTab === "resume")}
        >
          Resume
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("cover-letter");
            if (!clGenerated && !clLoading) handleGenerateCoverLetter();
          }}
          className={tabClass(activeTab === "cover-letter")}
        >
          Cover letter
        </button>
      </div>

      {/* Resume Tab */}
      {activeTab === "resume" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Resume Preview - 2/3 */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-md border border-line">
              <div className={FRAME_HEADER}>
                <span className={CAPTION}>Resume preview</span>
              </div>
              <iframe
                ref={iframeRef}
                srcDoc={resumeHTML}
                className="w-full"
                style={{ height: "800px", border: "none" }}
                title="Resume Preview"
              />
            </div>
            <p className={`mt-3 ${CAPTION}`}>
              To save as PDF, click &quot;Print or save PDF&quot; above, then choose &quot;Save as
              PDF&quot; in your browser&apos;s print dialog. Set margins to None for best results.
            </p>
          </div>

          {/* Sidebar - 1/3 */}
          <div className="space-y-4">
            <MatchScore
              score={result.matchScore}
              matchedSkills={result.matchedSkills}
              missingSkills={result.missingSkills}
              suggestions={result.suggestions}
              weakBullets={result.weakBullets ?? []}
              onAcceptBullet={onBulletUpdate}
            />
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: (result.resume.workExperience ?? []).length, label: "Roles" },
                { value: (result.resume.skills ?? []).length, label: "Skills" },
                { value: (result.resume.projects ?? []).length, label: "Projects" },
                { value: (result.resume.certifications ?? []).length, label: "Certs" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-md border border-line bg-paper p-3 text-center"
                >
                  <div className="font-serif text-[26px] leading-none text-ink">{value}</div>
                  <div className={`mt-1 ${CAPTION}`}>{label}</div>
                </div>
              ))}
            </div>
            <button type="button" onClick={handleCopyResume} className={`w-full ${GHOST}`}>
              Copy HTML source
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("cover-letter");
                if (!clGenerated && !clLoading) handleGenerateCoverLetter();
              }}
              className={`w-full ${PRIMARY}`}
            >
              Generate cover letter
            </button>
          </div>
        </div>
      )}

      {/* Cover Letter Tab */}
      {activeTab === "cover-letter" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Letter content - 2/3 */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-md border border-line">
              <div className={FRAME_HEADER}>
                <span className={CAPTION}>Cover letter</span>
                {clLoading && <span className="text-[13px] text-accent">Writing...</span>}
              </div>

              {/* Letter body, kept on white so it reads as the printed document */}
              <div className="min-h-[500px] bg-surface p-8">
                {/* Header block */}
                <div className="mb-8 border-b border-line pb-6">
                  <div className="text-[17px] font-semibold text-ink">{candidateName}</div>
                  <div className={`mt-1 ${CAPTION}`}>
                    {result.resume.personalInfo.email}
                    {result.resume.personalInfo.phone &&
                      ` · ${result.resume.personalInfo.phone}`}
                    {result.resume.personalInfo.location &&
                      ` · ${result.resume.personalInfo.location}`}
                  </div>
                </div>

                {/* Hiring manager block */}
                <div className="mb-6 text-[14px] text-ink-2">
                  <div className="font-semibold text-ink">Hiring Manager</div>
                  {companyName && <div>{companyName}</div>}
                  <div className={`mt-2 ${CAPTION}`}>Re: {jobTitle} position</div>
                </div>

                {/* Letter text */}
                <div className="whitespace-pre-wrap font-serif text-[15px] leading-[26px] text-ink">
                  {coverLetter ||
                    (clLoading ? (
                      <div className="space-y-3">
                        {[80, 95, 70, 85, 60].map((w, i) => (
                          <div
                            key={i}
                            className="h-4 animate-pulse rounded bg-line"
                            style={{ width: `${w}%` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className={CAPTION}>Your cover letter will appear here.</span>
                    ))}
                </div>

                {clGenerated && (
                  <div className="mt-8 text-[14px] text-ink-2">
                    <div>Sincerely,</div>
                    <div className="mt-4 font-semibold text-ink">{candidateName}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 */}
          <div className="space-y-4">
            <div className="rounded-md border border-line bg-paper p-4">
              <p className="text-[15px] font-semibold text-ink">Actions</p>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleGenerateCoverLetter}
                  disabled={clLoading}
                  className={`w-full ${PRIMARY}`}
                >
                  {clLoading ? "Writing..." : clGenerated ? "Regenerate" : "Generate"}
                </button>
                {clGenerated && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyCoverLetter}
                      className={`w-full ${GHOST}`}
                    >
                      Copy to clipboard
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintCoverLetter}
                      className={`w-full ${GHOST}`}
                    >
                      Print or save PDF
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-md border border-line bg-paper p-4">
              <p className="text-[15px] font-semibold text-ink">Tips</p>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-[20px] text-ink-2">
                <li>Personalise the opening with the hiring manager&apos;s name if you know it.</li>
                <li>Add the correct date before sending.</li>
                <li>Tweak any numbers or details specific to your experience.</li>
                <li>Keep it to one page when printed.</li>
              </ul>
            </div>

            <div className="rounded-md border border-line bg-paper p-4 text-center">
              <div className={CAPTION}>Applying for</div>
              <div className="mt-1 text-[15px] font-semibold text-ink">{jobTitle}</div>
              {companyName && <div className={`mt-0.5 ${CAPTION}`}>at {companyName}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
