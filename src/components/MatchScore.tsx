"use client";

import { useState } from "react";
import type { WeakBullet } from "@/types";

interface MatchScoreProps {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  weakBullets: WeakBullet[];
  onAcceptBullet: (original: string, replacement: string) => void;
}

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ground-2";
const PANEL = "rounded-md border border-line bg-ground p-4";
const HEADING = "text-[15px] font-semibold text-ink";

// Class strings are written out in full so Tailwind can see them. The tone colours are
// data truth, which is why they survive the rebrand: the mark is identity and never
// stands in for good, partial or missing.
const TONES = {
  good: { text: "text-good", label: "Strong match" },
  partial: { text: "text-warn", label: "Good match" },
  missing: { text: "text-bad", label: "Needs work" },
};

function toneFor(score: number) {
  if (score >= 80) return TONES.good;
  if (score >= 60) return TONES.partial;
  return TONES.missing;
}

/** The number is the point, so it is set as big as the panel allows and carries the mark.
 *  The verdict beside it keeps its semantic colour. */
function ScoreFigure({ score }: { score: number }) {
  const tone = toneFor(score);

  return (
    <div className="flex flex-col items-start">
      <span className="mark font-display text-[56px] font-bold leading-none tabular-nums text-ink">
        {score}%
      </span>
      <span className={`mt-3 text-[13px] ${tone.text}`}>{tone.label}</span>
    </div>
  );
}

export default function MatchScore({
  score,
  matchedSkills,
  missingSkills,
  suggestions,
  weakBullets,
  onAcceptBullet,
}: MatchScoreProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [applied, setApplied] = useState<Set<number>>(new Set());

  const handleAccept = (i: number, original: string) => {
    const text = editing[i] ?? weakBullets[i].suggested;
    onAcceptBullet(original, text);
    setApplied((prev) => new Set(prev).add(i));
  };

  const visibleBullets = weakBullets.filter((_, i) => !dismissed.has(i) && !applied.has(i));

  return (
    <div className="space-y-5">
      {/* Score */}
      <div className={`flex items-center gap-5 ${PANEL}`}>
        <ScoreFigure score={score} />
        <div className="flex-1">
          <h3 className={HEADING}>ATS match score</h3>
          <p className="mt-1 text-[13px] leading-[20px] text-ink-3">
            How well your resume matches the job requirements.
          </p>
          <div className="mt-3 space-y-1 text-[13px]">
            <p className="text-good">{matchedSkills.length} skills matched</p>
            <p className="text-bad">{missingSkills.length} skills missing</p>
          </div>
        </div>
      </div>

      {/* Matched Skills */}
      {matchedSkills.length > 0 && (
        <div>
          <h4 className={HEADING}>Matched skills</h4>
          {/* What the resume already earns: the product's own highlighter, on the words. */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {matchedSkills.map((skill, i) => (
              <span key={i} className="mark text-[12px] text-ink">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <div>
          <h4 className={HEADING}>Skills to develop</h4>
          {/* What is missing gets the semantic colour and nothing else: no fill, no chip. */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {missingSkills.map((skill, i) => (
              <span key={i} className="text-[12px] text-bad">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h4 className={HEADING}>Suggestions</h4>
          <ol className="mt-2 space-y-2">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="flex gap-3 rounded-md border border-line bg-ground p-3">
                <span className="font-display text-[15px] font-bold leading-none tabular-nums text-ink-3">
                  {i + 1}
                </span>
                <span className="text-[13px] leading-[20px] text-ink-2">{suggestion}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Weak Bullets */}
      {weakBullets?.length > 0 && (
        <div>
          <h4 className={HEADING}>Strengthen these bullets</h4>
          <p className="mt-1 text-[13px] text-ink-3">
            Numbers marked with ~ are estimates. Edit them before applying.
          </p>
          {visibleBullets.length === 0 ? (
            <p className="mt-2 text-[13px] text-good">All bullets reviewed.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {weakBullets.map((item, i) => {
                if (dismissed.has(i) || applied.has(i)) return null;
                const isEditing = i in editing;
                return (
                  <div key={i} className="overflow-hidden rounded-md border border-line">
                    {/* Original */}
                    <div className="border-b border-line bg-ground-2 p-3">
                      <p className="text-[11px] text-ink-3">Current</p>
                      <p className="mt-1 text-[13px] leading-[20px] text-ink-2">{item.original}</p>
                    </div>
                    {/* Suggestion */}
                    <div className="bg-ground p-3">
                      <p className="text-[11px] text-ink-3">Suggested</p>
                      {isEditing ? (
                        <textarea
                          className="mt-1 w-full resize-none rounded-md border border-line bg-ground-2 p-2 text-[13px] leading-[20px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-ground"
                          rows={3}
                          value={editing[i]}
                          onChange={(e) =>
                            setEditing((prev) => ({ ...prev, [i]: e.target.value }))
                          }
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditing((prev) => ({ ...prev, [i]: item.suggested }))}
                          className={`mt-1 block w-full text-left ${FOCUS}`}
                        >
                          <span className="text-[13px] leading-[20px] text-ink">
                            {item.suggested}
                          </span>
                          <span className="mt-1 block text-[11px] text-ink-3">Click to edit</span>
                        </button>
                      )}

                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDismissed((prev) => new Set(prev).add(i))}
                          className={`rounded-md border border-line px-3 py-1.5 text-[13px] font-medium text-ink-2 transition-colors duration-200 hover:border-ink ${FOCUS}`}
                        >
                          Keep original
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAccept(i, item.original)}
                          className={`rounded-md bg-ink px-3 py-1.5 text-[13px] font-semibold text-ground transition-colors duration-200 hover:bg-ink-2 ${FOCUS}`}
                        >
                          Apply to resume
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
