import Link from "next/link";

const GITHUB = "https://github.com/ahnafthaqeef/careersume";

const ANCHORS = [
  { href: "#how", label: "How it works" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#faq", label: "FAQ" },
];

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const LINK = `text-[15px] text-ink-2 transition-colors duration-200 hover:text-ink ${FOCUS}`;
const PRIMARY = `rounded-md bg-ink px-4 py-2 text-[15px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 ${FOCUS}`;
const GHOST = `rounded-md border border-line px-4 py-2 text-[15px] font-semibold text-ink transition-colors duration-200 hover:border-ink ${FOCUS}`;

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-content items-center justify-between gap-6 px-6 py-3">
        <Link href="/" className={`font-serif text-xl leading-none ${FOCUS}`}>
          Careersume
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
          <div className="absolute right-0 top-[calc(100%+12px)] w-60 rounded-md border border-line bg-surface p-2 shadow-paper">
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
              className="mt-1 block rounded-md bg-ink px-3 py-2 text-center text-[15px] font-semibold text-paper"
            >
              Start free
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
