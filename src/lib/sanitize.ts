import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "p", "strong", "em", "u", "ul", "ol", "li", "br", "a",
];

/** Allow-list HTML sanitizer applied on every write (editor save) and import. */
export function sanitizeDocumentHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "rel", "target"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
  });
}
