# Spec: Studio V1

Status: proposed, waiting for review

## Objective

The owner writes, edits and publishes notes from the browser. A published note shows on the public site within seconds, with no deploy. Every note keeps its history.

There is one user: the site owner. Readers never see the studio and never see a draft.

This is stage 2 of the build plan. Stage 1 (the public site, reading notes from Markdown files) is on `main`.

## Capability map

| Module id | Responsibility | Depends on |
| --- | --- | --- |
| `content-store` | Postgres schema and migrations, the notes repository, loading the sample notes, public pages reading published notes from the database | — |
| `owner-auth` | One owner, passkey sign-in, one-time enrolment, sessions, guarding everything under `/studio` | `content-store` |
| `studio-editor` | Note list, editor with live preview, autosave, version history and restore | `content-store`, `owner-auth` |
| `publishing` | Publish and unpublish, changing a note's address with a redirect, refreshing cached public pages | `studio-editor` |

Build order: `content-store`, then `owner-auth`, then `studio-editor`, then `publishing`.

The four modules are covered by this one spec because they serve a single flow for a single user and share one data model. Each is built and verified on its own, in the order above.

## Assumptions

Correct any of these and the spec changes before any code does.

1. **Database.** Postgres on Neon, reached through `DATABASE_URL` with the `pg` driver, the same way Perplex does it. Tests need no database server: they run the real migrations against PGlite in memory.
2. **Sign-in.** Better Auth with its passkey plugin. Exactly one owner. No passwords and no email.
3. **First passkey.** Enrolled once at `/studio/setup` with a `STUDIO_SETUP_TOKEN` that only exists in the environment. Enrolment closes as soon as one passkey exists. If the passkey is lost, a script run with database access reopens enrolment.
4. **Drafts and published notes.** Editing a published note changes a working copy. The public page changes only when you publish again.
5. **Entry numbers.** "No. 005" is assigned the first time a note is published, so abandoned drafts leave no gaps.
6. **Sample notes.** The four Markdown files become seed data for local development only. They are never loaded into production.
7. **Look.** The studio uses the site's design tokens in a plain tool layout, without the handwriting and highlighter flourishes.
8. **Hosting.** Vercel, with the environment variables listed under Commands.

## What is stored

- **note**: the working copy (title, summary, address, topic, project, body), its status (draft or published), its entry number once published, and a version counter used to refuse a save that would overwrite newer text.
- **revision**: a frozen copy of a note at a moment. One is taken on every publish, before every restore, and at most once every ten minutes while editing. The public site reads the revision marked as published, never the working copy.
- **redirect**: an old address and the note it now belongs to.
- **Sign-in tables** owned by Better Auth: user, session, account, verification, passkey.

## Security

Approving this spec approves a new sign-in flow and the storage of sign-in data (passkey public keys and sessions).

- **Session cookie.** `httpOnly`, `secure` in production, `sameSite=lax`, seven-day lifetime. The signing secret comes from the environment and the app refuses to start without it.
- **Setup token.** At least 32 characters, compared in constant time, never logged or returned. It works once, because enrolment closes when the first passkey exists. An environment variable cannot expire by itself, so the instructions say to remove it after enrolling.
- **Rate limits.** Sign-in and enrolment allow 10 attempts per 15 minutes, counted in the database so the limit holds on serverless hosting.
- **Server actions.** Each one checks the session, parses its input and returns a generic error. No stack trace reaches the browser.
- **Note content.** Never evaluated. Raw HTML in Markdown is dropped, as it is today.
- **SQL.** Only through Drizzle's query builder, so every value is a parameter.
- **Headers.** The four in place today, plus `Strict-Transport-Security` in production and a `Content-Security-Policy` that limits scripts, frames, forms and the base address to the site itself.
- **Logging.** One structured line per studio change with an event name, the note id and the outcome. Never note text, tokens or cookies.
- **Dependencies.** Install scripts stay blocked. `pnpm audit --prod` runs before each release and every high or critical finding is fixed or explained in writing.

## Tech stack

Already in the project: Next.js 16.4, React 19.3, TypeScript 6, Tailwind CSS 4, Vitest 5, unified and Shiki for Markdown.

Added in V1, all pinned to exact versions:

| Purpose | Package |
| --- | --- |
| Database access and migrations | `drizzle-orm` 0.45.4, `drizzle-kit` 0.31.11, `pg` 8.23.1, `@types/pg` |
| Sign-in | `better-auth` 1.7.28, `@better-auth/passkey`, `@better-auth/drizzle-adapter` |
| Editor | CodeMirror 6 (`@codemirror/state`, `view`, `commands`, `language`, `lang-markdown`, `@lezer/highlight`) |
| Keeping server code out of the browser bundle | `server-only` |
| Running the seed and reset scripts | `tsx` |
| Tests | `@electric-sql/pglite` (in-memory Postgres), `@playwright/test` (browser tests, not installed yet) |

Public pages are cached with Next.js Cache Components (`'use cache'` and `cacheTag`) and refreshed with `updateTag` when a note is published.

## Commands

```bash
pnpm dev            # the site and the studio, needs DATABASE_URL
pnpm build          # production build
pnpm check          # lint, type check, unit and integration tests
pnpm test:e2e       # browser tests against a real Postgres
pnpm db:generate    # write a migration after changing the schema
pnpm db:migrate     # apply migrations to DATABASE_URL
pnpm db:seed        # load the sample notes, safe to run twice
pnpm studio:reset   # delete all passkeys so enrolment reopens
```

Environment variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `STUDIO_SETUP_TOKEN`, `NEXT_PUBLIC_SITE_URL`. `.env.example` documents each one. Real values never enter the repository.

## Project structure

```
spec/                  this spec and later ones
tasks/                 the plan and task list for the current spec
docs/decisions/        one short record per architecture decision
drizzle/               generated SQL migrations
content/samples/       the sample notes, used only by db:seed
src/db/                schema and the database client
src/server/notes/      every read and write of notes, and nothing else touches the tables
src/server/auth/       Better Auth setup, the session check, the enrolment rule
src/app/studio/        studio pages and their server actions
src/components/studio/ editor, preview, history
e2e/                   browser tests
```

## Code style

Data functions take the database handle first, so tests can pass an in-memory one. A failure the caller is expected to handle is returned as a value. Anything else throws.

```ts
export type SaveResult =
  | { ok: true; version: number; savedAt: Date }
  | { ok: false; reason: "conflict"; currentVersion: number }
  | { ok: false; reason: "not-found" };

export async function saveDraft(db: Database, input: DraftInput): Promise<SaveResult> {
  const [row] = await db
    .update(notes)
    .set({ ...input.fields, version: sql`${notes.version} + 1`, updatedAt: new Date() })
    .where(and(eq(notes.id, input.id), eq(notes.version, input.baseVersion)))
    .returning({ version: notes.version, savedAt: notes.updatedAt });
  if (row) return { ok: true, ...row };
  return describeFailedSave(db, input.id);
}
```

- Input from the browser is parsed with zod at the server action and nowhere deeper.
- Every server action and route under `/studio` checks the session itself. The layout check alone is not trusted.
- Named exports. Default exports only where Next.js requires them.
- Comments say why, never what. A pattern taken from a library's documentation carries a link to the page.
- Existing conventions stay: exact dependency versions, `pnpm check` clean, zero lint warnings.

## Testing strategy

Tests are written first for repository and auth logic: a failing test, then the code that passes it.

| Level | Tool | Covers |
| --- | --- | --- |
| Unit | Vitest | Address generation, input validation, Markdown rendering |
| Integration | Vitest with PGlite and the real migrations | Create, save, the save conflict, when revisions are taken, entry numbering, publish, unpublish, redirects, seed running twice, the enrolment rule |
| Browser | Playwright with a virtual passkey and a real Postgres | Enrol, sign in, write, autosave, publish, read it on the public page, edit without the public page changing, republish, restore a version, signed-out access refused |

Tests assert on behaviour a user or caller can see, not on internals.

The abuse cases are the first tests written: a change attempted while signed out, a wrong setup token, a second enrolment, a save from a stale tab, and a guessed draft address.

## Boundaries

**Always**

- Run `pnpm check` before every commit.
- Check the session inside every studio server action and route.
- Parse every input that crosses from the browser.
- Generate migrations with `drizzle-kit` and commit them.
- Keep changes in small commits that each build and pass on their own.
- Write commit messages as `<type>: <summary>` with a body that says why. Types are feat, fix, refactor, test, docs and chore.
- Record each architecture decision in `docs/decisions/` in the same change that makes it.

**Ask first**

- Adding a dependency that is not in the table above.
- Changing the schema once a migration has run against production.
- Adding or changing CI or deployment configuration.
- Anything that sends data to a third party.

**Never**

- Commit a secret, or log a token, a session cookie or the setup token.
- Evaluate note content. Raw HTML stays dropped and there is no MDX.
- Let a public page read a draft or a working copy.
- Weaken, skip or delete a failing test to get a green run.
- Add `@ts-ignore`, `eslint-disable` or an empty `catch` to silence a check.
- Send code or note text to another company's model or service.
- Push straight to `main`.

## Success criteria

1. On an empty Postgres, `pnpm db:migrate` then `pnpm db:seed` gives a site showing the four sample notes. Running both again changes nothing.
2. Signed out, every page under `/studio` sends you to sign-in and every studio server action refuses.
3. Enrolment succeeds once with the right token, is refused with a wrong one, and is closed after the first passkey exists.
4. Text typed in the editor is saved within about a second of pausing, and a reload shows it. The editor always says whether the text is saved.
5. A save from a stale tab is refused and overwrites nothing.
6. The preview is produced by the same renderer as the public page and follows the text within about half a second of pausing.
7. After publishing, the note page, the notes index, the home page, the feed, the sitemap, `llms.txt` and the `.md` copy all reflect it within five seconds, with no deploy.
8. A draft's address returns "not found" publicly.
9. Editing a published note leaves the public page unchanged until it is published again, and the studio shows that there are unpublished changes.
10. Every version in a note's history can be viewed and restored, and restoring never loses the text it replaces.
11. After a published note's address changes, the old address redirects permanently to the new one.
12. Public pages load no editor code: their script weight stays within 2 kB of today's 134 kB.
13. The studio works with the keyboard alone and has no serious or critical axe violations.
14. The studio is usable at 320, 768, 1024 and 1440 pixels wide.
15. The eleventh sign-in attempt within 15 minutes is refused.
16. Responses carry the headers listed under Security.
17. `pnpm audit --prod` reports no high or critical finding that is not explained in `docs/decisions/`.
18. `pnpm check`, `pnpm build` and `pnpm test:e2e` pass.

Screen-reader behaviour cannot be tested from the build environment. It is listed as unverified until you try it with VoiceOver.

## Decisions to record

Each gets a short record in `docs/decisions/` when it is built: the database driver and ORM, passkey-only sign-in for one owner, the working copy and published revision model, and tag-based caching of public pages.

## Where the installed skills disagree

The two engineering skill sets contradict each other in places. These are the rules this spec follows unless you choose otherwise.

| Topic | agent-skills says | pstack says | This spec follows |
| --- | --- | --- | --- |
| Stopping for approval | You approve the spec, the plan, each checkpoint and each merge | Keep going on anything reversible, pause only for irreversible actions | Open question 5 |
| Tests | A failing test first for all logic | Only when cheap, and no test beats a bad test | Test first for repository and sign-in logic, browser tests for the main path, no tests of internals |
| Comments | Explain why, cite documentation | Delete nearly every comment | Why-comments stay |
| Rows read from the database | Trust them | Parse them again | Trust the types Drizzle derives from the schema |
| Review by other vendors' models | Ask every time | Do it unasked | Not done |

## Out of scope (deferred)

- **Image upload.** Needs a storage service and its credentials.
- **Git mirror** of published notes back to the repository. Needs a GitHub token.
- **Live-preview editing** in a single pane. The split view comes first.
- **AI features**: voice profile, review notes, TL;DR, diagrams. That is stage 3.
- **Managing several passkeys** in the studio. V1 has the reset script.
- **Scheduled publishing, tags, search.**
- **Crawler and referral dashboard.** That is stage 5.
- **A stricter script policy with per-request nonces.** It would stop public pages from being prebuilt.

## Open questions

1. **Local database.** Is it acceptable that `pnpm dev` needs a `DATABASE_URL` (a Neon branch or a local Postgres)? The alternative is an embedded database for development, which means a second code path that production never runs.
2. **CI.** Should V1 add a GitHub Actions workflow that runs `pnpm check`, `pnpm build` and the browser tests on every pull request?
3. **Image storage, for the follow-up.** Vercel Blob or Cloudflare R2? This does not block V1.
4. **One spec or four.** Is one spec for the four modules right, or do you want each module specified and approved separately?
5. **How often to stop.** The proposal: you approve this spec, then the plan. After that each module is built without stopping, reviewed by the code and security review agents, and opened as one pull request for you to merge. Work pauses in between only for something irreversible or something this spec does not cover. Is that the right amount of checking, or do you want more stops or fewer?
