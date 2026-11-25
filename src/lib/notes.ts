import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

/*
  Notes are Markdown files in content/notes. The file name is the address.
  This module is the only place that knows where notes are stored, so moving
  them into a database later means replacing these two functions and nothing else.
*/

const NOTES_DIR = path.join(process.cwd(), "content", "notes");

const frontmatterSchema = z.object({
  /** The entry number shown as "No. 003". */
  no: z.number().int().positive(),
  title: z.string().min(1),
  summary: z.string().min(1),
  date: z.coerce.date(),
  topic: z.string().min(1).optional(),
  project: z.string().min(1).optional(),
  /** A placeholder entry. Shown with a "Sample" tag until it is replaced. */
  sample: z.boolean().default(false),
  /** Visible while developing, left out of the built site. */
  draft: z.boolean().default(false),
});

export type Note = z.infer<typeof frontmatterSchema> & {
  slug: string;
  /** The Markdown after the frontmatter. */
  body: string;
  minutes: number;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseNote(slug: string, source: string): Note {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!match) throw new Error(`content/notes/${slug}.md has no frontmatter block`);
  const parsed = frontmatterSchema.safeParse(parseYaml(match[1]));
  if (!parsed.success) {
    throw new Error(`content/notes/${slug}.md: ${z.prettifyError(parsed.error)}`);
  }
  const body = match[2].trim();
  const words = body.split(/\s+/).filter(Boolean).length;
  return { ...parsed.data, slug, body, minutes: Math.max(1, Math.round(words / 220)) };
}

/** Every note that should be visible, newest entry first. */
export const getNotes = cache(async (): Promise<Note[]> => {
  const files = (await fs.readdir(NOTES_DIR)).filter((f) => f.endsWith(".md"));
  const notes = await Promise.all(
    files.map(async (file) => {
      const slug = file.slice(0, -3);
      if (!SLUG.test(slug)) throw new Error(`content/notes/${file}: use lowercase words joined by hyphens`);
      return parseNote(slug, await fs.readFile(path.join(NOTES_DIR, file), "utf8"));
    }),
  );
  const visible = process.env.NODE_ENV === "production" ? notes.filter((n) => !n.draft) : notes;
  const numbers = new Set<number>();
  for (const note of visible) {
    if (numbers.has(note.no)) throw new Error(`Two notes share the number ${note.no}`);
    numbers.add(note.no);
  }
  return visible.sort((a, b) => b.no - a.no);
});

export async function getNote(slug: string): Promise<Note | undefined> {
  return (await getNotes()).find((n) => n.slug === slug);
}

export function noteNumber(no: number): string {
  return String(no).padStart(3, "0");
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

/** The note as plain Markdown, for the ".md" twin and for "Copy as Markdown". */
export function noteAsMarkdown(note: Note, url: string): string {
  return `# ${note.title}\n\n${note.summary}\n\n${formatDate(note.date)} · ${url}\n\n${note.body}\n`;
}
