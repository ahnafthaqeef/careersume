// JSEARCH_API_KEY is optional. On an instance without one the job scanner has
// to degrade politely: the client prints `data.error` straight into its alert,
// so the wording here is the wording the user reads.

const mockCheckAndIncrementUsage = jest.fn();

jest.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
  }),
}));

jest.mock("@/lib/usage", () => ({
  checkAndIncrementUsage: (...args: unknown[]) => mockCheckAndIncrementUsage(...args),
}));

import { GET } from "@/app/api/search-jobs/route";
import type { NextRequest } from "next/server";

function request(url = "http://localhost:3001/api/search-jobs?keywords=engineer") {
  return {
    url,
    headers: new Headers(),
    cookies: { getAll: () => [] },
  } as unknown as NextRequest;
}

// The key is real in a configured environment, so put it back afterwards rather
// than leaving later suites in a state this one invented.
const savedApiKey = process.env.JSEARCH_API_KEY;

beforeEach(() => {
  mockCheckAndIncrementUsage.mockReset();
  mockCheckAndIncrementUsage.mockResolvedValue({ allowed: true });
  delete process.env.JSEARCH_API_KEY;
});

afterEach(() => {
  if (savedApiKey === undefined) delete process.env.JSEARCH_API_KEY;
  else process.env.JSEARCH_API_KEY = savedApiKey;
});

describe("GET /api/search-jobs without JSEARCH_API_KEY", () => {
  it("answers 503 with copy the scanner can show as-is", async () => {
    const res = await GET(request());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "Job search is not configured on this instance.",
    });
  });

  it("does not spend the user's daily search quota", async () => {
    await GET(request());

    expect(mockCheckAndIncrementUsage).not.toHaveBeenCalled();
  });
});
