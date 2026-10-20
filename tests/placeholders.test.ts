import { describe, it, expect } from "vitest";
import { findUnfinishedPlaceholders } from "@/lib/placeholders";

describe("findUnfinishedPlaceholders", () => {
  it("returns no matches for finished content", () => {
    const html = "<h1>Final Report</h1><p>Everything here is done.</p>";
    expect(findUnfinishedPlaceholders(html)).toEqual([]);
  });

  it("detects TODO, TBD, and XXX keywords", () => {
    const html = "<p>TODO: finish this. TBD on pricing. XXX needs review.</p>";
    const matches = findUnfinishedPlaceholders(html);
    expect(matches.map((m) => m.type)).toEqual(["TODO", "TBD", "XXX"]);
  });

  it("detects bracket-style placeholders like [CLIENT NAME]", () => {
    const html = "<p>Prepared for [CLIENT NAME] on [DATE].</p>";
    const matches = findUnfinishedPlaceholders(html);
    expect(matches.map((m) => m.text)).toEqual(["[CLIENT NAME]", "[DATE]"]);
    expect(matches[0].type).toBe("BRACKET");
  });

  it("detects mustache-style placeholders like {{stakeholder}}", () => {
    const html = "<p>Confirm scope with {{stakeholder}}.</p>";
    const matches = findUnfinishedPlaceholders(html);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ type: "MUSTACHE", text: "{{stakeholder}}" });
  });

  it("does not false-positive on ordinary words containing the keywords as substrings", () => {
    const html = "<p>Todometer and Tbdx are not real words but shouldn't match case-sensitively anyway.</p>";
    const matches = findUnfinishedPlaceholders(html);
    expect(matches).toEqual([]);
  });

  it("includes a snippet of surrounding context for each match", () => {
    const html = "<p>Sign off by [DATE] once the client confirms everything in writing.</p>";
    const matches = findUnfinishedPlaceholders(html);
    expect(matches[0].snippet).toContain("[DATE]");
  });

  it("finds multiple distinct placeholder types in one document", () => {
    const html =
      "<h1>Proposal</h1><p>Prepared for [CLIENT NAME].</p><p>TODO: fill in final budget numbers.</p>" +
      "<p>Confirm scope with {{stakeholder}}.</p><p>Sign off by [DATE].</p>";
    const matches = findUnfinishedPlaceholders(html);
    expect(matches).toHaveLength(4);
  });
});
