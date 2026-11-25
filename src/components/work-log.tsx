import Link from "next/link";

import type { Project } from "@content/site";

/** The work table. Each build is a row that opens to show what was hard about it. */
export function WorkLog({ projects, withNotes }: { projects: Project[]; withNotes: ReadonlySet<string> }) {
  return (
    <div className="flex flex-col border-[length:var(--rule-heavy)] border-ink bg-paper">
      <div className="log-head label flex gap-x-7 border-b-[length:var(--rule-heavy)] border-ink px-4.5 py-2.5" aria-hidden="true">
        <span className="flex-[1_1_180px]">Build</span>
        <span className="flex-[2_1_300px]">What it is</span>
        <span className="flex-[1.3_1_220px]">Stack</span>
        <span className="flex-[1_1_190px]">Coach&apos;s note</span>
        <span className="flex-[0_0_28px]" />
      </div>
      {projects.map((project, i) => (
        <details
          key={project.slug}
          open={i === 0}
          className="logrow border-b-[length:var(--rule-light)] border-ink last:border-b-0"
        >
          <summary className="px-4.5 py-5">
            <span className="flex flex-wrap items-center gap-x-7 gap-y-2">
              <span className="t-row min-w-0 flex-[1_1_180px]">{project.name}</span>
              <span className="min-w-0 flex-[2_1_300px]">{project.what}</span>
              <span className="min-w-0 flex-[1.3_1_220px] font-mono text-[13.5px]">{project.stack}</span>
              <span className="hand pen min-w-0 flex-[1_1_190px] text-[30px] leading-[0.95]">{project.remark}</span>
              <span aria-hidden="true" className="sign flex-[0_0_28px] text-right text-[26px] leading-none font-black" />
            </span>
          </summary>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 px-4.5 pb-5.5">
            <p className="max-w-[46em] min-w-0 flex-[1_1_420px]">
              <strong className="font-bold">What was hard:</strong> {project.hard}
            </p>
            {project.note !== undefined && withNotes.has(project.note) && (
              <Link href={`/notes/${project.note}`} className="link">
                Read the write-up →
              </Link>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
