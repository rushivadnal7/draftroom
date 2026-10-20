export type PlaceholderMatch = {
  type: "TODO" | "TBD" | "XXX" | "BRACKET" | "MUSTACHE";
  text: string;
  snippet: string;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function snippetAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + length + 20);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

const PATTERNS: { type: PlaceholderMatch["type"]; regex: RegExp }[] = [
  { type: "TODO", regex: /\bTODO\b/g },
  { type: "TBD", regex: /\bTBD\b/g },
  { type: "XXX", regex: /\bXXX\b/g },
  { type: "BRACKET", regex: /\[[^\]\n]{1,80}\]/g },
  { type: "MUSTACHE", regex: /\{\{[^}\n]{1,80}\}\}/g },
];

/** Pure function: scans rendered document HTML for unfinished-draft markers. */
export function findUnfinishedPlaceholders(html: string): PlaceholderMatch[] {
  const text = stripHtml(html);
  const matches: PlaceholderMatch[] = [];

  for (const { type, regex } of PATTERNS) {
    for (const match of text.matchAll(regex)) {
      if (match.index === undefined) continue;
      matches.push({
        type,
        text: match[0],
        snippet: snippetAround(text, match.index, match[0].length),
      });
    }
  }

  return matches;
}
