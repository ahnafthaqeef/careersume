import Link from "next/link";

const GITHUB = "https://github.com/ahnafthaqeef/careersume";

const ANCHORS = [
  { href: "#how", label: "How it works" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#faq", label: "FAQ" },
];

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ground";
const LINK = `nav-link text-[15px] text-ink-2 transition-colors duration-200 hover:text-ink ${FOCUS}`;
const PRIMARY = `rounded-md bg-ink px-4 py-2 text-[15px] font-semibold text-ground transition-colors duration-200 hover:bg-ink-2 ${FOCUS}`;
const GHOST = `rounded-md border border-line px-4 py-2 text-[15px] font-semibold text-ink transition-colors duration-200 hover:border-ink ${FOCUS}`;

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground">
      <div className="mx-auto flex max-w-content items-center justify-between gap-6 px-6 py-3.5">
        {/* The wordmark: the product name with the highlighter already through it. Static
            here, since the mark never animates on chrome the reader passes every scroll. */}
        <Link
          href="/"
          className={`font-display text-xl font-bold leading-none tracking-[-0.02em] text-ink ${FOCUS}`}
        >
          Career<span className="mark">sume</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {ANCHORS.map((anchor) => (
            <a key={anchor.href} href={anchor.href} className={LINK}>
              {anchor.label}
            </a>
          ))}
          <a href={GITHUB} target="_blank" rel="noreferrer" className={LINK}>
            GitHub
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/login" className={GHOST}>
            Sign in
          </Link>
          <Link href="/auth/register" className={PRIMARY}>
            Start free
          </Link>
        </div>

        {/* Mobile: a details panel keeps the nav free of client-side JS. */}
        <details className="relative md:hidden">
          <summary
            className={`cursor-pointer select-none list-none rounded-md border border-line px-3 py-1.5 text-[15px] text-ink [&::-webkit-details-marker]:hidden ${FOCUS}`}
          >
            Menu
          </summary>
          <div className="absolute right-0 top-[calc(100%+12px)] w-60 rounded-md border border-line bg-ground p-2 shadow-sheet">
            {ANCHORS.map((anchor) => (
              <a key={anchor.href} href={anchor.href} className="block rounded px-3 py-2 text-[15px] text-ink-2">
                {anchor.label}
              </a>
            ))}
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="block rounded px-3 py-2 text-[15px] text-ink-2"
            >
              GitHub
            </a>
            <div className="my-2 border-t border-line" />
            <Link href="/auth/login" className="block rounded px-3 py-2 text-[15px] text-ink">
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="mt-1 block rounded-md bg-ink px-3 py-2 text-center text-[15px] font-semibold text-ground"
            >
              Start free
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
