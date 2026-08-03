"use client";

import { useState, useRef, useEffect } from "react";
import { loadMasterProfile, saveMasterProfile } from "@/lib/profile";
import { parseResumeFile } from "@/lib/parse-resume-file";

interface ProfileInputProps {
  onProfileReady: (profileText: string) => void;
  onProfilePictureChange?: (picture: string) => void;
}

const PICTURE_STORAGE_KEY = "ai-resume-profile-picture";

const EXAMPLE_PROFILE = `JOHN DOE
john.doe@email.com | (555) 123-4567 | San Francisco, CA
linkedin.com/in/johndoe | github.com/johndoe

WORK EXPERIENCE

Senior Software Engineer | Acme Corp | Jan 2022 - Present | San Francisco, CA
- Led development of microservices architecture serving 2M+ daily active users
- Reduced API latency by 45% through Redis caching and query optimization
- Mentored 4 junior engineers and conducted 50+ code reviews
- Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes

Software Engineer | TechStartup Inc | Jun 2019 - Dec 2021 | New York, NY
- Built React-based dashboard used by 500+ enterprise customers
- Developed RESTful APIs using Node.js and Express handling 100K+ requests/day
- Migrated monolithic app to microservices, improving system reliability to 99.9% uptime
- Collaborated with UX team to improve user satisfaction score from 3.2 to 4.7/5

EDUCATION

Bachelor of Science in Computer Science
University of California, Berkeley | May 2019 | GPA: 3.8

SKILLS
Languages: JavaScript, TypeScript, Python, Java, SQL
Frameworks: React, Next.js, Node.js, Express, FastAPI
Databases: PostgreSQL, MongoDB, Redis, DynamoDB
Cloud: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes
Tools: Git, GitHub Actions, Jenkins, Terraform, Datadog

PROJECTS

E-Commerce Platform (github.com/johndoe/ecommerce)
- Full-stack e-commerce app with React, Node.js, PostgreSQL
- Handles 10K+ products with real-time inventory management
- Payment gateway integration with 99.9% success rate

AI Task Manager
- Built LLM-powered task management tool using OpenAI API
- Natural language task creation and smart deadline suggestions
- React frontend, FastAPI backend, deployed on AWS

CERTIFICATIONS

AWS Certified Solutions Architect - Associate | Amazon Web Services | 2023
Google Cloud Professional Developer | Google | 2022

ACHIEVEMENTS
- Speaker at React Conf 2023: "Building Scalable React Applications"
- Open source contributor with 200+ GitHub stars on personal projects
- Published technical articles reaching 50K+ monthly readers on Medium`;

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
const GHOST = `rounded-md border border-line px-3 py-2 text-[13px] font-semibold text-ink transition-colors duration-200 hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const QUIET = `text-[13px] text-ink-3 underline underline-offset-4 transition-colors duration-200 hover:text-ink ${FOCUS}`;
const INPUT =
  "w-full rounded-md border border-line bg-paper px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface";
const CAPTION = "text-[13px] text-ink-3";
const PANEL = "rounded-md border border-line bg-paper p-4";

function tabClass(isActive: boolean) {
  return `flex-1 py-2.5 px-4 text-[14px] font-medium transition-colors duration-200 ${FOCUS} ${
    isActive ? "bg-ink text-paper" : "bg-surface text-ink-2 hover:text-ink"
  }`;
}

export default function ProfileInput({
  onProfileReady,
  onProfilePictureChange,
}: ProfileInputProps) {
  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const [profileText, setProfileText] = useState("");
  const [savedProfile, setSavedProfile] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [includePhoto, setIncludePhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pictureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMasterProfile()
      .then((saved) => {
        if (typeof saved === "string" && saved) {
          setSavedProfile(saved);
          setProfileText(saved);
          onProfileReady(saved);
        }
      })
      .catch(() => {});
    try {
      const savedPic = localStorage.getItem(PICTURE_STORAGE_KEY);
      if (savedPic) {
        setProfilePicture(savedPic);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notifyPictureChange = (pic: string, include: boolean) => {
    onProfilePictureChange?.(include && pic ? pic : "");
  };

  const handlePictureUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, etc.)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setProfilePicture(base64);
        setIncludePhoto(true);
        notifyPictureChange(base64, true);
        try {
          localStorage.setItem(PICTURE_STORAGE_KEY, base64);
        } catch {}
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = () => {
    setProfilePicture("");
    setIncludePhoto(false);
    notifyPictureChange("", false);
    try {
      localStorage.removeItem(PICTURE_STORAGE_KEY);
    } catch {}
    if (pictureInputRef.current) pictureInputRef.current.value = "";
  };

  const handleToggleInclude = (checked: boolean) => {
    setIncludePhoto(checked);
    notifyPictureChange(profilePicture, checked);
  };

  // Parsing happens here in the browser, so the resume file itself is never
  // uploaded anywhere; only the text below, once the user is happy with it.
  const handleResumeFile = async (file: File) => {
    if (!file) return;
    setIsParsing(true);
    setError("");
    setUploadedFileName(file.name);

    try {
      const text = await parseResumeFile(file);
      setProfileText(text);
      setMode("manual");
      onProfileReady(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleResumeFile(file);
  };

  const handleSaveProfile = async () => {
    try {
      await saveMasterProfile(profileText);
      setSavedProfile(profileText);
      setIsSaved(true);
      onProfileReady(profileText);
      setTimeout(() => setIsSaved(false), 2000);
    } catch {
      setError("Failed to save profile");
    }
  };

  const handleLoadSaved = () => {
    if (savedProfile) {
      setProfileText(savedProfile);
      onProfileReady(savedProfile);
    }
  };

  const handleUseExample = () => {
    setProfileText(EXAMPLE_PROFILE);
    setMode("manual");
    onProfileReady(EXAMPLE_PROFILE);
  };

  return (
    <div className="space-y-4">
      {/* Profile Photo */}
      <div className={PANEL}>
        <p className={CAPTION}>Profile photo (optional)</p>

        <div className="mt-3 flex items-center gap-4">
          {/* Avatar preview */}
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="h-20 w-20 flex-none rounded-full border border-line object-cover"
            />
          ) : (
            <button
              type="button"
              onClick={() => pictureInputRef.current?.click()}
              className={`flex h-20 w-20 flex-none items-center justify-center rounded-full border border-dashed border-line text-[12px] text-ink-3 transition-colors duration-200 hover:border-ink ${FOCUS}`}
            >
              Add photo
            </button>
          )}

          {/* Controls */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => pictureInputRef.current?.click()}
                className={GHOST}
              >
                {profilePicture ? "Change photo" : "Upload photo"}
              </button>
              {profilePicture && (
                <button
                  type="button"
                  onClick={handleRemovePicture}
                  className={`rounded-md border border-line px-3 py-2 text-[13px] font-semibold text-score-missing transition-colors duration-200 hover:border-score-missing ${FOCUS}`}
                >
                  Remove
                </button>
              )}
            </div>
            <p className={CAPTION}>
              JPG, PNG, or WEBP. Appears as a circle in your resume header.
            </p>

            {profilePicture && (
              <button
                type="button"
                role="switch"
                aria-checked={includePhoto}
                onClick={() => handleToggleInclude(!includePhoto)}
                className={`flex items-center gap-2 text-left ${FOCUS}`}
              >
                <span
                  className={`relative h-5 w-10 flex-none rounded-full transition-colors duration-200 ${
                    includePhoto ? "bg-accent" : "bg-ink-3"
                  }`}
                >
                  <span
                    className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-surface transition-transform duration-200"
                    style={{ transform: includePhoto ? "translateX(20px)" : "translateX(0)" }}
                  />
                </span>
                <span className="text-[13px] text-ink-2">
                  {includePhoto ? "Photo included in resume" : "Photo not included"}
                </span>
              </button>
            )}
          </div>
        </div>

        <input
          ref={pictureInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePictureUpload(file);
          }}
        />
      </div>

      {/* Mode Toggle */}
      <div className="flex overflow-hidden rounded-md border border-line">
        <button type="button" onClick={() => setMode("upload")} className={tabClass(mode === "upload")}>
          Upload resume
        </button>
        <button type="button" onClick={() => setMode("manual")} className={tabClass(mode === "manual")}>
          Master profile
        </button>
      </div>

      {/* Upload Mode */}
      {mode === "upload" && (
        <div>
          <div
            className="cursor-pointer rounded-md border border-dashed border-line p-8 text-center transition-colors duration-200 hover:border-ink"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            {isParsing ? (
              <p className={CAPTION}>Parsing {uploadedFileName}...</p>
            ) : (
              <>
                <p className="text-[15px] font-medium text-ink">Drop your resume here</p>
                <p className={`mt-1 ${CAPTION}`}>or click to browse</p>
                <p className={`mt-3 ${CAPTION}`}>PDF, DOCX, or TXT supported</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleResumeFile(file);
              }}
            />
          </div>

          {savedProfile && (
            <button onClick={handleLoadSaved} className={`mt-3 w-full ${GHOST}`}>
              Load saved master profile
            </button>
          )}

          <button onClick={handleUseExample} className={`mt-2 w-full ${GHOST}`}>
            Try with an example profile
          </button>
        </div>
      )}

      {/* Manual Mode */}
      {mode === "manual" && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <p className={CAPTION}>
              Paste or type your complete profile. The AI reads all of this to create your resume.
            </p>
            <div className="flex flex-none gap-3">
              {savedProfile && (
                <button onClick={handleLoadSaved} className={QUIET}>
                  Load saved
                </button>
              )}
              <button onClick={handleUseExample} className={QUIET}>
                Use example
              </button>
            </div>
          </div>

          <textarea
            value={profileText}
            onChange={(e) => {
              setProfileText(e.target.value);
              if (e.target.value.trim()) onProfileReady(e.target.value);
            }}
            placeholder={`Paste your full resume text or detailed profile here...

Include:
Personal details (name, email, phone, location, LinkedIn, GitHub)
Work experience with company names, titles, dates, and bullet points
Education details
Skills list
Projects with descriptions and technologies
Certifications and achievements`}
            className={`resize-none font-mono ${INPUT}`}
            rows={14}
          />

          <div className="flex items-center justify-between gap-4">
            <p className={CAPTION}>
              {profileText.length} characters
              {profileText.length > 0 && profileText.length < 200 && ", add more detail"}
            </p>
            <button
              onClick={handleSaveProfile}
              disabled={!profileText.trim()}
              className={`flex-none whitespace-nowrap ${GHOST}`}
            >
              {isSaved ? "Saved" : "Save as master profile"}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p
          role="alert"
          className="rounded-md border border-score-missing/30 bg-score-missing/5 px-3 py-2 text-[14px] text-score-missing"
        >
          {error}
        </p>
      )}

      {/* Profile Status */}
      {profileText.trim().length > 200 && mode === "manual" && (
        <p className="text-[14px] text-accent">
          Profile ready ({profileText.split("\n").length} lines)
          {savedProfile === profileText && ", saved as your master profile"}
        </p>
      )}

      {/* Tips */}
      <div className={PANEL}>
        <p className="text-[14px] font-semibold text-ink">Tips</p>
        <ul className="mt-2 space-y-1 text-[13px] leading-[20px] text-ink-2">
          <li>Include specific metrics (for example, &quot;reduced load time by 40%&quot;).</li>
          <li>List all the tools and technologies you have used.</li>
          <li>Save your profile to reuse it for future applications.</li>
          <li>The more detail you give, the better the AI can tailor your resume.</li>
        </ul>
      </div>
    </div>
  );
}
