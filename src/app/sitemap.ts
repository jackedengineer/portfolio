import type { MetadataRoute } from "next";

import { getNotes } from "@/lib/notes";
import { site } from "@content/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const notes = await getNotes();
  return [
    { url: `${site.url}/` },
    { url: `${site.url}/notes` },
    ...notes.map((note) => ({ url: `${site.url}/notes/${note.slug}`, lastModified: note.date })),
  ];
}
