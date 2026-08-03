import { getProvider, PROVIDERS } from "@/lib/providers";
import { toValidationResult } from "@/lib/providers/types";

describe("provider registry", () => {
  it("returns an adapter for every id with required fields", () => {
    for (const id of ["gemini", "openai", "anthropic", "groq"] as const) {
      const p = getProvider(id);
      expect(p.id).toBe(id);
      expect(p.defaultModel).toBeTruthy();
      expect(p.keyConsoleUrl).toMatch(/^https:\/\//);
      expect(typeof p.stream).toBe("function");
      expect(typeof p.validateKey).toBe("function");
    }
  });
  it("lists gemini first and flags free-key providers", () => {
    expect(PROVIDERS[0].id).toBe("gemini");
    expect(PROVIDERS.find(p => p.id === "gemini")!.freeKey).toBe(true);
    expect(PROVIDERS.find(p => p.id === "groq")!.freeKey).toBe(true);
    expect(PROVIDERS.find(p => p.id === "openai")!.freeKey).toBe(false);
  });
  it("throws on unknown provider id", () => {
    expect(() => getProvider("mistral" as never)).toThrow();
  });
});

describe("toValidationResult", () => {
  it("flags a refused credential as rejected", () => {
    expect(toValidationResult(Object.assign(new Error("no"), { status: 401 }))).toEqual({
      ok: false,
      rejected: true,
      error: "That key was rejected by the provider.",
    });
    expect(toValidationResult(new Error("[400] API key not valid")).rejected).toBe(true);
  });
  it("leaves a transport failure unrejected and passes its message through", () => {
    expect(toValidationResult(new Error("fetch failed"))).toEqual({
      ok: false,
      rejected: false,
      error: "fetch failed",
    });
  });
});
