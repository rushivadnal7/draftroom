import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("mammoth", () => ({
  default: { convertToHtml: vi.fn() },
}));

const mammoth = (await import("mammoth")).default;
const convertToHtml = mammoth.convertToHtml as unknown as ReturnType<typeof vi.fn>;

const {
  getImportKind,
  deriveTitleFromFilename,
  extractMarkdownH1,
  convertTxtToHtml,
  convertMarkdownToHtml,
  convertImportFile,
  ImportError,
} = await import("@/lib/import/convert");

describe("getImportKind", () => {
  it("recognizes supported extensions", () => {
    expect(getImportKind("notes.txt")).toBe("txt");
    expect(getImportKind("README.md")).toBe("md");
    expect(getImportKind("Report.DOCX")).toBe("docx");
  });

  it("rejects unsupported extensions", () => {
    expect(getImportKind("image.png")).toBeNull();
    expect(getImportKind("no-extension")).toBeNull();
    expect(getImportKind("archive.pdf")).toBeNull();
  });
});

describe("deriveTitleFromFilename", () => {
  it("strips the extension", () => {
    expect(deriveTitleFromFilename("Project Plan.docx")).toBe("Project Plan");
  });

  it("falls back to 'Untitled document' for an empty name", () => {
    expect(deriveTitleFromFilename(".txt")).toBe("Untitled document");
  });
});

describe("extractMarkdownH1", () => {
  it("extracts the first H1 heading", () => {
    expect(extractMarkdownH1("# My Report\n\nBody text")).toBe("My Report");
  });

  it("returns null when there is no H1", () => {
    expect(extractMarkdownH1("## Section\n\nBody text")).toBeNull();
  });
});

describe("convertTxtToHtml", () => {
  it("wraps paragraphs and escapes HTML", () => {
    const html = convertTxtToHtml("Hello <world>\n\nSecond paragraph");
    expect(html).toBe("<p>Hello &lt;world&gt;</p><p>Second paragraph</p>");
  });

  it("converts single newlines within a paragraph to <br />", () => {
    expect(convertTxtToHtml("Line one\nLine two")).toBe("<p>Line one<br />Line two</p>");
  });
});

describe("convertMarkdownToHtml", () => {
  it("renders basic markdown", () => {
    const html = convertMarkdownToHtml("# Title\n\n- one\n- two");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<li>one</li>");
  });
});

describe("convertImportFile", () => {
  beforeEach(() => {
    convertToHtml.mockReset();
  });

  it("converts a .txt file, using the filename as title", async () => {
    const result = await convertImportFile("Meeting Notes.txt", Buffer.from("Hello world"));
    expect(result.title).toBe("Meeting Notes");
    expect(result.html).toBe("<p>Hello world</p>");
  });

  it("converts a .md file and prefers the H1 as title", async () => {
    const result = await convertImportFile("draft.md", Buffer.from("# Real Title\n\nBody"));
    expect(result.title).toBe("Real Title");
    expect(result.html).toContain("<h1>Real Title</h1>");
  });

  it("falls back to the filename when markdown has no H1", async () => {
    const result = await convertImportFile("draft.md", Buffer.from("Just a paragraph"));
    expect(result.title).toBe("draft");
  });

  it("converts a .docx file via mammoth", async () => {
    convertToHtml.mockResolvedValue({ value: "<p>From Word</p>", messages: [] });
    const result = await convertImportFile("Report.docx", Buffer.from("fake-docx-bytes"));
    expect(result.title).toBe("Report");
    expect(result.html).toBe("<p>From Word</p>");
  });

  it("rejects an unsupported file type", async () => {
    await expect(convertImportFile("image.png", Buffer.from("x"))).rejects.toMatchObject({
      code: "UNSUPPORTED_TYPE",
    });
  });

  it("rejects empty content", async () => {
    await expect(convertImportFile("empty.txt", Buffer.from("   \n\n  "))).rejects.toMatchObject({
      code: "EMPTY",
    });
  });

  it("rejects a corrupt .docx file", async () => {
    convertToHtml.mockRejectedValue(new Error("not a valid zip"));
    await expect(convertImportFile("broken.docx", Buffer.from("not-a-docx"))).rejects.toBeInstanceOf(ImportError);
    await expect(convertImportFile("broken.docx", Buffer.from("not-a-docx"))).rejects.toMatchObject({
      code: "CORRUPT",
    });
  });
});
