import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import ResumeShowcase from "@/components/ResumeShowcase";

export const dynamic = "force-static";

const GITHUB = "https://github.com/ahnafthaqeef/careersume";
const SELF_HOST = `${GITHUB}#self-hosting`;
const LICENSE = `${GITHUB}/blob/main/LICENSE`;
const ISSUES = `${GITHUB}/issues`;

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const PRIMARY = `inline-flex items-center justify-center rounded-md bg-ink px-5 py-3 text-[15px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 ${FOCUS}`;
const GHOST = `inline-flex items-center justify-center rounded-md border border-line px-5 py-3 text-[15px] font-semibold text-ink transition-colors duration-200 hover:border-ink ${FOCUS}`;
const SECTION = "mx-auto max-w-content border-t border-line px-6 py-14 scroll-mt-16 md:py-20";
const H2 = "font-serif text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.05] tracking-[-0.01em]";
const BODY = "text-[17px] leading-[28px] text-ink-2";
const CHIP = "rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[11px] text-accent";
const BAR = "h-1 rounded-full bg-line";
const STILL = "mt-auto flex min-h-[116px] flex-col justify-center rounded border border-line bg-paper p-4";
const TEXT_LINK = `text-accent underline underline-offset-4 decoration-accent/40 transition-colors duration-200 hover:decoration-accent ${FOCUS}`;

const STEPS = [
  {
    title: "Paste the job",
    body: "Drop in the job description or a link to the posting. Careersume reads what the role is actually asking for.",
  },
  {
    title: "Connect your free key",
    body: "One key from Google AI Studio. Free, no credit card, about two minutes. It stays encrypted in your account.",
  },
  {
    title: "Download the tailored PDF",
    body: "Your résumé comes back rewritten for that posting, formatted so a parser can read every line of it.",
  },
];

const PIPELINE = [
  { title: "Scanner", body: "Read any posting from a link." },
  { title: "Tailor", body: "Rewrite your résumé against it." },
  { title: "Score", body: "Check keyword coverage first." },
  { title: "Cover letter", body: "Draft the letter from the same facts." },
  { title: "Tracker", body: "Keep every application and stage." },
];

const FAQ = [
  {
    q: "How is this different from just using ChatGPT?",
    a: "Chat gives you words. Careersume gives you structure: ATS-safe formatting, keyword scoring against the actual posting, a reusable master profile, and a pipeline that keeps every application in one place. You can paste a job into a chat window every time. This is the version that keeps the output consistent and the history in one place.",
  },
  {
    q: "Is my data private?",
    a: "Your profile and your documents live in your own account, behind row-level security. There is no data business here, nothing is sold, and nothing is used to train anything. If you would rather trust nobody, run your own copy.",
  },
  {
    q: "Is it safe to give you my API key?",
    a: "Your key is encrypted at rest, decrypted on the server only for the request you asked for, and never sent back to the browser. You can revoke it in your provider console at any time and it stops working immediately.",
  },
  {
    q: "Can I self-host it?",
    a: "Yes. It is a Next.js app and a Supabase project. Clone the repo, set the environment variables, run the SQL, and you have your own Careersume with your own database.",
  },
  {
    q: "What do I actually get at the end?",
    a: "A finished résumé you save as a PDF straight from the browser, plus the HTML if you want to keep editing it. Both are built for parsers: real text, standard section headings, and no tables or columns that break machine reading.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <LandingNav />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-content px-6 pb-14 pt-12 md:pb-20 md:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
            <div>
              <h1 className="font-serif text-[clamp(3.5rem,8vw,6rem)] leading-[1.02] tracking-[-0.02em] text-balance">
                The résumé, rewritten for the job.
              </h1>
              <p className={`mt-6 max-w-[52ch] ${BODY}`}>
                Paste a job description. Careersume tailors your résumé to it: right keywords, right
                order, ATS-safe. Free, open source, unlimited with your own AI key.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/auth/register" className={PRIMARY}>
                  Start free
                </Link>
                <a href={GITHUB} target="_blank" rel="noreferrer" className={GHOST}>
                  Star on GitHub
                </a>
              </div>
              <p className="mt-6 text-[14px] text-ink-3">
                No credit card. You bring your own AI key, which takes about two minutes to create.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <ResumeShowcase />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className={SECTION}>
          <h2 className={H2}>How it works</h2>
          <p className={`mt-6 max-w-[56ch] ${BODY}`}>
            Three steps, and the third one is a file you can send.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex flex-col rounded-md border border-line bg-surface p-6">
                <p className="font-serif text-2xl leading-none text-ink-3">{i + 1}</p>
                <h3 className="mt-4 text-[17px] font-semibold">{step.title}</h3>
                <p className="mb-8 mt-2 text-[15px] leading-[24px] text-ink-2">{step.body}</p>

                {i === 0 && (
                  <div className={STILL}>
                    <div className="space-y-1.5">
                      <div className={`${BAR} w-4/5`} />
                      <div className={`${BAR} w-full`} />
                      <div className={`${BAR} w-3/5`} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className={CHIP}>vendor reviews</span>
                      <span className={CHIP}>SLA credits</span>
                    </div>
                  </div>
                )}

                {i === 1 && (
                  <div className={STILL}>
                    <p className="font-mono text-[12px] text-ink-2">AIzaSy••••••••••••••••3f2</p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-[13px]">
                      <span className="text-ink-3">Google AI Studio</span>
                      <span className="text-accent">Connected</span>
                    </div>
                  </div>
                )}

                {i === 2 && (
                  <div className={STILL}>
                    <div className="mx-auto w-24 rounded-sm border border-line bg-surface p-2">
                      <div className="h-1.5 w-10 rounded-full bg-ink-3" />
                      <div className="mt-2 space-y-1">
                        <div className={`${BAR} w-full`} />
                        <div className={`${BAR} w-full`} />
                        <div className={`${BAR} w-2/3`} />
                      </div>
                    </div>
                    <p className="mt-3 text-center font-mono text-[12px] text-ink-3">amara-osei.pdf</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline */}
        <section id="pipeline" className={SECTION}>
          <h2 className={H2}>The whole hunt, in one place</h2>
          <p className={`mt-6 max-w-[56ch] ${BODY}`}>
            Careersume is not one tool. It is the run you make for every application, from the posting
            you found this morning to the follow-up three weeks later.
          </p>

          <div className="mt-12 flex flex-col items-stretch md:flex-row">
            {PIPELINE.map((node, i) => (
              <div key={node.title} className="contents">
                {i > 0 && (
                  <div className="flex shrink-0 items-center justify-center py-3 md:px-2 md:py-0">
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden
                      className="h-4 w-4 rotate-90 text-ink-3 md:rotate-0"
                    >
                      <path
                        d="M1 8h13M9.5 3.5 14 8l-4.5 4.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>
                )}
                <div className="flex-1 rounded-md border border-line bg-surface p-5">
                  <h3 className="text-[15px] font-semibold">{node.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-[22px] text-ink-2">{node.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How is this free */}
        <section id="free" className={SECTION}>
          <h2 className={H2}>How is this free?</h2>
          <p className="mt-8 max-w-[34ch] font-serif text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.3] text-ink md:max-w-[42ch]">
            Because nothing here costs us money to run. There is no server bill hiding behind this
            page, no seat you eventually pay for, no plan waiting at the end of a trial.
          </p>

          <div className="mt-14 grid gap-x-16 gap-y-10 md:grid-cols-2">
            <div className="border-t border-line pt-6">
              <h3 className="text-[17px] font-semibold">Open source, MIT licensed</h3>
              <p className={`mt-2 ${BODY}`}>
                The entire app is on GitHub. Read it, fork it, send a patch, or run your own copy
                tonight.{" "}
                <a href={GITHUB} target="_blank" rel="noreferrer" className={TEXT_LINK}>
                  Read the code
                </a>
                .
              </p>
            </div>

            <div className="border-t border-line pt-6">
              <h3 className="text-[17px] font-semibold">You bring your own key</h3>
              <p className={`mt-2 ${BODY}`}>
                Google&apos;s AI key is free, needs no credit card, and takes about two minutes to
                create. The AI bill is yours, and for a job hunt it is usually nothing.
              </p>
            </div>

            <div className="border-t border-line pt-6">
              <h3 className="text-[17px] font-semibold">No artificial caps</h3>
              <p className={`mt-2 ${BODY}`}>
                No credits, no three-a-month wall, no upgrade prompt at the exact moment you need the
                thing. Your own key is the only limit.
              </p>
            </div>

            <div className="border-t border-line pt-6">
              <h3 className="text-[17px] font-semibold">Your data stays yours</h3>
              <p className={`mt-2 ${BODY}`}>
                Your profile and your key sit in your own account, encrypted at rest. If you would
                rather they sat on your own machine,{" "}
                <a href={SELF_HOST} target="_blank" rel="noreferrer" className={TEXT_LINK}>
                  self-host it
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={SECTION}>
          <h2 className={H2}>Questions</h2>

          <div className="mt-10 max-w-[76ch] border-t border-line">
            {FAQ.map((item) => (
              <details key={item.q} className="group border-b border-line py-5">
                <summary
                  className={`flex cursor-pointer list-none items-start justify-between gap-8 text-[17px] font-medium [&::-webkit-details-marker]:hidden ${FOCUS}`}
                >
                  {item.q}
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-[17px] leading-none text-ink-3 transition-transform duration-200 motion-reduce:transition-none group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className={`mt-3 max-w-[68ch] ${BODY}`}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className={SECTION}>
          <h2 className={H2}>Start with one job posting</h2>
          <p className={`mt-6 max-w-[52ch] ${BODY}`}>
            Paste it in, connect a free key, and see what your résumé reads like when it was written
            for that job instead of every job.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/auth/register" className={PRIMARY}>
              Start free
            </Link>
            <a href={GITHUB} target="_blank" rel="noreferrer" className={GHOST}>
              Star on GitHub
            </a>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-content border-t border-line px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-xl leading-none">Careersume</p>
            <p className="mt-2 text-[14px] text-ink-3">
              Free and open source, for people who are still applying.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-ink-2">
            <a href={GITHUB} target="_blank" rel="noreferrer" className={FOCUS}>
              GitHub
            </a>
            <a href={LICENSE} target="_blank" rel="noreferrer" className={FOCUS}>
              MIT license
            </a>
            <a href={SELF_HOST} target="_blank" rel="noreferrer" className={FOCUS}>
              Self-host
            </a>
            <a href={ISSUES} target="_blank" rel="noreferrer" className={FOCUS}>
              Feedback
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
