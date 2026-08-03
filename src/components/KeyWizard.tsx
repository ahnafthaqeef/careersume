"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProviderCard, ProviderId } from "@/lib/providers";

type Step = "provider" | "instructions" | "paste" | "done";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
const PRIMARY = `inline-flex items-center justify-center rounded-md bg-ink px-5 py-3 text-[15px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const GHOST = `inline-flex items-center justify-center rounded-md border border-line px-5 py-3 text-[15px] font-semibold text-ink transition-colors duration-200 hover:border-ink ${FOCUS}`;
const QUIET = `text-[14px] text-ink-3 underline underline-offset-4 transition-colors duration-200 hover:text-ink ${FOCUS}`;
const HEADING = "font-serif text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] tracking-[-0.01em]";
const BODY = "text-[17px] leading-[28px] text-ink-2";
const PANEL = "rounded-md border border-line bg-surface p-6 shadow-paper md:p-8";

const REJECTED = "That key was rejected. Check you copied all of it, then try again.";
const UNREACHABLE = "The provider could not be reached. Your key was not changed. Try again in a minute.";
const SIGNED_OUT = "Your session ended. Sign in again, then paste the key.";

/** Longer badge for the recommended default; other free-key providers get "Free". */
const BADGE: Partial<Record<ProviderId, string>> = {
  gemini: "Free, no credit card, about 2 minutes",
};

const BILLING: Record<ProviderId, string> = {
  gemini: "No billing setup needed.",
  groq: "No billing setup needed.",
  openai: "Needs billing on your OpenAI account.",
  anthropic: "Needs credit on your Anthropic workspace.",
};

/** What the provider calls the page where keys are made. */
const CONSOLE: Record<ProviderId, string> = {
  gemini: "Google AI Studio",
  groq: "the Groq Console",
  openai: "the OpenAI dashboard",
  anthropic: "the Anthropic Console",
};

const INSTRUCTIONS: Record<ProviderId, string[]> = {
  gemini: [
    "Open Google AI Studio (button below).",
    "Sign in with any Google account.",
    "Click Create API key.",
    "Copy the key that starts with AIza.",
  ],
  groq: [
    "Open the Groq Console (button below).",
    "Sign in with Google, GitHub, or your email.",
    "Click Create API Key and give it a name.",
    "Copy the key that starts with gsk_ before you close the dialog.",
  ],
  openai: [
    "Open the OpenAI dashboard (button below).",
    "Sign in, and add billing if the account has none.",
    "Click Create new secret key.",
    "Copy the key that starts with sk- before you close the dialog.",
  ],
  anthropic: [
    "Open the Anthropic Console (button below).",
    "Sign in, and add credit if the workspace has none.",
    "Click Create Key.",
    "Copy the key that starts with sk-ant- before you close the dialog.",
  ],
};

const PLACEHOLDER: Record<ProviderId, string> = {
  gemini: "AIza...",
  groq: "gsk_...",
  openai: "sk-...",
  anthropic: "sk-ant-...",
};

const STEP_NUMBER: Record<Exclude<Step, "done">, number> = {
  provider: 1,
  instructions: 2,
  paste: 3,
};

export default function KeyWizard({
  providers,
  variant = "onboarding",
  next = "/builder",
}: {
  providers: ProviderCard[];
  variant?: "onboarding" | "settings";
  /** Where to send the user once a key is connected. Validated by the page. */
  next?: string;
}) {
  const isSettings = variant === "settings";
  const [step, setStep] = useState<Step>("provider");
  const [providerId, setProviderId] = useState<ProviderId>("gemini");
  const [key, setKey] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState<ProviderId | null>(null);
  // Settings opens on the connected key; the wizard itself is the replace path.
  const [editing, setEditing] = useState(!isSettings);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  const card = (id: ProviderId) => providers.find((p) => p.id === id) ?? providers[0];
  const provider = card(providerId);

  useEffect(() => {
    if (!isSettings) return;
    fetch("/api/byok/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { hasKey?: boolean; provider?: ProviderId | null } | null) => {
        if (data?.hasKey && data.provider) {
          setConnected(data.provider);
          setProviderId(data.provider);
        } else {
          setEditing(true);
        }
      })
      .catch(() => setEditing(true));
  }, [isSettings]);

  async function handleSave() {
    setBusy(true);
    setError("");
    try {
      const body = JSON.stringify({ provider: providerId, key: key.trim() });
      const headers = { "Content-Type": "application/json" };

      const testRes = await fetch("/api/byok/test", { method: "POST", headers, body });
      const tested = await testRes.json();
      if (testRes.status === 401) {
        setError(SIGNED_OUT);
        return;
      }
      if (!tested.ok) {
        // `rejected` is the provider's own verdict on the credential; anything
        // else is our side or theirs failing, and the key is still untouched.
        setError(tested.rejected ? REJECTED : tested.error || UNREACHABLE);
        return;
      }

      const saveRes = await fetch("/api/byok/save", { method: "POST", headers, body });
      if (saveRes.status === 401) {
        setError(SIGNED_OUT);
        return;
      }
      if (!saveRes.ok) {
        // The key itself checked out a moment ago, so this is our side failing.
        setError("The key works, but saving it failed. Try again in a moment.");
        return;
      }

      setConnected(providerId);
      setKey("");
      setRevealed(false);
      setStep("done");
    } catch {
      setError(UNREACHABLE);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!connected) return;
    setRemoving(true);
    setError("");
    try {
      const res = await fetch("/api/byok/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: connected }),
      });
      if (res.status === 401) {
        setError(SIGNED_OUT);
        return;
      }
      if (!res.ok) {
        setError("The key could not be removed. Try again in a moment.");
        return;
      }
      // Back to a no-key account, sitting on the connect flow.
      setConnected(null);
      setConfirmRemove(false);
      setStep("provider");
      setEditing(true);
    } catch {
      setError("The key could not be removed. Try again in a moment.");
    } finally {
      setRemoving(false);
    }
  }

  function startOver(id: ProviderId) {
    setProviderId(id);
    setEditing(true);
    setError("");
    setKey("");
    setConfirmRemove(false);
    setStep("provider");
  }

  if (isSettings && !editing) {
    return (
      <div className={PANEL}>
        {connected ? (
          <>
            <p className="text-[14px] text-ink-3">Connected key</p>
            <p className="mt-1 font-serif text-[28px] leading-tight">{card(connected).label}</p>
            <p className={`mt-3 ${BODY}`}>
              {confirmRemove
                ? "Remove this key? Tailoring stops working until you connect another one, and nothing else in your account changes."
                : "Every generation runs on this key. Replace it whenever you rotate keys or move to another provider."}
            </p>

            {error && (
              <p role="alert" className="mt-3 text-[14px] text-score-missing">
                {error}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {confirmRemove ? (
                <>
                  <button
                    type="button"
                    className={PRIMARY}
                    disabled={removing}
                    onClick={handleRemove}
                  >
                    {removing ? "Removing..." : "Yes, remove it"}
                  </button>
                  <button
                    type="button"
                    className={QUIET}
                    onClick={() => setConfirmRemove(false)}
                  >
                    Keep the key
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className={PRIMARY} onClick={() => startOver(connected)}>
                    Replace key
                  </button>
                  <button
                    type="button"
                    className={GHOST}
                    onClick={() => {
                      setConfirmRemove(true);
                      setError("");
                    }}
                  >
                    Remove key
                  </button>
                  <Link href="/builder" className={QUIET}>
                    Back to the builder
                  </Link>
                </>
              )}
            </div>
          </>
        ) : (
          <p className={BODY}>Checking your key...</p>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {step !== "done" && (
        <p className="mb-3 text-[14px] text-ink-3">Step {STEP_NUMBER[step]} of 3</p>
      )}

      <div className={PANEL}>
        {step === "provider" && (
          <>
            <h2 className={HEADING}>Choose where your AI comes from.</h2>
            <p className={`mt-3 ${BODY}`}>
              Careersume runs on a key you own, so nothing here is capped and no bill comes from
              us. If you have no preference, take the Google one. It is free and takes about two
              minutes.
            </p>
            <div className="mt-6 space-y-3">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProviderId(p.id);
                    setError("");
                    setStep("instructions");
                  }}
                  className={`block w-full rounded-md border border-line bg-paper p-4 text-left transition-colors duration-200 hover:border-ink ${FOCUS}`}
                >
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[16px] font-semibold text-ink">{p.label}</span>
                    {p.freeKey && (
                      <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[11px] text-accent">
                        {BADGE[p.id] ?? "Free"}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[14px] text-ink-3">
                    Runs on <span className="font-mono">{p.defaultModel}</span>. {BILLING[p.id]}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "instructions" && (
          <>
            <h2 className={HEADING}>Get a key from {provider.label}.</h2>
            <ol className="mt-6 space-y-4">
              {INSTRUCTIONS[providerId].map((text, i) => (
                <li key={text} className="flex gap-3">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-line text-[13px] font-semibold text-ink-2">
                    {i + 1}
                  </span>
                  <span className={BODY}>{text}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={provider.keyConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={GHOST}
              >
                Open {CONSOLE[providerId]}
              </a>
              <button type="button" className={PRIMARY} onClick={() => setStep("paste")}>
                I have my key
              </button>
            </div>
            <p className="mt-3 text-[14px] text-ink-3">The provider page opens in a new tab.</p>
            <button type="button" className={`mt-6 ${QUIET}`} onClick={() => setStep("provider")}>
              Pick a different provider
            </button>
          </>
        )}

        {step === "paste" && (
          <>
            <h2 className={HEADING}>Paste your key.</h2>
            <p className={`mt-3 ${BODY}`}>
              It is encrypted before it is stored, decrypted on the server only for your own
              requests, and never sent back to the browser.
            </p>

            <label htmlFor="byok-key" className="mt-6 block text-[14px] text-ink-3">
              {provider.label} API key
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="byok-key"
                type={revealed ? "text" : "password"}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError("");
                }}
                placeholder={PLACEHOLDER[providerId]}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-md border border-line bg-paper px-3 py-2.5 font-mono text-[14px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
              />
              <button
                type="button"
                onClick={() => setRevealed(!revealed)}
                className={`flex-none rounded-md border border-line px-3 text-[14px] font-medium text-ink-2 transition-colors duration-200 hover:border-ink ${FOCUS}`}
              >
                {revealed ? "Hide" : "Show"}
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-[14px] text-score-missing">
                {error}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                className={PRIMARY}
                disabled={key.trim().length < 10 || busy}
                onClick={handleSave}
              >
                {busy ? "Checking your key..." : "Validate and save"}
              </button>
              <button type="button" className={QUIET} onClick={() => setStep("instructions")}>
                Back to the steps
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <h2 className={HEADING}>You're set. Unlimited tailoring, on your key.</h2>
            <p className={`mt-3 ${BODY}`}>
              Your {provider.label} key is saved and encrypted. You can replace or remove it any
              time from your account.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={next} className={PRIMARY}>
                {next === "/builder" ? "Go to the builder" : "Continue"}
              </Link>
              {isSettings && (
                <button
                  type="button"
                  className={GHOST}
                  onClick={() => {
                    setEditing(false);
                    setStep("provider");
                  }}
                >
                  Back to key settings
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
