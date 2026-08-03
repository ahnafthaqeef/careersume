// Contract test for POST /api/byok/test: the wizard decides between "your key
// is wrong" and "we could not reach the provider" purely from `rejected`.

const mockValidateKey = jest.fn();

jest.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
  }),
}));

jest.mock("@/lib/providers", () => ({
  PROVIDERS: [{ id: "gemini" }, { id: "groq" }, { id: "openai" }, { id: "anthropic" }],
  getProvider: () => ({ validateKey: mockValidateKey }),
}));

import { POST } from "@/app/api/byok/test/route";
import type { NextRequest } from "next/server";

function request(body: unknown) {
  return {
    cookies: { getAll: () => [] },
    json: async () => body,
  } as unknown as NextRequest;
}

const VALID_BODY = { provider: "gemini", key: "AIza-a-long-enough-key" };

beforeEach(() => mockValidateKey.mockReset());

describe("POST /api/byok/test", () => {
  it("reports rejected when the provider refused the credential", async () => {
    mockValidateKey.mockResolvedValue({
      ok: false,
      rejected: true,
      error: "That key was rejected by the provider.",
    });

    const res = await POST(request(VALID_BODY));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: false,
      rejected: true,
      error: "That key was rejected by the provider.",
    });
  });

  it("does not report rejected when the provider could not be reached", async () => {
    mockValidateKey.mockResolvedValue({ ok: false, rejected: false, error: "fetch failed" });

    const res = await POST(request(VALID_BODY));

    expect(await res.json()).toEqual({ ok: false, rejected: false, error: "fetch failed" });
  });

  it("reports ok for a working key", async () => {
    mockValidateKey.mockResolvedValue({ ok: true });

    const res = await POST(request(VALID_BODY));

    expect(await res.json()).toEqual({ ok: true, rejected: false });
  });

  it("rejects an unknown provider without calling the adapter", async () => {
    const res = await POST(request({ provider: "mistral", key: "a-long-enough-key" }));

    expect(res.status).toBe(400);
    expect(mockValidateKey).not.toHaveBeenCalled();
  });
});
