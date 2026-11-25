import Link from "next/link";

import { noteNumber, type Note } from "@/lib/notes";

/** One line of the notes log. */
export function NoteRow({ note }: { note: Note }) {
  return (
    <Link
      href={`/notes/${note.slug}`}
      className="logrow flex flex-wrap items-baseline gap-x-7 gap-y-1.5 border-b-[length:var(--rule-light)] border-ink px-4.5 py-5"
    >
      <span className="label label-lg flex-[0_0_90px]">No. {noteNumber(note.no)}</span>
      <span className="t-note min-w-0 flex-[1.4_1_380px]">{note.title}</span>
      <span className="min-w-0 flex-[1_1_320px]">
        {note.summary}
        {note.sample && <span className="label ml-2 whitespace-nowrap">Sample</span>}
      </span>
    </Link>
  );
}
