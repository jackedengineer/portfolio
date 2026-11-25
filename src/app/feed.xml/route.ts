import { getNotes } from "@/lib/notes";
import { site } from "@content/site";

export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c);
}

export async function GET() {
  const notes = await getNotes();
  const updated = notes.reduce((latest, n) => (n.date > latest ? n.date : latest), new Date(0));
  const entries = notes
    .map((note) => {
      const url = `${site.url}/notes/${note.slug}`;
      return `  <entry>
    <title>${escapeXml(note.title)}</title>
    <link href="${escapeXml(url)}"/>
    <id>${escapeXml(url)}</id>
    <updated>${note.date.toISOString()}</updated>
    <summary>${escapeXml(note.summary)}</summary>
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(site.name)}</title>
  <subtitle>${escapeXml(site.description)}</subtitle>
  <link href="${escapeXml(site.url)}/feed.xml" rel="self"/>
  <link href="${escapeXml(site.url)}/"/>
  <id>${escapeXml(site.url)}/</id>
  <updated>${(notes.length > 0 ? updated : new Date()).toISOString()}</updated>
  <author><name>${escapeXml(site.name)}</name></author>
${entries}
</feed>
`;
  return new Response(xml, { headers: { "Content-Type": "application/atom+xml; charset=utf-8" } });
}
