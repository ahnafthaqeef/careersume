import { safeRelativePath } from "@/lib/safeRedirect";

describe("safeRelativePath", () => {
  it("keeps a same-origin relative path", () => {
    expect(safeRelativePath("/job-scanner", "/builder")).toBe("/job-scanner");
    expect(safeRelativePath("/builder?jd=1", "/builder")).toBe("/builder?jd=1");
  });

  it("falls back for anything that could leave the origin", () => {
    expect(safeRelativePath("//evil.example", "/builder")).toBe("/builder");
    // A browser reads a backslash here exactly like a second slash, and strips
    // control characters before it parses, so both leave the origin.
    expect(safeRelativePath("/\\evil.com", "/builder")).toBe("/builder");
    expect(safeRelativePath("/\t/evil.com", "/builder")).toBe("/builder");
    expect(safeRelativePath("/\n/evil.com", "/builder")).toBe("/builder");
    expect(safeRelativePath("https://evil.example", "/builder")).toBe("/builder");
    expect(safeRelativePath("builder", "/builder")).toBe("/builder");
    expect(safeRelativePath("", "/builder")).toBe("/builder");
    expect(safeRelativePath(null, "/builder")).toBe("/builder");
    expect(safeRelativePath(undefined, "/builder")).toBe("/builder");
  });
});
