// Unit tests for parseResumeFile: dispatch, the 5MB cap, and the friendly
// messages the drop zone shows.
//
// pdfjs-dist and the mammoth browser bundle are stubbed here. Both are ESM-only
// or browser-only builds that this CommonJS jest setup cannot load, and pdf.js
// needs `DOMMatrix` besides, so the real extraction is exercised against real
// PDF and DOCX bytes in a headless browser instead. What is asserted below is
// everything around them: which parser a file reaches, what it is handed, and
// what comes back out.

const mockGetDocument = jest.fn();
const mockExtractRawText = jest.fn();
const mockDestroy = jest.fn(async () => {});

jest.mock(
  "pdfjs-dist/webpack.mjs",
  () => ({ __esModule: true, getDocument: (...args: unknown[]) => mockGetDocument(...args) })
);

jest.mock(
  "mammoth/mammoth.browser",
  () => ({
    __esModule: true,
    default: { extractRawText: (...args: unknown[]) => mockExtractRawText(...args) },
  })
);

import { parseResumeFile, MAX_FILE_BYTES } from "@/lib/parse-resume-file";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Stands in for a parsed document with one text run per line given. */
function pdfWithPages(pages: string[][]) {
  return {
    promise: Promise.resolve({
      numPages: pages.length,
      getPage: async (n: number) => ({
        getTextContent: async () => ({
          items: pages[n - 1].map((str) => ({ str, hasEOL: true })),
        }),
      }),
    }),
    destroy: mockDestroy,
  };
}

beforeEach(() => {
  mockGetDocument.mockReset();
  mockExtractRawText.mockReset();
  mockDestroy.mockClear();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("parseResumeFile", () => {
  it("rejects a file over the 5MB cap before reading it", async () => {
    const tooBig = new File([new Uint8Array(MAX_FILE_BYTES + 1)], "resume.pdf", {
      type: "application/pdf",
    });

    await expect(parseResumeFile(tooBig)).rejects.toThrow("File too large. Maximum size is 5MB.");
    expect(mockGetDocument).not.toHaveBeenCalled();
  });

  it("rejects a file type it cannot read", async () => {
    const pages = new File(["x"], "resume.pages", { type: "application/x-iwork-pages-sffpages" });

    await expect(parseResumeFile(pages)).rejects.toThrow(
      "Unsupported file type. Please upload a PDF, DOCX, or TXT file."
    );
  });

  it("reads a TXT file and trims it", async () => {
    const txt = new File(["  plain text resume body  "], "resume.txt", { type: "text/plain" });

    await expect(parseResumeFile(txt)).resolves.toBe("plain text resume body");
  });

  it("falls back to the extension when the browser sends no MIME type", async () => {
    const txt = new File(["body from extension"], "resume.TXT", { type: "" });

    await expect(parseResumeFile(txt)).resolves.toBe("body from extension");
  });

  it("rejects a file that yields no text", async () => {
    const blank = new File(["   \n  "], "resume.txt", { type: "text/plain" });

    await expect(parseResumeFile(blank)).rejects.toThrow(
      "Could not extract text from the file. Please try a different file."
    );
  });

  it("runs a PDF through pdfjs, keeping line and page breaks", async () => {
    mockGetDocument.mockReturnValue(
      pdfWithPages([["ADA LOVELACE", "Analytical Engine Programmer"], ["EDUCATION"]])
    );
    const pdf = new File(["%PDF-1.4"], "resume.pdf", { type: "application/pdf" });

    await expect(parseResumeFile(pdf)).resolves.toBe(
      "ADA LOVELACE\nAnalytical Engine Programmer\n\n\nEDUCATION"
    );
    expect(mockGetDocument).toHaveBeenCalledWith({ data: expect.any(ArrayBuffer) });
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("tears the pdfjs worker down even when the document will not open", async () => {
    mockGetDocument.mockReturnValue({
      promise: Promise.reject(new Error("InvalidPDFException")),
      destroy: mockDestroy,
    });
    const pdf = new File(["not a pdf"], "resume.pdf", { type: "application/pdf" });

    await expect(parseResumeFile(pdf)).rejects.toThrow("Failed to parse file. Please try again.");
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("runs a DOCX through the mammoth browser build", async () => {
    mockExtractRawText.mockResolvedValue({ value: "ADA LOVELACE\nAnalytical Engine Programmer" });
    const docx = new File(["PK"], "resume.docx", { type: DOCX_MIME });

    await expect(parseResumeFile(docx)).resolves.toBe("ADA LOVELACE\nAnalytical Engine Programmer");
    expect(mockExtractRawText).toHaveBeenCalledWith({ arrayBuffer: expect.any(ArrayBuffer) });
  });
});
