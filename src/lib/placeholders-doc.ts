import type { Node as PMNode } from "@tiptap/pm/model";
import { PLACEHOLDER_PATTERNS } from "./placeholders";

/**
 * Finds the first unfinished placeholder directly in the live ProseMirror
 * document (not the saved HTML), returning real document positions so the
 * caller can select/scroll to it. Block boundaries are joined with a space
 * that none of our patterns can match, so a placeholder never appears to
 * span across two separate paragraphs/headings/list items.
 */
export function findFirstPlaceholderPosition(doc: PMNode): { from: number; to: number } | null {
  let text = "";
  const positionAt: number[] = [];

  doc.descendants((node, pos) => {
    if (node.isText) {
      const nodeText = node.text ?? "";
      for (let i = 0; i < nodeText.length; i++) positionAt.push(pos + i);
      text += nodeText;
    } else if (node.isBlock && text.length > 0) {
      positionAt.push(pos);
      text += " ";
    }
    return true;
  });

  let earliest: { index: number; length: number } | null = null;
  for (const { regex } of PLACEHOLDER_PATTERNS) {
    // matchAll (not match/exec) - these regex objects are global-flagged and
    // shared, and matchAll is the one API that reads from the start every
    // time without needing a manual lastIndex reset.
    const [first] = text.matchAll(regex);
    if (first && first.index !== undefined && (!earliest || first.index < earliest.index)) {
      earliest = { index: first.index, length: first[0].length };
    }
  }

  if (!earliest) return null;

  const from = positionAt[earliest.index];
  const to = positionAt[earliest.index + earliest.length - 1] + 1;
  return { from, to };
}
