import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NoteActions } from "@/components/note-actions";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate, getNote, getNotes, noteNumber } from "@/lib/notes";
import { site } from "@content/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getNotes()).map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const note = await getNote((await params).slug);
  if (!note) return {};
  const path = `/notes/${note.slug}`;
  return {
    title: note.title,
    description: note.summary,
    alternates: { canonical: path, types: { "text/markdown": `${path}.md` } },
    openGraph: { type: "article", title: note.title, description: note.summary, url: path, publishedTime: note.date.toISOString() },
  };
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const notes = await getNotes();
  const note = notes.find((n) => n.slug === slug);
  if (!note) notFound();

  const { content, toc } = await renderMarkdown(note.body);
  const older = notes.find((n) => n.no < note.no);
  const path = `/notes/${note.slug}`;
  const meta = [`No. ${noteNumber(note.no)}`, note.topic, note.project].filter(Boolean).join(" · ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: note.title,
    description: note.summary,
    datePublished: note.date.toISOString(),
    url: `${site.url}${path}`,
    author: { "@type": "Person", name: site.name, url: site.url },
  };

  return (
    <>
      <SiteHeader sheet={`note ${noteNumber(note.no)}`} current="notes" />

      <main className="pt-[clamp(32px,4.5vw,64px)] pb-[clamp(48px,6vw,88px)]">
        <article className="sheet flex flex-col gap-8">
          <header className="flex flex-wrap items-start gap-x-[clamp(32px,4vw,64px)] gap-y-8">
            <div className="flex max-w-[44rem] min-w-0 flex-[999_1_520px] flex-col gap-5">
              <p className="label label-lg">{meta}</p>
              <h1 className="text-[clamp(38px,5.4vw,76px)] leading-none font-black tracking-[-0.025em] text-balance">
                {note.title}
              </h1>
              <p className="text-[clamp(20px,1.8vw,24px)] leading-[1.4]">{note.summary}</p>
              <p className="label label-lg">
                {note.sample && "Sample post · "}
                <time dateTime={note.date.toISOString().slice(0, 10)}>{formatDate(note.date)}</time> · {note.minutes} min
                read
              </p>
            </div>
            <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-5">
              {toc.length > 0 && (
                <nav aria-label="On this page" className="flex flex-col text-[16px]">
                  <p className="label label-lg pb-1.5">On this page</p>
                  {toc.map((entry) => (
                    <a key={entry.id} href={`#${entry.id}`} className="py-2">
                      {entry.text}
                    </a>
                  ))}
                </nav>
              )}
              <NoteActions path={path} />
            </div>
          </header>

          <div className="note-body">{content}</div>

          <Link
            href={older ? `/notes/${older.slug}` : "/notes"}
            className="logrow flex max-w-[44rem] flex-wrap items-baseline gap-x-5 gap-y-1 border-y-[length:var(--rule-heavy)] border-ink px-3.5 py-4.5"
          >
            <span className="label label-lg">{older ? `Next · No. ${noteNumber(older.no)}` : "That was the first entry"}</span>
            <span className="text-[clamp(22px,2.4vw,30px)] leading-[1.1] font-extrabold tracking-[-0.015em]">
              {older ? older.title : "All notes"} →
            </span>
          </Link>
        </article>
      </main>

      <SiteFooter note={`Note ${noteNumber(note.no)} of the log`} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
