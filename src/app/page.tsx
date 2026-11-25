import Link from "next/link";

import { NoteRow } from "@/components/note-row";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WorkLog } from "@/components/work-log";
import { getNotes } from "@/lib/notes";
import { projects, site } from "@content/site";

export default async function HomePage() {
  const notes = await getNotes();
  const latest = notes.slice(0, 4);
  const noteSlugs = new Set(notes.map((n) => n.slug));

  return (
    <>
      <SiteHeader sheet="01, home" />

      <main>
        <section className="flex max-w-[1180px] flex-col gap-6 pt-[clamp(40px,5.5vw,84px)] pb-[clamp(48px,6vw,88px)]">
          <h1 className="t-hero">
            I ship products,{" "}
            <span className="relative whitespace-nowrap">
              lift heavy
              <svg
                aria-hidden="true"
                viewBox="0 0 300 100"
                preserveAspectRatio="none"
                className="absolute top-[-6%] left-[-5%] h-[118%] w-[110%] overflow-visible"
              >
                <path
                  className="pen-stroke"
                  pathLength={1000}
                  d="M14,54 C10,22 82,7 160,8 C238,9 292,24 290,54 C288,84 212,95 142,94 C72,93 18,82 15,50 C13,34 34,20 70,14"
                  fill="none"
                  stroke="var(--color-pen)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </span>
            , and <span className="mark">write it all down.</span>
          </h1>
          <p className="hand pen ml-[clamp(0px,22vw,330px)] origin-left -rotate-2 text-[clamp(28px,2.8vw,38px)]">
            ↑ that part is literal
          </p>
          <p className="t-lede max-w-[33em]">
            I&apos;m a full-stack engineer. I build whole products across web, mobile and backend. This site is the
            logbook: what I built, what was hard, and what I learned from it.
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            <Link href="#work" className="btn">
              See the work
            </Link>
            <Link href="/notes" className="link">
              Read the notes →
            </Link>
          </div>
        </section>

        <section id="work" className="flex flex-col gap-4.5 pb-[clamp(48px,6vw,88px)]">
          <SectionHeading number="01" title="Work" aside="Four working sets. Open one to see what was hard." />
          <WorkLog projects={projects} withNotes={noteSlugs} />
        </section>

        <section id="notes" className="flex flex-col gap-4.5 pb-[clamp(48px,6vw,88px)]">
          <SectionHeading
            number="02"
            title="Notes"
            aside="One write-up per build."
            action={
              <Link href="/notes" className="link">
                All notes →
              </Link>
            }
          />
          {latest.length > 0 ? (
            <div className="flex flex-col border-t-[length:var(--rule-heavy)] border-ink">
              {latest.map((note) => (
                <NoteRow key={note.slug} note={note} />
              ))}
            </div>
          ) : (
            <p className="border-t-[length:var(--rule-heavy)] border-ink pt-5">
              Nothing logged yet. The first write-up will show up here.
            </p>
          )}
        </section>

        <section id="about" className="flex flex-col gap-4.5 pb-[clamp(48px,6vw,88px)]">
          <SectionHeading number="03" title="About" />
          <div className="flex flex-wrap items-start gap-x-18 gap-y-8">
            <p className="t-lede max-w-[34em] min-w-0 flex-[1.3_1_440px]">
              There are two logbooks. One is for the gym and one is for the work, and the method is the same in both:
              show up, add a little weight, write it down. The second one is this site.
            </p>
            <table className="max-w-[440px] min-w-0 flex-[1_1_320px] border-[length:var(--rule-heavy)] border-ink bg-paper">
              <thead>
                <tr className="label border-b-[length:var(--rule-heavy)] border-ink">
                  <th scope="col" className="px-4 py-2.5 text-left font-normal">
                    Lift
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-normal">
                    Best, kg
                  </th>
                </tr>
              </thead>
              <tbody>
                {site.lifts.map((lift) => (
                  <tr key={lift.name} className="border-b-[length:var(--rule-light)] border-ink last:border-b-0">
                    <th scope="row" className="px-4 py-2.5 text-left font-bold">
                      {lift.name}
                    </th>
                    <td className="hand pen px-4 py-2.5 text-right text-[30px] tabular-nums">{lift.kg ?? "[kg]"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="contact" className="flex flex-col gap-5.5 pb-[clamp(48px,6vw,88px)]">
          <SectionHeading
            number="04"
            big
            title={
              <>
                Next session: <span className="mark">your team?</span>
              </>
            }
          />
          <p className="t-lede max-w-[32em]">
            I&apos;m open to engineering roles. Tell me what you&apos;re building and where it is stuck.
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {site.email !== null ? (
              <a href={`mailto:${site.email}`} className="btn">
                Email {site.email}
              </a>
            ) : (
              <span className="btn">Email [YOUR EMAIL]</span>
            )}
            <a href={site.github} className="link" rel="noopener noreferrer" target="_blank">
              GitHub ↗
            </a>
            {site.resume !== null ? (
              <a href={site.resume} className="link">
                Résumé
              </a>
            ) : (
              <span className="link">Résumé [PDF]</span>
            )}
            <a href="/feed.xml" className="link">
              RSS
            </a>
          </div>
        </section>
      </main>

      <SiteFooter note="Sheet 01 of the log" />
    </>
  );
}
