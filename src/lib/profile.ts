// Master profile, Supabase-backed with localStorage fallback/mirror.
// GET/PUT /api/profile persist to the DB for signed-in users; localStorage
// keeps the profile usable offline and covers the pre-Supabase local copy.

const STORAGE_KEY = "ai-resume-master-profile";

function readLocalProfile(): unknown | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Pre-migration data was stored as plain text, not JSON.
    return raw;
  }
}

export async function loadMasterProfile(): Promise<unknown | null> {
  let res: Response;
  try {
    res = await fetch("/api/profile");
  } catch {
    // Network failure: we don't know the server's state, never touch local.
    return readLocalProfile();
  }
  // Signed-out (401), server error, etc: same, we don't actually know the
  // server's state, so never migrate or clear the local copy.
  if (!res.ok) return readLocalProfile();

  const data = await res.json();
  if (data.profile != null) return data.profile;

  const local = readLocalProfile();
  if (local != null) {
    try {
      const putRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: local }),
      });
      // Only clear localStorage once the server has confirmed it has the copy.
      if (putRes.ok) localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  return local;
}

export async function saveMasterProfile(profile: unknown): Promise<void> {
  await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  try {
    // Mirror as plain text when the profile is a string (the common case, and
    // the format other pages like job-scanner already read directly).
    localStorage.setItem(STORAGE_KEY, typeof profile === "string" ? profile : JSON.stringify(profile));
  } catch {}
}
