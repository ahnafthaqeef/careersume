import { withBasePath } from "@/lib/basePath";

describe("withBasePath", () => {
  it("leaves paths alone when the app is served from the domain root", () => {
    // Jest runs no webpack pass, so the prefix is unset here, which is also the
    // shape a self-hosted build with no basePath configured ships in.
    expect(withBasePath("/api/profile")).toBe("/api/profile");
  });

  it("prefixes every hand-built internal path when served from a subpath", () => {
    jest.isolateModules(() => {
      process.env.NEXT_PUBLIC_BASE_PATH = "/careersume";
      const { withBasePath: prefixed } = require("@/lib/basePath");

      // The fetch call sites, the OAuth callback the browser is sent back to,
      // and a redirect target read out of a query param all go through here.
      expect(prefixed("/api/byok/status")).toBe("/careersume/api/byok/status");
      expect(prefixed("/auth/callback")).toBe("/careersume/auth/callback");
      expect(prefixed("/builder")).toBe("/careersume/builder");

      delete process.env.NEXT_PUBLIC_BASE_PATH;
    });
  });
});
