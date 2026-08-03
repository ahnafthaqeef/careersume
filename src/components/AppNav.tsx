import Link from "next/link";

/** The signed-in tool set. Every app page shows the same row so the nav never
 *  changes shape as you move between them. */
const LINKS = [
  { href: "/builder", label: "Resume builder" },
  { href: "/job-scanner", label: "Job scanner" },
  { href: "/job-tracker", label: "Tracker" },
  { href: "/cover-letter", label: "Cover letter" },
  { href: "/history", label: "History" },
];

/** Replacing or removing the connected AI key is one click from anywhere in the
 *  app. It rides in the right slot where there is room for it, and joins the
 *  scrolling row below `lg` where there is not. */
const ACCOUNT = { href: "/account/byok", label: "Account" };

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
/** No display utility of its own, so the caller can decide when it shows. */
const QUIET = `min-h-[44px] items-center rounded px-2 text-[13px] text-ink-2 transition-colors duration-200 hover:text-ink ${FOCUS}`;

function linkClass(isActive: boolean) {
  return `whitespace-nowrap rounded text-[14px] transition-colors duration-200 ${FOCUS} ${
    isActive ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"
  }`;
}

export default function AppNav({
  active,
  right,
  container = "max-w-screen-xl",
}: {
  /** Pathname of the page showing this nav, so it can mark itself current. */
  active?: string;
  /** Page-specific controls that sit on the right of the top row. */
  right?: React.ReactNode;
  /** Width class, so the nav lines up with whatever the page puts under it. */
  container?: string;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <div className={`mx-auto flex ${container} items-center justify-between gap-6 px-4 py-3`}>
        <div className="flex items-center gap-8">
          <Link href="/" className={`font-serif text-xl leading-none ${FOCUS}`}>
            Careersume
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.href === active ? "page" : undefined}
                className={linkClass(link.href === active)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href={ACCOUNT.href} className={`hidden lg:inline-flex ${QUIET}`}>
            {ACCOUNT.label}
          </Link>
          {right}
        </div>
      </div>

      {/* The hairline runs edge to edge like the header's own border; only the
          links line up with the page content underneath. */}
      <div className="border-t border-line lg:hidden">
        <nav className={`mx-auto flex ${container} gap-5 overflow-x-auto px-4 py-2.5`}>
          {[...LINKS, ACCOUNT].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.href === active ? "page" : undefined}
              className={linkClass(link.href === active)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
