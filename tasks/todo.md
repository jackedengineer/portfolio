# Tasks: Studio V1

Plan: `tasks/plan.md`. Spec: `spec/SPEC-studio.md`.

Every task also meets the standing bar: `pnpm check` passes, nothing else regressed, the behaviour was run for real, and the documents it affects are updated. Tests for repository and sign-in logic are written first and seen to fail.

---

# Module 1: `content-store`

## Task 1: Database client, environment check and test database

**Description:** Add a reader that validates the environment, the `pg` client behind one `Database` type, and a helper that gives a test an in-memory database with the migrations applied. Record why the project uses Drizzle with `pg`.

**Acceptance criteria:**
- [ ] Reading the environment without `DATABASE_URL`, or with a secret shorter than 32 characters, throws an error that names the variable
- [ ] A test obtains an in-memory database and runs a query through the `Database` type
- [ ] No file outside `src/db/` imports `pg` or PGlite

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/env.test.ts src/db`
- [ ] `pnpm check`

**Dependencies:** None

**Files likely touched:**
- `src/server/env.ts`, `src/server/env.test.ts`
- `src/db/client.ts`, `src/db/testing.ts`
- `docs/decisions/ADR-001-postgres-with-drizzle-and-pg.md`

**Estimated scope:** Medium

## Task 2: Notes schema and first migration

**Description:** Define the `note`, `revision` and `redirect` tables, generate the first migration, and add the database commands. Record the working copy and revision model.

**Acceptance criteria:**
- [ ] `pnpm db:migrate` creates the three tables on an empty Postgres, and running it again changes nothing
- [ ] The database refuses a note that points at a published revision but has no entry number
- [ ] Two notes cannot share an address or an entry number

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/db/schema.test.ts`
- [ ] Manual check: `pnpm db:migrate` twice against a local Postgres 16

**Dependencies:** Task 1

**Files likely touched:**
- `src/db/schema.ts`, `src/db/schema.test.ts`
- `drizzle.config.ts`, `drizzle/0000_*.sql`
- `package.json` (the `db:` commands)
- `docs/decisions/ADR-002-working-copy-and-revisions.md`

**Estimated scope:** Medium

## Task 3: Create, publish and read notes in the repository

**Description:** Add the smallest repository path that proves the model: create a note, publish it, and read it the way the public site will. Includes generating an address from a title.

**Acceptance criteria:**
- [ ] Publishing stores a revision and assigns the next entry number, and two publishes never get the same number
- [ ] The public reads return only published notes, newest number first, with the published revision's text
- [ ] A draft's address returns nothing from the public reads

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/notes`

**Dependencies:** Task 2

**Files likely touched:**
- `src/server/notes/types.ts`, `src/server/notes/notes.ts`, `src/server/notes/notes.test.ts`
- `src/server/notes/slug.ts`, `src/server/notes/slug.test.ts`

**Estimated scope:** Medium

## Checkpoint 1a: after tasks 1 to 3

- [ ] `pnpm check` passes
- [ ] Repository tests run against the real migration, not a hand-written schema

## Task 4: Seed the sample notes

**Description:** Move the four Markdown files to `content/samples/` and add `pnpm db:seed`, which loads them as published sample notes. The frontmatter parser moves with them.

**Acceptance criteria:**
- [ ] On an empty migrated database the command creates four published notes with their numbers, dates and the sample mark
- [ ] Running it a second time changes nothing
- [ ] It refuses to run when `NODE_ENV` is `production`

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/notes/seed.test.ts`
- [ ] Manual check: run it twice against a local Postgres and compare row counts

**Dependencies:** Task 3

**Files likely touched:**
- `content/samples/*.md` (moved)
- `src/server/notes/markdown-file.ts`, `src/server/notes/seed.ts`, `src/server/notes/seed.test.ts`
- `scripts/seed.ts`, `package.json`

**Estimated scope:** Medium

## Task 5: Home page and notes index read from the database

**Description:** Turn on Cache Components, add cached public reads tagged `notes`, and switch the home page and the notes index to them. Record the caching decision.

**Acceptance criteria:**
- [ ] With a seeded database both pages list the four notes exactly as they do today
- [ ] With an empty database both pages show their empty state and `pnpm build` passes
- [ ] Neither page reads `content/` any more

**Verification:**
- [ ] Build succeeds: `pnpm build` against a seeded and an empty database
- [ ] Manual check: screenshots of both pages match the current ones

**Dependencies:** Task 4

**Files likely touched:**
- `next.config.ts`
- `src/server/notes/public.ts`
- `src/app/page.tsx`, `src/app/notes/page.tsx`
- `docs/decisions/ADR-003-tag-caching-for-public-pages.md`

**Estimated scope:** Medium

## Task 6: Note page and its Markdown copy read from the database

**Description:** Switch the note page and the `.md` route to the cached reads. This task starts by building against an empty database, which settles the first risk in the plan.

**Acceptance criteria:**
- [ ] A published note's page and `.md` copy render as they do today
- [ ] A draft's address and an unknown address return "not found" for both
- [ ] `pnpm build` passes with no published notes, and ADR-003 says how

**Verification:**
- [ ] Build succeeds: `pnpm build` against a seeded and an empty database
- [ ] Manual check: `curl -i` a published address, a draft address and each `.md` copy

**Dependencies:** Task 5

**Files likely touched:**
- `src/app/notes/[slug]/page.tsx`
- `src/app/md/[file]/route.ts`
- `src/server/notes/public.ts`

**Estimated scope:** Small

## Task 7: Feed, sitemap and `llms.txt` read from the database

**Description:** Switch the remaining public outputs to the cached reads and delete the file loader.

**Acceptance criteria:**
- [ ] The feed, the sitemap and `llms.txt` list exactly the published notes
- [ ] `src/lib/notes.ts` no longer reads files, and nothing imports a file reader at request time
- [ ] The formatting helpers the pages use keep their tests

**Verification:**
- [ ] Tests pass: `pnpm check`
- [ ] Manual check: `curl` each output against a seeded database

**Dependencies:** Task 6

**Files likely touched:**
- `src/app/feed.xml/route.ts`, `src/app/llms.txt/route.ts`, `src/app/sitemap.ts`
- `src/lib/notes.ts`, `src/lib/notes.test.ts`

**Estimated scope:** Medium

## Task 8: Browser test setup with a real Postgres

**Description:** Add Playwright with a setup step that creates an empty database, migrates, seeds, builds and starts the site. Add the first browser tests for the public pages.

**Acceptance criteria:**
- [ ] `pnpm test:e2e` passes from an empty database with one command
- [ ] A test opens the home page, a note and its `.md` copy
- [ ] A test confirms a draft's address returns "not found"

**Verification:**
- [ ] `pnpm test:e2e` against a local Postgres 16

**Dependencies:** Task 7

**Files likely touched:**
- `playwright.config.ts`, `e2e/global-setup.ts`, `e2e/public.spec.ts`
- `package.json`, `README.md`

**Estimated scope:** Medium

## Task 9: CI on pull requests

**Description:** Add a GitHub Actions workflow that runs the checks, the build and the browser tests against a Postgres 16 service.

**Acceptance criteria:**
- [ ] The workflow runs on every pull request and on pushes to `main`
- [ ] It uses throwaway test values only, and no repository secret
- [ ] It finishes in under ten minutes

**Verification:**
- [ ] Manual check: the run on pull request 1 is green

**Dependencies:** Task 8

**Files likely touched:**
- `.github/workflows/ci.yml`

**Estimated scope:** Small

## Checkpoint 1: module `content-store` complete

- [ ] Success criteria 1 and 8 hold
- [ ] `pnpm check`, `pnpm build` and `pnpm test:e2e` pass
- [ ] Code review and security review agents have reported, and required findings are fixed
- [ ] Pull request 1 is open

---

# Module 2: `owner-auth`

## Task 10: Sign-in tables and Better Auth wiring

**Description:** Add the tables Better Auth and its passkey plugin need, configure Better Auth with the Drizzle adapter, and mount its route. Record the passkey-only decision.

**Acceptance criteria:**
- [ ] The second migration adds the sign-in, passkey and rate-limit tables
- [ ] The session endpoint answers "no session" when signed out
- [ ] The app refuses to start sign-in without `BETTER_AUTH_SECRET`

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/auth`
- [ ] Manual check: `pnpm db:migrate` against a local Postgres

**Dependencies:** Task 9

**Files likely touched:**
- `src/db/auth-schema.ts`, `drizzle/0001_*.sql`
- `src/server/auth/auth.ts`, `src/server/auth/auth.test.ts`
- `src/app/api/auth/[...all]/route.ts`
- `docs/decisions/ADR-004-passkey-only-sign-in.md`

**Estimated scope:** Medium

## Task 11: Enrolment rule

**Description:** Write the rule that decides whether a passkey may be enrolled, and connect it to the passkey plugin. The tests drive the real Better Auth handler.

**Acceptance criteria:**
- [ ] A wrong token, a missing token and an unset `STUDIO_SETUP_TOKEN` are each refused
- [ ] Enrolment is refused once one passkey exists, even with the right token
- [ ] The token is compared in constant time and appears in no log line or response

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/auth/enrolment.test.ts`

**Dependencies:** Task 10

**Files likely touched:**
- `src/server/auth/enrolment.ts`, `src/server/auth/enrolment.test.ts`
- `src/server/auth/auth.ts`

**Estimated scope:** Small

## Task 12: Session guard for the studio

**Description:** Add `requireOwner()`, the guarded studio layout and a first studio page. Keep the studio out of search engines.

**Acceptance criteria:**
- [ ] Signed out, `/studio` and any page under it redirect to `/studio/sign-in`
- [ ] `requireOwner()` rejects a missing, expired or forged session
- [ ] Studio pages carry `noindex`, and `robots.txt` disallows `/studio`

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/auth/session.test.ts`
- [ ] Manual check: `curl -i /studio` signed out

**Dependencies:** Task 11

**Files likely touched:**
- `src/server/auth/session.ts`, `src/server/auth/session.test.ts`
- `src/app/studio/(guarded)/layout.tsx`, `src/app/studio/(guarded)/page.tsx`
- `src/app/robots.ts`

**Estimated scope:** Medium

## Checkpoint 2a: after tasks 10 to 12

- [ ] The abuse-case tests for enrolment and signed-out access pass

## Task 13: Sign-in and setup pages

**Description:** Build the two pages a signed-out owner sees: sign in with a passkey, and enrol the first passkey with the setup token. Add sign-out.

**Acceptance criteria:**
- [ ] The setup page enrols a passkey with the right token and lands in the studio
- [ ] The sign-in page signs in with that passkey, and sign-out ends the session
- [ ] Every failure shows a plain message, and the setup page says enrolment is closed once a passkey exists

**Verification:**
- [ ] Manual check: both flows in Chromium with a virtual authenticator
- [ ] Covered by the browser tests in task 15

**Dependencies:** Task 12

**Files likely touched:**
- `src/server/auth/client.ts`
- `src/app/studio/sign-in/page.tsx`, `src/app/studio/setup/page.tsx`
- `src/components/studio/passkey-forms.tsx`

**Estimated scope:** Medium

## Task 14: Rate limits on sign-in and enrolment

**Description:** Limit the passkey endpoints to 10 attempts per 15 minutes, counted in the database.

**Acceptance criteria:**
- [ ] The eleventh attempt inside the window is refused
- [ ] The count is stored in the database, not in memory
- [ ] An attempt after the window passes is accepted again

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/auth/rate-limit.test.ts`

**Dependencies:** Task 13

**Files likely touched:**
- `src/server/auth/auth.ts`, `src/server/auth/rate-limit.test.ts`

**Estimated scope:** Small

## Task 15: Browser tests for enrolment and sign-in

**Description:** Add browser tests that use a virtual passkey, and a shared signed-in starting point for later tests.

**Acceptance criteria:**
- [ ] Enrol, sign out and sign in pass end to end
- [ ] A wrong token and a second enrolment are refused in the browser
- [ ] A studio change replayed without the session cookie is refused, and the cookie is `httpOnly` with `sameSite=lax`

**Verification:**
- [ ] `pnpm test:e2e`

**Dependencies:** Task 14

**Files likely touched:**
- `e2e/auth.spec.ts`, `e2e/fixtures.ts`

**Estimated scope:** Small

## Task 16: Security headers

**Description:** Add the script policy and, in production, strict transport security.

**Acceptance criteria:**
- [ ] Every response carries the headers listed in the spec
- [ ] The public pages and the studio run with no policy violation in the console
- [ ] Strict transport security is sent only in production

**Verification:**
- [ ] `pnpm test:e2e` (a headers test, and no console violations in any test)

**Dependencies:** Task 15

**Files likely touched:**
- `next.config.ts`, `e2e/headers.spec.ts`

**Estimated scope:** Small

## Task 17: Passkey reset script

**Description:** Add `pnpm studio:reset`, which deletes every passkey and session so enrolment reopens.

**Acceptance criteria:**
- [ ] After the script, the enrolment rule allows one new passkey
- [ ] Existing sessions stop working
- [ ] The script prints what it removed and no secret

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/auth/reset.test.ts`

**Dependencies:** Task 16

**Files likely touched:**
- `src/server/auth/reset.ts`, `src/server/auth/reset.test.ts`
- `scripts/studio-reset.ts`, `package.json`, `README.md`

**Estimated scope:** Small

## Checkpoint 2: module `owner-auth` complete

- [ ] Success criteria 2, 3, 15 and 16 hold
- [ ] `pnpm check`, `pnpm build` and `pnpm test:e2e` pass
- [ ] Review agents have reported, and required findings are fixed
- [ ] Pull request 2 is open

---

# Module 3: `studio-editor`

## Task 18: Note list and new note

**Description:** Show every note in the studio with its state, and add the button that creates a draft and opens it.

**Acceptance criteria:**
- [ ] The list shows each note's title, state (draft, published, unpublished changes) and last edit, most recent first, with an empty state when there are none
- [ ] "New note" creates a draft with a free address and opens it
- [ ] The create action refuses when signed out

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/notes`
- [ ] `pnpm test:e2e`

**Dependencies:** Task 17

**Files likely touched:**
- `src/server/notes/notes.ts`, `src/server/notes/notes.test.ts`
- `src/app/studio/actions.ts`
- `src/app/studio/(guarded)/page.tsx`, `src/components/studio/note-list.tsx`

**Estimated scope:** Medium

## Task 19: Save a draft with a version check

**Description:** Add the save path: parse the input, write it only if the note's version still matches, and log one line.

**Acceptance criteria:**
- [ ] A save with the current version stores the fields and raises the version by one
- [ ] A save with an old version is refused and the stored text is unchanged
- [ ] Oversized or malformed input is refused, and the log line holds the note id and outcome but no note text

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/notes src/app/studio`

**Dependencies:** Task 18

**Files likely touched:**
- `src/server/notes/notes.ts`, `src/server/notes/notes.test.ts`
- `src/server/notes/input.ts`
- `src/app/studio/actions.ts`, `src/server/log.ts`

**Estimated scope:** Medium

## Task 20: Editor page with autosave

**Description:** Build the editor page with the note's fields and a plain text area, driven by the autosave state machine.

**Acceptance criteria:**
- [ ] Text is saved within about a second of pausing, the status says so, and a reload shows it
- [ ] A refused save shows the conflict state, keeps the local text on screen and overwrites nothing
- [ ] Leaving with unsaved text asks first

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/components/studio/autosave.test.ts`
- [ ] `pnpm test:e2e`, including a second tab that makes the first one stale

**Dependencies:** Task 19

**Files likely touched:**
- `src/app/studio/(guarded)/notes/[id]/page.tsx`
- `src/components/studio/note-editor.tsx`
- `src/components/studio/autosave.ts`, `src/components/studio/autosave.test.ts`
- `e2e/editor.spec.ts`

**Estimated scope:** Medium

## Checkpoint 3a: after tasks 18 to 20

- [ ] A note can be created, typed into and reloaded with its text intact

## Task 21: CodeMirror editor

**Description:** Replace the text area with CodeMirror, loaded only inside the studio, with shortcuts and buttons for the blocks notes use.

**Acceptance criteria:**
- [ ] Undo, redo, bold, italic and link work from the keyboard, and buttons insert a TL;DR, a margin note and a code sample
- [ ] The editor has a label, and the keyboard can leave it without a mouse
- [ ] Autosave behaves exactly as in task 20

**Verification:**
- [ ] `pnpm test:e2e`
- [ ] Manual check: keyboard-only pass through the editor

**Dependencies:** Task 20

**Files likely touched:**
- `src/components/studio/markdown-editor.tsx`, `src/components/studio/editor-commands.ts`
- `src/components/studio/note-editor.tsx`

**Estimated scope:** Medium

## Task 22: Live preview from the public renderer

**Description:** Show the working text rendered by the same code as the public page, beside the editor on wide screens and as a second tab on narrow ones.

**Acceptance criteria:**
- [ ] The preview's output for a note equals the public page's output for the same text
- [ ] The preview follows the text within about half a second of pausing
- [ ] Below 1024 pixels the editor and preview are two tabs

**Verification:**
- [ ] `pnpm test:e2e`
- [ ] Manual check: screenshots at 390 and 1440 pixels

**Dependencies:** Task 21

**Files likely touched:**
- `src/app/studio/actions.ts`
- `src/components/studio/preview.tsx`, `src/components/studio/note-editor.tsx`
- `src/app/globals.css`

**Estimated scope:** Medium

## Task 23: Revisions taken while editing

**Description:** Make the save path store a revision when the last one is more than ten minutes old.

**Acceptance criteria:**
- [ ] Two saves a minute apart leave one revision
- [ ] Two saves eleven minutes apart leave two
- [ ] A save that changes nothing leaves none

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/notes` (the clock is passed in)

**Dependencies:** Task 22

**Files likely touched:**
- `src/server/notes/notes.ts`, `src/server/notes/notes.test.ts`

**Estimated scope:** Small

## Task 24: History panel with view and restore

**Description:** List a note's revisions, show any of them rendered, and restore one.

**Acceptance criteria:**
- [ ] The panel lists every revision with its time and why it was taken, and shows the selected one rendered
- [ ] Restoring replaces the working text, and the replaced text is stored as a revision first
- [ ] A restore from a stale tab is refused

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/notes`
- [ ] `pnpm test:e2e`

**Dependencies:** Task 23

**Files likely touched:**
- `src/server/notes/notes.ts`, `src/server/notes/notes.test.ts`
- `src/app/studio/actions.ts`
- `src/components/studio/history.tsx`, `e2e/history.spec.ts`

**Estimated scope:** Medium

## Task 25: Keyboard, screen-size and accessibility pass

**Description:** Check the sign-in, setup, list and editor pages with axe, the keyboard and four screen widths, and fix what is found.

**Acceptance criteria:**
- [ ] axe reports no serious or critical violation on the four pages
- [ ] Every control is reachable and usable from the keyboard, with a visible focus mark
- [ ] The pages hold together at 320, 768, 1024 and 1440 pixels

**Verification:**
- [ ] `pnpm test:e2e` (an accessibility test per page)
- [ ] Manual check: screenshots at the four widths

**Dependencies:** Task 24

**Files likely touched:**
- `e2e/a11y.spec.ts`
- Studio components, as the findings require

**Estimated scope:** Medium

## Checkpoint 3: module `studio-editor` complete

- [ ] Success criteria 4, 5, 6, 10, 13 and 14 hold
- [ ] `pnpm check`, `pnpm build` and `pnpm test:e2e` pass
- [ ] Review agents, including the accessibility agent, have reported, and required findings are fixed
- [ ] Pull request 3 is open

---

# Module 4: `publishing`

## Task 26: Publish and republish from the studio

**Description:** Add the publish action and the bar that shows a note's state. Publishing refreshes the `notes` cache tag.

**Acceptance criteria:**
- [ ] Within five seconds of publishing, the note page, the notes index, the home page, the feed, the sitemap, `llms.txt` and the `.md` copy show the note
- [ ] Editing a published note leaves all of those unchanged, and the studio says there are unpublished changes
- [ ] Publishing again updates them and keeps the entry number

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/notes`
- [ ] `pnpm test:e2e`

**Dependencies:** Task 25

**Files likely touched:**
- `src/server/notes/notes.ts`, `src/server/notes/notes.test.ts`
- `src/app/studio/actions.ts`
- `src/components/studio/publish-bar.tsx`, `e2e/publish.spec.ts`

**Estimated scope:** Medium

## Task 27: Unpublish

**Description:** Add the action that takes a note off the public site.

**Acceptance criteria:**
- [ ] Within five seconds the note's address returns "not found" and it is gone from every public list
- [ ] The note keeps its entry number and gets it back when published again
- [ ] The action asks for confirmation and refuses when signed out

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/notes`
- [ ] `pnpm test:e2e`

**Dependencies:** Task 26

**Files likely touched:**
- `src/server/notes/notes.ts`, `src/server/notes/notes.test.ts`
- `src/app/studio/actions.ts`, `src/components/studio/publish-bar.tsx`
- `e2e/publish.spec.ts`

**Estimated scope:** Small

## Task 28: Change a published note's address

**Description:** Add the action that changes a note's address and writes a redirect, and make the public note route follow redirects.

**Acceptance criteria:**
- [ ] The old address answers with a permanent redirect to the new one
- [ ] An address used by another note or another note's redirect is refused, and nothing changes
- [ ] Changing an address back removes the redirect that would loop

**Verification:**
- [ ] Tests pass: `pnpm vitest run src/server/notes`
- [ ] `pnpm test:e2e`

**Dependencies:** Task 27

**Files likely touched:**
- `src/server/notes/notes.ts`, `src/server/notes/notes.test.ts`
- `src/app/notes/[slug]/page.tsx`
- `src/app/studio/actions.ts`, `src/components/studio/publish-bar.tsx`

**Estimated scope:** Medium

## Checkpoint 4a: after tasks 26 to 28

- [ ] Success criteria 7, 9 and 11 hold in the browser tests

## Task 29: Release checks and setup instructions

**Description:** Add the script-weight check, triage the dependency audit, and write the setup instructions.

**Acceptance criteria:**
- [ ] A check fails when a public page loads more than 2 kB above today's 134 kB of script, and passes now
- [ ] `pnpm audit --prod` shows no high or critical finding that is not explained in `docs/decisions/`
- [ ] The README covers the environment variables, migrating, seeding, enrolling a passkey and resetting

**Verification:**
- [ ] `node scripts/measure-public-js.mjs` against the built site
- [ ] `pnpm audit --prod`

**Dependencies:** Task 28

**Files likely touched:**
- `scripts/measure-public-js.mjs`, `.github/workflows/ci.yml`
- `README.md`, `.env.example`

**Estimated scope:** Small

## Checkpoint 4: Studio V1 complete

- [ ] All 18 success criteria hold, or are listed as unverified with the reason
- [ ] `pnpm check`, `pnpm build` and `pnpm test:e2e` pass
- [ ] Review agents have reported, and required findings are fixed
- [ ] Pull request 4 is open
