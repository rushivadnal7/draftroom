export function htmlToPreviewText(html: string, maxLength = 160): string {
  const text = html
    .replace(/<(h[1-3]|p|li|br)[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
