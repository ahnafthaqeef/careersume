/**
 * @jest-environment jsdom
 */
import { loadMasterProfile } from "@/lib/profile";

describe("master profile", () => {
  it("migrates localStorage profile to server when server is empty", async () => {
    localStorage.setItem("ai-resume-master-profile", JSON.stringify({ name: "Ahnaf" }));
    const calls: string[] = [];
    global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (!init?.method) return { ok: true, json: async () => ({ profile: null }) } as Response;
      return { ok: true, json: async () => ({}) } as Response;
    }) as never;
    const p = await loadMasterProfile();
    expect(p).toEqual({ name: "Ahnaf" });
    expect(calls).toContain("PUT /api/profile");
  });

  it("leaves the local profile untouched when signed out (GET and PUT both fail)", async () => {
    localStorage.setItem("ai-resume-master-profile", JSON.stringify({ name: "Ahnaf" }));
    global.fetch = jest.fn(async () => {
      return { ok: false, json: async () => ({ error: "Please sign in." }) } as Response;
    }) as never;
    const p = await loadMasterProfile();
    expect(p).toEqual({ name: "Ahnaf" });
    expect(localStorage.getItem("ai-resume-master-profile")).toBe(JSON.stringify({ name: "Ahnaf" }));
  });
});
