"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The landing-page centerpiece: a real resume document (DOM, not an image) running a
 * canned 8s tailoring loop. Keyword marks settle into the text, two bullets rewrite
 * themselves, and the ATS chip ticks 68 to 94. No network, no API, all copy hardcoded.
 */

const CYCLE_MS = 8000;

/** What the ATS chip reads at a given point in the loop. Mirrors the CSS timeline below. */
function scoreAt(t: number): number {
  if (t < 3040) return 68;
  if (t < 4160) return 68 + Math.round(((t - 3040) / 1120) * 26);
  if (t < 6900) return 94;
  return 68;
}

/* Every timing lives inside the keyframes rather than animation-delay, so the chips, the
   bullet crossfades and the score stay locked to one 8s clock. The keyword row leaves with
   its chips, so the loop never rests on a label with nothing under it. */
const KEYFRAMES = `
@keyframes csRow {
  0%, 4% { opacity: 0; }
  7%, 48% { opacity: 1; }
  54%, 100% { opacity: 0; }
}
@keyframes csChip1 {
  0%, 7% { opacity: 0; transform: translateY(-4px); }
  11%, 38% { opacity: 1; transform: translateY(0); }
  44%, 100% { opacity: 0; transform: translateY(10px); }
}
@keyframes csChip2 {
  0%, 12% { opacity: 0; transform: translateY(-4px); }
  16%, 40% { opacity: 1; transform: translateY(0); }
  46%, 100% { opacity: 0; transform: translateY(10px); }
}
@keyframes csChip3 {
  0%, 17% { opacity: 0; transform: translateY(-4px); }
  21%, 42% { opacity: 1; transform: translateY(0); }
  48%, 100% { opacity: 0; transform: translateY(10px); }
}
@keyframes csOldA {
  0%, 38% { opacity: 1; }
  48%, 86% { opacity: 0; }
  96%, 100% { opacity: 1; }
}
@keyframes csNewA {
  0%, 38% { opacity: 0; }
  48%, 86% { opacity: 1; }
  96%, 100% { opacity: 0; }
}
@keyframes csOldB {
  0%, 42% { opacity: 1; }
  52%, 88% { opacity: 0; }
  98%, 100% { opacity: 1; }
}
@keyframes csNewB {
  0%, 42% { opacity: 0; }
  52%, 88% { opacity: 1; }
  98%, 100% { opacity: 0; }
}
/* The marker stroke behind each keyword, swiping in on the same clock as the chip that
   carries it. The stroke lives on .mark::before, which a utility class cannot reach, so
   the swipe rides along here on the section moments csChip1-3 already use. */
@keyframes csSwipe1 {
  0%, 7% { transform: rotate(-0.4deg) scaleX(0); }
  11%, 100% { transform: rotate(-0.4deg) scaleX(1); }
}
@keyframes csSwipe2 {
  0%, 12% { transform: rotate(-0.4deg) scaleX(0); }
  16%, 100% { transform: rotate(-0.4deg) scaleX(1); }
}
@keyframes csSwipe3 {
  0%, 17% { transform: rotate(-0.4deg) scaleX(0); }
  21%, 100% { transform: rotate(-0.4deg) scaleX(1); }
}
.cs-kw1::before { animation: csSwipe1 8s cubic-bezier(0.2, 0, 0, 1) infinite; }
.cs-kw2::before { animation: csSwipe2 8s cubic-bezier(0.2, 0, 0, 1) infinite; }
.cs-kw3::before { animation: csSwipe3 8s cubic-bezier(0.2, 0, 0, 1) infinite; }
/* The rewritten line arrives highlighted, then the ink dries and the mark lifts. */
@keyframes csSettle {
  0%, 58% { background-color: var(--mark); }
  70%, 100% { background-color: transparent; }
}
@keyframes csScore {
  0%, 82% { opacity: 1; }
  86% { opacity: 0.2; }
  92%, 100% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .cs-kw1::before, .cs-kw2::before, .cs-kw3::before { animation: none; }
}
/* WCAG 2.2.2: the loop stops while it is hovered or holds focus. The score reads its phase
   off the paused animation, so it freezes with everything else. The ::before selectors catch
   the .cs-kw*::before stroke animations, which the bare * combinator does not reach. */
.cs-stage:hover *,
.cs-stage:hover *::before,
.cs-stage:focus-within *,
.cs-stage:focus-within *::before {
  animation-play-state: paused;
}
`;

const KEYWORDS = [
  { label: "weekly reporting", animation: "cs-kw1 animate-[csChip1_8s_ease-out_infinite]" },
  { label: "vendor reviews", animation: "cs-kw2 animate-[csChip2_8s_ease-out_infinite]" },
  { label: "SLA credits", animation: "cs-kw3 animate-[csChip3_8s_ease-out_infinite]" },
];

const HEADING =
  "mb-1.5 border-b border-line pb-1 text-[8.5px] font-semibold uppercase tracking-[0.12em] text-ink sm:text-[9.5px]";
const BODY = "text-[9.5px] leading-[1.6] text-ink-2 sm:text-[10.5px]";
const SETTLE =
  "rounded-sm px-[0.15em] box-decoration-clone animate-[csSettle_8s_ease-out_infinite] motion-reduce:animate-none";

export default function ResumeShowcase() {
  const [score, setScore] = useState(68);
  const chipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setScore(94);
      return;
    }
    const start = performance.now();
    const id = window.setInterval(() => {
      // Read the phase off the chip's own CSS animation, which started at first paint, so the
      // number cannot drift away from the bullets it is supposed to be reacting to.
      const loop = chipRef.current?.getAnimations()[0];
      const phase = loop ? Number(loop.currentTime) : NaN;
      const t = Number.isFinite(phase) ? phase : performance.now() - start;
      setScore(scoreAt(t % CYCLE_MS));
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="cs-stage w-full max-w-[420px]">
      <style>{KEYFRAMES}</style>

      <p className="sr-only">
        Example: a resume being tailored to a job posting, ATS match rising from 68 to 94
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 animate-[csRow_8s_ease-out_infinite] motion-reduce:animate-none">
        <span className="text-[11px] text-ink-3">From the job posting</span>
        {KEYWORDS.map((keyword) => (
          <span
            key={keyword.label}
            className={`mark text-[11px] text-ink ${keyword.animation} motion-reduce:animate-none`}
          >
            {keyword.label}
          </span>
        ))}
      </div>

      <div className="relative">
        {/* The document is decoration: the sr-only caption above describes it, and its own
            headings would otherwise pollute the page outline. */}
        {/* The 2px rule across the top is the sheet's letterhead: the Swiss grid made visible. */}
        <article
          aria-hidden="true"
          className="aspect-[1/1.35] w-full border border-line border-t-2 border-t-line-strong bg-ground p-6 shadow-sheet sm:p-8"
        >
          <header className="border-b border-line pb-2.5">
            <p className="font-display text-lg font-bold leading-tight tracking-[-0.01em] text-ink sm:text-xl">
              Amara Osei
            </p>
            <p className="mt-0.5 text-[10px] text-ink-2 sm:text-[11px]">Operations Analyst</p>
            <div className="mt-1.5 flex justify-between gap-3 text-[9px] text-ink-3 sm:text-[10px]">
              <span>amara.osei@mail.com</span>
              <span>Kuala Lumpur</span>
            </div>
          </header>

          <section className="mt-3.5">
            <p className={HEADING}>Summary</p>
            <p className={BODY}>
              Operations analyst with six years in retail supply chain. Builds the reporting and vendor
              rhythms that keep decisions moving on the floor.
            </p>
          </section>

          <section className="mt-3.5">
            <p className={HEADING}>Experience</p>

            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[9.5px] font-semibold text-ink sm:text-[10.5px]">
                Operations Analyst, Lazuli Retail Group
              </p>
              <p className="shrink-0 text-[9px] text-ink-3 sm:text-[10px]">2021 to now</p>
            </div>

            <ul className={`mt-1.5 space-y-1.5 ${BODY}`}>
              <li className="flex gap-2">
                <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 rounded-full bg-ink-3" />
                <span className="relative block flex-1">
                  <span
                    aria-hidden
                    className="absolute inset-0 opacity-0 animate-[csOldA_8s_ease-out_infinite] motion-reduce:animate-none"
                  >
                    Managed the team&apos;s reporting
                  </span>
                  <span className="block animate-[csNewA_8s_ease-out_infinite] motion-reduce:animate-none">
                    Led <span className={SETTLE}>weekly ATS-tracked reporting</span> for a 6-person team,
                    cutting review time 40%
                  </span>
                </span>
              </li>

              <li className="flex gap-2">
                <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 rounded-full bg-ink-3" />
                <span className="relative block flex-1">
                  <span
                    aria-hidden
                    className="absolute inset-0 opacity-0 animate-[csOldB_8s_ease-out_infinite] motion-reduce:animate-none"
                  >
                    Handled supplier problems as they came up
                  </span>
                  <span className="block animate-[csNewB_8s_ease-out_infinite] motion-reduce:animate-none">
                    Ran quarterly <span className={SETTLE}>vendor reviews</span> across 14 suppliers,
                    recovering RM 180k in <span className={SETTLE}>SLA credits</span>
                  </span>
                </span>
              </li>

              <li className="flex gap-2">
                <span aria-hidden className="mt-[6px] h-[3px] w-[3px] shrink-0 rounded-full bg-ink-3" />
                <span className="flex-1">
                  Built the demand forecast the merchandising team still plans against
                </span>
              </li>
            </ul>

            <div className="mt-2.5 flex items-baseline justify-between gap-3">
              <p className="text-[9.5px] font-semibold text-ink sm:text-[10.5px]">
                Operations Executive, Kirana Mart
              </p>
              <p className="shrink-0 text-[9px] text-ink-3 sm:text-[10px]">2018 to 2021</p>
            </div>
            <p className={`mt-1 ${BODY}`}>
              Rebuilt the weekly stock count into a two-hour routine across nine outlets.
            </p>
          </section>

          <section className="mt-3.5">
            <p className={HEADING}>Skills</p>
            <p className={BODY}>
              Excel, SQL, Power BI, vendor management, demand planning, process documentation
            </p>
          </section>

          <section className="mt-3.5">
            <p className={HEADING}>Education</p>
            <p className={BODY}>BSc Business Analytics, Universiti Malaya</p>
          </section>
        </article>

        {/* Rule 3 of the mark: the score chip is the one chrome element that carries it. */}
        <div
          ref={chipRef}
          className="absolute -right-3 top-6 rounded-sm bg-mark px-3 py-1.5 shadow-sheet animate-[csScore_8s_ease-out_infinite] motion-reduce:animate-none"
        >
          <span className="text-[11px] text-ink">ATS match </span>
          <span className="font-display text-[13px] font-bold tabular-nums text-ink">{score}</span>
        </div>
      </div>
    </div>
  );
}
