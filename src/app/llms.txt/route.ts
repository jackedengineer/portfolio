import { getNotes } from "@/lib/notes";
import { projects, site } from "@content/site";

export const dynamic = "force-static";

/* A plain index for language models: what the site is, and where each note's Markdown lives. */
export async function GET() {
  const notes = await getNotes();
  const text = `# ${site.name}

> ${site.description}

## Work

${projects.map((p) => `- ${p.name}: ${p.what}`).join("\n")}

## Notes

${notes.map((n) => `- [${n.title}](${site.url}/notes/${n.slug}.md): ${n.summary}`).join("\n")}
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
