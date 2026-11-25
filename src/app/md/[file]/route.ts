import { getNote, getNotes, noteAsMarkdown } from "@/lib/notes";
import { site } from "@content/site";

/* The plain Markdown twin of a note, served at /notes/<slug>.md (see the rewrite in next.config.ts). */

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getNotes()).map((note) => ({ file: `${note.slug}.md` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const note = file.endsWith(".md") ? await getNote(file.slice(0, -3)) : undefined;
  if (!note) return new Response("Not found", { status: 404 });
  return new Response(noteAsMarkdown(note, `${site.url}/notes/${note.slug}`), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
