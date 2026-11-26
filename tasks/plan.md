# Implementation plan: Studio V1

Source spec: `spec/SPEC-studio.md` (approved 2026-11-26)

Tasks are in `tasks/todo.md`.

## Overview

The site moves from Markdown files to a Postgres database, gains passkey sign-in for one owner, and gets a studio at `/studio` for writing, versioning and publishing notes. The work is 29 tasks in four modules. Each module is built on its own branch, reviewed, and opened as one pull request.

## Versions this plan was checked against

Read from `package.json`: Next.js 16.4.6, React 19.3.1, drizzle-orm 0.45.4, drizzle-kit 0.31.11, pg 8.23.1, better-auth 1.7.28 with `@better-auth/passkey` 1.7.28, Vitest 5.0.5.

Facts confirmed in the packages' own documentation and type definitions before planning:

- `updateTag` refreshes a cache tag from a server action so the next request waits for fresh data. `cacheTag` needs `cacheComponents: true` in `next.config.ts`.
- With Cache Components, the route segment settings `dynamic` and `revalidate` are removed, and `generateStaticParams` must return at least one address.
- `export const instant = false` lets a segment wait on request data, which is what the signed-in studio needs.
- The passkey plugin can enrol a passkey without a session: `registration.requireSession: false` with a `resolveUser` callback that receives a `context` string from the browser.

Every other library pattern is checked against its documentation in the task that first uses it, and the code links to the page.

## Architecture decisions

1. **One database type for both drivers.** Every data function takes a `Database` handle as its first argument. Production passes a `pg` pool, tests pass in-memory PGlite. Nothing else imports a driver.
2. **Working copy plus frozen revisions.** A note row holds the text being edited. A revision row is a frozen copy. A note is published when it points at a revision, so there is no status column to keep in step. The alternative, storing every autosave as a revision, was rejected because one writing session would add hundreds of rows.
3. **Entry numbers are assigned inside the publish transaction**, guarded by a unique constraint. Unpublishing keeps the number.
4. **A published note's address is not part of the working copy.** It changes through its own action, which writes a redirect in the same transaction.
5. **One cache tag, `notes`, for all public reads.** Every action that changes what readers see calls `updateTag("notes")`. With a few dozen notes, finer tags would add risk and save nothing.
6. **The studio is never cached.** Its segment sets `instant = false`. One function, `requireOwner()`, checks the session, and every studio page and server action calls it.
7. **Enrolment is a rule, tested apart from the page.** The rule takes the configured token, the submitted token and the number of passkeys, and answers yes or no.
8. **The preview is the public renderer.** A server action runs `renderMarkdown` on the working text and returns the result. If server actions cannot return rendered elements well enough, the fallback is a preview page in a frame.
9. **Autosave is a small state machine in the browser** with the states saved, dirty, saving, conflict and failed. The server accepts a save only if the note's version still matches the one the browser started from.
10. **Each decision is written down when it is built**, in `docs/decisions/`: the driver and ORM (task 1), the revision model (task 2), tag caching (task 5), passkey-only sign-in (task 10).

## Threat model

**Worth protecting:** the ability to publish on the site, unpublished drafts, session and passkey records, the setup token, the database credentials.

**Trust boundaries:** browser to server actions and routes, reader to cached public pages, server to Postgres, CI and build environment to secrets.

| Threat | Answer | Proved by |
| --- | --- | --- |
| A change sent to a server action while signed out | `requireOwner()` in every action | Task 12, task 15 |
| Someone enrols their own passkey | Setup token, constant-time compare, closed after the first passkey | Task 11 |
| Guessing at sign-in or enrolment | 10 attempts per 15 minutes, counted in the database | Task 14 |
| A draft leaking through a public page, the feed or the cache | Public reads select only the published revision | Tasks 3, 6, 7 |
| A stale tab overwriting newer text | Version check on every save | Task 19 |
| Script injected through note text | Markdown is never evaluated and raw HTML is dropped | Existing renderer tests |
| A forged cross-site request | `sameSite=lax` cookie, origin checks in Next.js server actions and Better Auth | Task 15 |
| A secret in the repository or the logs | Environment only, validated at start, secrets grep before each commit, logs carry ids and outcomes only | Tasks 1, 19 |
| A hostile dependency | Exact versions, install scripts blocked, audit before release | Task 29 |

## Task list

### Module 1: `content-store` (branch `feature/content-store`)

- [ ] Task 1: Database client, environment check and test database
- [ ] Task 2: Notes schema and first migration
- [ ] Task 3: Create, publish and read notes in the repository

#### Checkpoint 1a

- [ ] `pnpm check` passes and the repository tests run against the real migration

- [ ] Task 4: Seed the sample notes
- [ ] Task 5: Home page and notes index read from the database
- [ ] Task 6: Note page and its Markdown copy read from the database
- [ ] Task 7: Feed, sitemap and `llms.txt` read from the database
- [ ] Task 8: Browser test setup with a real Postgres
- [ ] Task 9: CI on pull requests

#### Checkpoint 1: module complete

- [ ] Success criteria 1 and 8 hold
- [ ] `pnpm check`, `pnpm build` and `pnpm test:e2e` pass
- [ ] Code review and security review agents have reported and their required findings are fixed
- [ ] Pull request 1 is open

### Module 2: `owner-auth` (branch `feature/owner-auth`)

- [ ] Task 10: Sign-in tables and Better Auth wiring
- [ ] Task 11: Enrolment rule
- [ ] Task 12: Session guard for the studio

#### Checkpoint 2a

- [ ] The abuse-case tests for enrolment and signed-out access pass

- [ ] Task 13: Sign-in and setup pages
- [ ] Task 14: Rate limits on sign-in and enrolment
- [ ] Task 15: Browser tests for enrolment and sign-in
- [ ] Task 16: Security headers
- [ ] Task 17: Passkey reset script

#### Checkpoint 2: module complete

- [ ] Success criteria 2, 3, 15 and 16 hold
- [ ] Checks, build and browser tests pass
- [ ] Review agents have reported and required findings are fixed
- [ ] Pull request 2 is open

### Module 3: `studio-editor` (branch `feature/studio-editor`)

- [ ] Task 18: Note list and new note
- [ ] Task 19: Save a draft with a version check
- [ ] Task 20: Editor page with autosave

#### Checkpoint 3a

- [ ] A note can be created, typed into and reloaded with its text intact

- [ ] Task 21: CodeMirror editor
- [ ] Task 22: Live preview from the public renderer
- [ ] Task 23: Revisions taken while editing
- [ ] Task 24: History panel with view and restore
- [ ] Task 25: Keyboard, screen-size and accessibility pass

#### Checkpoint 3: module complete

- [ ] Success criteria 4, 5, 6, 10, 13 and 14 hold
- [ ] Checks, build and browser tests pass
- [ ] Review agents, including the accessibility agent, have reported and required findings are fixed
- [ ] Pull request 3 is open

### Module 4: `publishing` (branch `feature/publishing`)

- [ ] Task 26: Publish and republish from the studio
- [ ] Task 27: Unpublish
- [ ] Task 28: Change a published note's address

#### Checkpoint 4a

- [ ] Success criteria 7, 9 and 11 hold in the browser tests

- [ ] Task 29: Release checks and setup instructions

#### Checkpoint 4: V1 complete

- [ ] All 18 success criteria hold, or are listed as unverified with the reason
- [ ] Checks, build and browser tests pass
- [ ] Review agents have reported and required findings are fixed
- [ ] Pull request 4 is open

## How the work is run

- **Branches.** This planning branch, `studio-database`, becomes pull request 0. Each module branch starts from the one before it, so a module can begin before the previous pull request is merged.
- **Each task** follows the same loop: failing test, code that passes it, `pnpm check`, run the behaviour for real, commit. A task is done when its acceptance criteria hold, nothing else regressed and the documents it affects are updated.
- **Each module** ends with the code-reviewer and security-auditor agents reading the full diff. Findings they mark as required are fixed before the pull request opens. Their reports go in the pull request description.
- **Stops.** Work pauses only for something irreversible, or for something the spec does not cover. Merging is yours.
- **Parallel work.** Tasks within a module run in order because each builds on the last. The review agents run side by side.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Cache Components refuses a note route when no note is published, because `generateStaticParams` must return at least one address | High | Task 6 starts by building against an empty database. Fallback: drop `generateStaticParams` so note pages render per request from cached data. Second fallback, which needs a spec change: tag caching without Cache Components |
| A server action cannot return rendered preview elements, or is too slow while typing | Medium | Task 22 tries it first. Fallback: a signed-in preview page shown in a frame and reloaded after each save |
| The passkey plugin's sessionless enrolment behaves differently from its type definitions | High | Task 11 drives the real Better Auth handler in tests before any page exists. Fallback: a small endpoint that checks the token, starts a session, then adds the passkey |
| Better Auth's rate-limit rules do not match the passkey endpoints as expected | Medium | Task 14 asserts the eleventh attempt is refused through the real handler |
| PGlite accepts SQL that Postgres rejects, or the reverse | Medium | Browser tests and CI run on Postgres 16 with the same migrations |
| Neon behaves differently from a local Postgres (TLS, pooling, cold starts) | Medium | Cannot be tested here. Listed as unverified until the first deploy with your `DATABASE_URL` |
| The build needs a database | Low | CI starts a Postgres service. Vercel reads `DATABASE_URL`. The README says so |
| Passkey tests run only in Chromium with a virtual authenticator | Low | Safari and Firefox are listed as unverified |
| The script policy has to allow inline scripts, because nonces would stop pages being prebuilt | Low | Stated in the spec as a deferred item |

## Open questions

1. **Deleting a draft.** The spec has no delete. Without one, abandoned drafts stay in the list forever. I suggest adding one rule to the spec: a note that has never been published can be deleted. It would be a small task in module 3. Yes or no?
2. **Pull request 0.** May I open a pull request for this planning branch (skills, spec, plan, packages) so `main` has them before module 1?
3. **One more test package.** Success criterion 13 needs axe in the browser tests. That means adding `@axe-core/playwright`, which is not in the spec's package table. Perplex already uses it. May I add it?
