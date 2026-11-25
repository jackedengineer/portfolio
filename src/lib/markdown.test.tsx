import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { renderMarkdown } from "./markdown";

async function html(markdown: string): Promise<string> {
  return renderToStaticMarkup((await renderMarkdown(markdown)).content);
}

describe("renderMarkdown", () => {
  it("renders the TL;DR block", async () => {
    const out = await html(":::tldr\nOne row, three states.\n:::");
    expect(out).toContain('class="note-tldr"');
    expect(out).toContain("One row, three states.");
  });

  it("renders a margin note as an aside", async () => {
    const out = await html("A paragraph.\n\n:::aside\nhistory is never rewritten\n:::");
    expect(out).toContain('<aside class="note-aside"');
    expect(out).toContain("history is never rewritten");
  });

  it("prints an unknown block as the text it was", async () => {
    const out = await html(":::danger\nboom\n:::");
    expect(out).not.toContain("<danger");
    expect(out).toContain(":::danger");
    expect(out).toContain("boom");
  });

  it("keeps prose that only looks like a directive", async () => {
    expect(await html("Store it as key:value pairs.")).toContain("key:value pairs.");
  });

  it("drops raw HTML instead of running it", async () => {
    const out = await html('Hello <script>alert(1)</script> <b onclick="steal()">there</b>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("onclick");
  });

  it("gives a code sample its file name, a copy button and highlighting", async () => {
    const out = await html('```ts title="src/schema.ts"\nexport const a = "b"; // note\n```');
    expect(out).toContain("src/schema.ts");
    expect(out).toContain("Copy");
    expect(out).toContain("--code-token-string");
    expect(out.match(/<pre/g)).toHaveLength(1);
  });

  it("falls back to plain text for a language it does not know", async () => {
    const out = await html("```brainfuck\n+++.\n```");
    expect(out).toContain("+++.");
  });

  it("lists second-level headings for the table of contents", async () => {
    const { toc } = await renderMarkdown("## What a request stores\n\nText.\n\n### Detail\n\n## Merging creates the match");
    expect(toc).toEqual([
      { id: "what-a-request-stores", text: "What a request stores" },
      { id: "merging-creates-the-match", text: "Merging creates the match" },
    ]);
  });
});
