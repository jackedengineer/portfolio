# jackedengineer

The portfolio and notes site. Next.js 16, React 19, Tailwind CSS 4, TypeScript.

```bash
pnpm install
```

```bash
pnpm dev
```

```bash
pnpm check
```

`pnpm check` runs the linter, the type checker and the tests. `pnpm build` makes the production build; every page is prerendered.

## Where things are

| What | Where |
| --- | --- |
| Your name, links, lifts and the four projects | `content/site.ts` |
| Notes, one Markdown file each | `content/notes/` |
| Colours, typefaces and motion (the whole look) | `src/styles/theme.css` |
| Shared styles built from those tokens | `src/app/globals.css` |
| Pages | `src/app/` |
| Markdown rendering | `src/lib/markdown.tsx` |

## Writing a note

Add `content/notes/<address>.md`. The file name becomes the address, so use lowercase words joined by hyphens.

```md
---
no: 5
title: The title
summary: One sentence that says what the note is about.
date: 2026-12-01
topic: Data model
project: Merge
---

:::tldr
Two or three sentences that give the answer.
:::

Body text in ordinary Markdown.

:::aside
a short handwritten margin note, placed beside the paragraph above it
:::
```

Set `draft: true` to keep a note out of the built site while you work on it. `sample: true` marks a placeholder and shows a "Sample" tag.

Each note is also served as plain Markdown at `/notes/<address>.md`, and listed in `/feed.xml`, `/sitemap.xml` and `/llms.txt`.

## Before going live

- Set `NEXT_PUBLIC_SITE_URL` to the real address.
- Fill in `email`, `resume` and `lifts` in `content/site.ts`.
- Replace the four sample notes.
