// Runs client-side only (DOMParser). Our content HTML is always produced by
// sanitize-html's fixed allow-list (h1-3, p, strong, em, u, ul, ol, li, br, a),
// so a small hand-rolled walker is simpler and more reliable here than pulling
// in a general-purpose HTML->Markdown library for arbitrary HTML we never emit.
export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const lines: string[] = [];

  function inline(node: ChildNode): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const inner = Array.from(el.childNodes).map(inline).join("");
    switch (el.tagName) {
      case "STRONG":
      case "B":
        return `**${inner}**`;
      case "EM":
      case "I":
        return `_${inner}_`;
      case "U":
        return `<u>${inner}</u>`;
      case "A":
        return `[${inner}](${el.getAttribute("href") ?? ""})`;
      case "BR":
        return "  \n";
      default:
        return inner;
    }
  }

  function inlineText(el: Element): string {
    return Array.from(el.childNodes).map(inline).join("").trim();
  }

  for (const el of Array.from(doc.body.children)) {
    switch (el.tagName) {
      case "H1":
        lines.push(`# ${inlineText(el)}`);
        break;
      case "H2":
        lines.push(`## ${inlineText(el)}`);
        break;
      case "H3":
        lines.push(`### ${inlineText(el)}`);
        break;
      case "P":
        lines.push(inlineText(el));
        break;
      case "UL":
        for (const li of Array.from(el.children)) lines.push(`- ${inlineText(li)}`);
        break;
      case "OL":
        Array.from(el.children).forEach((li, i) => lines.push(`${i + 1}. ${inlineText(li)}`));
        break;
      default:
        break;
    }
    lines.push("");
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

export function slugifyFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return slug || "document";
}
