/*
  Everything the site says about its owner lives in this file.
  Values set to null are not filled in yet; the pages show a visible
  placeholder for each one so nothing ships half-finished by accident.
*/

export const site = {
  name: "jackedengineer",
  role: "Full-stack engineer",
  description:
    "The logbook of a full-stack engineer: what I built, what was hard, and what I learned from it.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  github: "https://github.com/jackedengineer",
  email: null as string | null,
  resume: null as string | null,
  /* Best lifts in kilograms. Leave a value as null until you want it shown. */
  lifts: [
    { name: "Squat", kg: null as number | null },
    { name: "Bench", kg: null as number | null },
    { name: "Deadlift", kg: null as number | null },
  ],
};

export type Project = {
  slug: string;
  name: string;
  what: string;
  stack: string;
  /** The short handwritten remark in the last column. */
  remark: string;
  hard: string;
  /** The note that writes this build up, if there is one. */
  note?: string;
};

export const projects: Project[] = [
  {
    slug: "doubtless",
    name: "Doubtless",
    what: "Ask a study doubt and get an answer cited to the exact page, passage or video moment in your own sources.",
    stack: "React 19 · Hono on Workers · Neon + Drizzle · Claude",
    remark: "cites the exact page!",
    hard: "remembering exactly where every passage came from, down to the page or the minute of a lecture, so each answer can point at its source.",
    note: "cite-the-page-or-dont-answer",
  },
  {
    slug: "merge",
    name: "Merge",
    what: "A dating app where a like is a pull request. You merge it or you decline it.",
    stack: "Expo · Express + Socket.IO · Postgres + PostGIS",
    remark: "likes = pull requests",
    hard: "a like has to keep a copy of what was liked, so editing a profile later never rewrites what someone responded to.",
    note: "a-like-is-a-pull-request",
  },
  {
    slug: "perplex",
    name: "Perplex",
    what: "A web-research app that plans the search, checks a budget before it starts, and cites every source.",
    stack: "Next.js 16 · Neon + Drizzle · Better Auth · Tavily",
    remark: "budget first, then search",
    hard: "deciding what a question is allowed to cost before any search runs.",
    note: "price-the-question-before-you-run-it",
  },
  {
    slug: "snapform",
    name: "Snapform",
    what: "Turns a client enquiry or onboarding brief into a branded intake flow.",
    stack: "TanStack Start · Express on Workers · Neon + Drizzle",
    remark: "it asks follow-ups",
    hard: "one form engine that works as plain fields and as a guided conversation, and still produces the same record.",
    note: "a-form-that-asks-follow-up-questions",
  },
];
