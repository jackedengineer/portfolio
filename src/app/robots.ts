import type { MetadataRoute } from "next";

import { site } from "@content/site";

/* Everything is open to every crawler, search and AI alike. Narrow this here if you decide otherwise. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: `${site.url}/sitemap.xml` };
}
