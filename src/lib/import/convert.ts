import { marked } from "marked";
import mammoth from "mammoth";

export type ImportKind = "txt" | "md" | "docx";

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;

export class ImportError extends Error {
  code: "UNSUPPORTED_TYPE" | "EMPTY" | "CORRUPT";

  constructor(code: ImportError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export function getImportKind(filename: string): ImportKind | null {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "txt") return "txt";
  if (ext === "md") return "md";
  if (ext === "docx") return "docx";
  return null;
}

export function deriveTitleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^./\\]+$/, "").trim();
  return base || "Untitled document";
}

export function extractMarkdownH1(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function convertTxtToHtml(text: string): string {
  return text
    .split(/\r?\n\r?\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\r?\n/g, "<br />")}</p>`)
    .join("");
}

export function convertMarkdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

export async function convertDocxToHtml(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer });
  return result.value;
}

function isEmptyHtml(html: string): boolean {
  return !html.replace(/<[^>]*>/g, "").trim();
}

export async function convertImportFile(
  filename: string,
  buffer: Buffer
): Promise<{ title: string; html: string }> {
  const kind = getImportKind(filename);
  if (!kind) {
    throw new ImportError("UNSUPPORTED_TYPE", "Only .txt, .md, and .docx files are supported.");
  }

  let title = deriveTitleFromFilename(filename);
  let html: string;

  if (kind === "txt") {
    html = convertTxtToHtml(buffer.toString("utf-8"));
  } else if (kind === "md") {
    const markdown = buffer.toString("utf-8");
    const h1 = extractMarkdownH1(markdown);
    if (h1) title = h1;
    html = convertMarkdownToHtml(markdown);
  } else {
    try {
      html = await convertDocxToHtml(buffer);
    } catch {
      throw new ImportError("CORRUPT", "This .docx file could not be read.");
    }
  }

  if (isEmptyHtml(html)) {
    throw new ImportError("EMPTY", "This file has no content to import.");
  }

  return { title, html };
}
