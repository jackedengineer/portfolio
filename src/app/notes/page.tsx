import type { Metadata } from "next";

import { NoteRow } from "@/components/note-row";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getNotes } from "@/lib/notes";

export const metadata: Metadata = {
  title: "Notes",
  description: "Every write-up in the log, newest first.",
  alternates: { canonical: "/notes" },
};

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <>
      <SiteHeader sheet="02, notes" current="notes" />

      <main className="flex flex-col gap-6 pt-[clamp(40px,5.5vw,84px)] pb-[clamp(48px,6vw,88px)]">
        <div className="flex flex-col gap-3">
          <h1 className="t-hero">Notes</h1>
          <p className="t-lede max-w-[33em]">
            One write-up per build: what it is, what was hard, and what I would do differently.
          </p>
        </div>
        {notes.length > 0 ? (
          <div className="flex flex-col border-t-[length:var(--rule-heavy)] border-ink">
            {notes.map((note) => (
              <NoteRow key={note.slug} note={note} />
            ))}
          </div>
        ) : (
          <p className="border-t-[length:var(--rule-heavy)] border-ink pt-5">
            Nothing logged yet. The first write-up will show up here.
          </p>
        )}
      </main>

      <SiteFooter note={`${notes.length} ${notes.length === 1 ? "note" : "notes"} in the log`} />
    </>
  );
}
