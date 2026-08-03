// Unit tests for checkAndIncrementUsage: quiet daily caps on infra-consuming
// helpers (scraping, parsing). Generation itself is never limited by this.

const mockRpc = jest.fn();

jest.mock("@/lib/supabase/admin", () => ({
  adminClient: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

import { checkAndIncrementUsage } from "@/lib/usage";

beforeEach(() => {
  mockRpc.mockReset();
});

describe("checkAndIncrementUsage", () => {
  it("allows the request when the incremented count is at or under the limit", async () => {
    mockRpc.mockResolvedValue({ data: 5, error: null });

    const result = await checkAndIncrementUsage("user-1", "fetch-job-url", 30);

    expect(result).toEqual({ allowed: true, used: 5 });
    expect(mockRpc).toHaveBeenCalledWith("increment_usage", {
      p_user: "user-1",
      p_endpoint: "fetch-job-url",
    });
  });

  it("blocks the request once the incremented count exceeds the limit", async () => {
    mockRpc.mockResolvedValue({ data: 31, error: null });

    const result = await checkAndIncrementUsage("user-1", "fetch-job-url", 30);

    expect(result).toEqual({ allowed: false, used: 31 });
  });

  it("fails open (allowed:true) and warns when the rpc errors", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockRpc.mockResolvedValue({ data: null, error: { message: "connection reset" } });

    const result = await checkAndIncrementUsage("user-1", "search-jobs", 30);

    expect(result).toEqual({ allowed: true, used: 0 });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
