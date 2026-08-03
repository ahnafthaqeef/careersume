"use client";

import type { TemplateName } from "@/types";

interface TemplateSelectorProps {
  selected: TemplateName;
  onSelect: (template: TemplateName) => void;
}

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

// Each preview is a miniature of the printed document, so it keeps that
// template's own colours rather than the app palette.
const templates: Array<{
  id: TemplateName;
  name: string;
  description: string;
  tags: string[];
  preview: React.ReactNode;
}> = [
  {
    id: "experienced",
    name: "Experienced",
    description: "Traditional serif layout. Maximum ATS compatibility. Work experience highlighted first.",
    tags: ["ATS-friendly", "Traditional", "Senior"],
    preview: (
      <div
        className="p-3 rounded text-left scale-90 origin-top"
        style={{ background: "#fff" }}
      >
        <div className="text-center mb-2">
          <div className="h-2.5 rounded w-32 mx-auto mb-1" style={{ background: "#1a1a2e" }} />
          <div className="h-1.5 rounded w-44 mx-auto" style={{ background: "#6b7280" }} />
        </div>
        <div className="mb-1.5" style={{ borderBottom: "1px solid #1a1a2e" }}>
          <div className="h-2 rounded w-28 mb-0.5" style={{ background: "#374151" }} />
        </div>
        <div className="space-y-0.5 mb-2">
          {[60, 80, 70, 75].map((w, i) => (
            <div key={i} className="h-1.5 rounded" style={{ width: `${w}%`, background: "#d1d5db" }} />
          ))}
        </div>
        <div className="mb-1.5" style={{ borderBottom: "1px solid #1a1a2e" }}>
          <div className="h-2 rounded w-20 mb-0.5" style={{ background: "#374151" }} />
        </div>
        <div className="flex flex-wrap gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-1.5 rounded px-1"
              style={{ width: `${20 + i * 8}px`, background: "#e5e7eb", border: "1px solid #d1d5db" }}
            />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "entry-level",
    name: "Entry level",
    description: "Education appears first, ideal for new graduates and early-career candidates.",
    tags: ["Education first", "Graduate", "Entry level"],
    preview: (
      <div
        className="p-3 rounded text-left scale-90 origin-top"
        style={{ background: "#fff" }}
      >
        <div className="text-center mb-2">
          <div className="h-2.5 rounded w-32 mx-auto mb-1" style={{ background: "#1a1a2e" }} />
          <div className="h-1.5 rounded w-44 mx-auto" style={{ background: "#6b7280" }} />
        </div>
        <div className="mb-1.5" style={{ borderBottom: "1px solid #1a1a2e" }}>
          <div className="h-2 rounded w-24 mb-0.5" style={{ background: "#374151" }} />
        </div>
        <div className="space-y-0.5 mb-2">
          {[55, 70].map((w, i) => (
            <div key={i} className="h-1.5 rounded" style={{ width: `${w}%`, background: "#d1d5db" }} />
          ))}
        </div>
        <div className="mb-1.5" style={{ borderBottom: "1px solid #1a1a2e" }}>
          <div className="h-2 rounded w-28 mb-0.5" style={{ background: "#374151" }} />
        </div>
        <div className="space-y-0.5">
          {[65, 80, 72].map((w, i) => (
            <div key={i} className="h-1.5 rounded" style={{ width: `${w}%`, background: "#e5e7eb" }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "modern",
    name: "Modern",
    description: "Two-column layout with a dark sidebar. Great for tech, design, and creative roles.",
    tags: ["Modern", "Two column", "Tech and creative"],
    preview: (
      <div
        className="rounded overflow-hidden text-left scale-90 origin-top flex"
        style={{ height: "128px", border: "1px solid #e5e7eb" }}
      >
        <div className="w-1/3 flex-shrink-0 p-2" style={{ background: "#1e2d40" }}>
          <div className="w-8 h-8 rounded-full mx-auto mb-1.5" style={{ background: "#6b7280" }} />
          <div className="h-2 rounded w-full mx-auto mb-2" style={{ background: "#ffffff30" }} />
          <div className="space-y-1">
            {[80, 90, 70].map((w, i) => (
              <div key={i} className="h-1 rounded" style={{ width: `${w}%`, background: "rgba(77,184,200,0.4)" }} />
            ))}
          </div>
        </div>
        <div className="flex-1 p-2 bg-white">
          <div className="border-l-2 pl-1.5 mb-2" style={{ borderColor: "#4db8c8" }}>
            <div className="h-1.5 rounded w-full mb-1" style={{ background: "#d1d5db" }} />
            <div className="h-1.5 rounded w-4/5" style={{ background: "#e5e7eb" }} />
          </div>
          <div className="border-b-2 mb-1" style={{ borderColor: "#4db8c8" }}>
            <div className="h-1.5 rounded w-20 mb-0.5" style={{ background: "#374151" }} />
          </div>
          <div className="space-y-0.5">
            {[85, 70, 75].map((w, i) => (
              <div key={i} className="h-1 rounded" style={{ width: `${w}%`, background: "#e5e7eb" }} />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "executive" as TemplateName,
    name: "Executive",
    description: "Formal serif layout with double rules and a centred header. Ideal for C-suite and director roles.",
    tags: ["Formal", "C-suite", "ATS-friendly"],
    preview: (
      <div className="p-3 rounded text-left bg-white scale-90 origin-top">
        <div className="text-center mb-2">
          <div className="h-3 rounded w-28 mx-auto mb-1" style={{ background: "#1a1a1a" }} />
          <div className="h-1.5 rounded w-36 mx-auto" style={{ background: "#888" }} />
        </div>
        <div className="border-t-2 border-b border-gray-800 py-1 mb-2" />
        <div className="text-center mb-1">
          <div className="h-1.5 rounded w-20 mx-auto" style={{ background: "#374151" }} />
        </div>
        <div className="space-y-0.5">
          {[70, 85, 60, 78].map((w, i) => (
            <div key={i} className="h-1 rounded" style={{ width: `${w}%`, background: "#d1d5db" }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "creative" as TemplateName,
    name: "Creative",
    description: "Bold purple sidebar with clean main content. Perfect for designers and marketing roles.",
    tags: ["Creative", "Sidebar", "Design and marketing"],
    preview: (
      <div className="rounded overflow-hidden text-left flex scale-90 origin-top" style={{ height: "128px" }}>
        <div className="w-1/3 flex-shrink-0 p-2" style={{ background: "#5b21b6" }}>
          <div className="w-8 h-8 rounded-full mx-auto mb-1.5" style={{ background: "rgba(255,255,255,0.25)" }} />
          <div className="h-2 rounded w-full mb-2" style={{ background: "rgba(255,255,255,0.4)" }} />
          <div className="space-y-1">
            {[75, 85, 65].map((w, i) => (
              <div key={i} className="h-1 rounded" style={{ width: `${w}%`, background: "rgba(196,181,253,0.6)" }} />
            ))}
          </div>
        </div>
        <div className="flex-1 p-2 bg-white">
          <div className="border-b-2 mb-1 pb-0.5" style={{ borderColor: "#5b21b6" }}>
            <div className="h-1.5 rounded w-20 mb-0.5" style={{ background: "#374151" }} />
          </div>
          <div className="space-y-1">
            {[80, 65, 72, 68].map((w, i) => (
              <div key={i} className="h-1 rounded" style={{ width: `${w}%`, background: "#e5e7eb" }} />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "minimal" as TemplateName,
    name: "Minimal",
    description: "Ultra-clean with generous whitespace. Preferred by consultants and product managers.",
    tags: ["Minimal", "Clean", "Consulting and PM"],
    preview: (
      <div className="p-3 rounded bg-white scale-90 origin-top">
        <div className="h-3 rounded w-28 mb-1" style={{ background: "#111827" }} />
        <div className="h-1.5 rounded w-40 mb-3" style={{ background: "#9ca3af" }} />
        <div className="border-t mb-2" style={{ borderColor: "#e5e7eb" }} />
        <div className="h-1.5 rounded w-14 mb-1.5" style={{ background: "#9ca3af" }} />
        <div className="space-y-1">
          {[75, 88, 65, 80].map((w, i) => (
            <div key={i} className="h-1 rounded" style={{ width: `${w}%`, background: "#d1d5db" }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "tech" as TemplateName,
    name: "Tech",
    description: "Dark header with monospace styling. Made for engineers and developers.",
    tags: ["Tech", "Developer", "Engineering"],
    preview: (
      <div className="rounded overflow-hidden scale-90 origin-top" style={{ background: "#fff" }}>
        <div className="p-2" style={{ background: "#0f172a" }}>
          <div className="h-2.5 rounded w-24 mb-1" style={{ background: "#f8fafc" }} />
          <div className="h-1.5 rounded w-36" style={{ background: "#475569" }} />
        </div>
        <div className="p-2">
          <div className="border-b mb-1.5 pb-0.5" style={{ borderColor: "#0f172a" }}>
            <div className="h-1.5 rounded w-20" style={{ background: "#1e293b" }} />
          </div>
          <div className="space-y-0.5 mb-2">
            {[72, 85, 65].map((w, i) => (
              <div key={i} className="h-1 rounded" style={{ width: `${w}%`, background: "#e2e8f0" }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-1.5 rounded" style={{ width: `${18 + i * 6}px`, background: "#f0f9ff", border: "1px solid #bae6fd" }} />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "compact" as TemplateName,
    name: "Compact",
    description: "Dense information layout with two-column skills. Great for academic and highly experienced profiles.",
    tags: ["Dense", "Academic", "Experienced"],
    preview: (
      <div className="p-2 rounded bg-white scale-90 origin-top">
        <div className="h-2.5 rounded w-24 mb-0.5" style={{ background: "#1a1a1a" }} />
        <div className="h-1.5 rounded w-36 mb-1" style={{ background: "#888" }} />
        <div className="border-t border-gray-800 mb-1" />
        <div className="space-y-0.5 mb-1">
          {[65, 78, 55, 70, 60].map((w, i) => (
            <div key={i} className="h-1 rounded" style={{ width: `${w}%`, background: "#d1d5db" }} />
          ))}
        </div>
        <div className="border-t border-gray-800 mb-1" />
        <div className="grid grid-cols-2 gap-0.5">
          {[60, 70, 55, 65, 50, 62].map((w, i) => (
            <div key={i} className="h-1 rounded" style={{ width: `${w}%`, background: "#e5e7eb" }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "professional" as TemplateName,
    name: "Professional",
    description: "Navy banner header with a clean body. Suited for finance, law, and corporate roles.",
    tags: ["Corporate", "Finance and law", "Conservative"],
    preview: (
      <div className="rounded overflow-hidden scale-90 origin-top">
        <div className="p-2" style={{ background: "#1e3a5f" }}>
          <div className="h-2.5 rounded w-24 mb-1" style={{ background: "#fff" }} />
          <div className="h-1.5 rounded w-36" style={{ background: "#93c5fd" }} />
        </div>
        <div className="p-2 bg-white">
          <div className="border-l-4 pl-1.5 mb-1.5" style={{ borderColor: "#1e3a5f" }}>
            <div className="h-1.5 rounded w-16" style={{ background: "#1e3a5f" }} />
          </div>
          <div className="space-y-0.5 mb-1.5">
            {[75, 88, 70, 80].map((w, i) => (
              <div key={i} className="h-1 rounded" style={{ width: `${w}%`, background: "#d1d5db" }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-0.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-1.5 rounded" style={{ width: `${20 + i * 7}px`, background: "#eff6ff", border: "1px solid #bfdbfe" }} />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "elegant" as TemplateName,
    name: "Elegant",
    description: "Centred header with gold rules and italic section titles. Perfect for hospitality and luxury roles.",
    tags: ["Elegant", "Luxury", "Hospitality and events"],
    preview: (
      <div className="p-3 rounded bg-white scale-90 origin-top text-center">
        <div className="h-3 rounded w-24 mx-auto mb-1" style={{ background: "#2c2c2c" }} />
        <div className="h-1.5 rounded w-32 mx-auto mb-1.5" style={{ background: "#888" }} />
        <div className="border-t max-w-[120px] mx-auto mb-2" style={{ borderColor: "#c9a84c" }} />
        <div className="h-1.5 rounded w-20 mx-auto mb-1.5" style={{ background: "#c9a84c" }} />
        <div className="space-y-0.5">
          {[70, 82, 65, 75].map((w, i) => (
            <div key={i} className="h-1 rounded mx-auto" style={{ width: `${w}%`, background: "#d1d5db" }} />
          ))}
        </div>
      </div>
    ),
  },
];

export default function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {templates.map((template) => {
        const isSelected = selected === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            aria-pressed={isSelected}
            className={`rounded-md border bg-paper p-4 text-left transition-colors duration-200 ${FOCUS} ${
              isSelected ? "border-ink" : "border-line hover:border-ink"
            }`}
          >
            <div className="mb-3 h-32 overflow-hidden">{template.preview}</div>

            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-ink">{template.name}</span>
              {isSelected && (
                <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[11px] text-accent">
                  Selected
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] leading-[20px] text-ink-2">{template.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-ink-3"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
