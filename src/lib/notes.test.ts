import { describe, expect, it } from "vitest";

import { getNotes, noteAsMarkdown, noteNumber, parseNote } from "./notes";

const valid = `---
no: 7
title: A title
summary: A summary.
date: 2026-11-24
---

Two words.
`;

describe("parseNote", () => {
  it("reads the frontmatter and the body", () => {
    const note = parseNote("a-title", valid);
    expect(note).toMatchObject({ slug: "a-title", no: 7, title: "A title", sample: false, draft: false, body: "Two words.", minutes: 1 });
    expect(note.date.toISOString()).toBe("2026-11-24T00:00:00.000Z");
  });

  it("names the file when the frontmatter is missing", () => {
    expect(() => parseNote("oops", "Just text.")).toThrow("content/notes/oops.md has no frontmatter block");
  });

  it("names the file and the field when a value is wrong", () => {
    expect(() => parseNote("oops", valid.replace("no: 7", "no: seven"))).toThrow(/content\/notes\/oops\.md[\s\S]*no/);
  });
});

describe("the notes in content/notes", () => {
  it("all parse, are numbered once each, and come newest first", async () => {
    const notes = await getNotes();
    expect(notes.length).toBeGreaterThan(0);
    const numbers = notes.map((n) => n.no);
    expect(numbers).toEqual([...numbers].sort((a, b) => b - a));
    expect(new Set(numbers).size).toBe(numbers.length);
  });
});

describe("helpers", () => {
  it("pads the entry number", () => {
    expect(noteNumber(3)).toBe("003");
  });

  it("writes a note out as plain Markdown", () => {
    const text = noteAsMarkdown(parseNote("a-title", valid), "https://example.com/notes/a-title");
    expect(text.startsWith("# A title\n\nA summary.\n\n24 Nov 2026 · https://example.com/notes/a-title\n\nTwo words.")).toBe(true);
  });
});
