import Link from "next/link";

import { site } from "@content/site";

type Props = {
  /** What is written in the "Sheet" blank, for example "01, home". */
  sheet: string;
  current?: "work" | "notes" | "about";
};

const tabs = [
  { key: "work", label: "Work", href: "/#work" },
  { key: "notes", label: "Notes", href: "/notes" },
  { key: "about", label: "About", href: "/#about" },
] as const;

/** The cover strip of the logbook: who it belongs to, which sheet this is, and the divider tabs. */
export function SiteHeader({ sheet, current }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3.5 border-b-[length:var(--rule-heavy)] border-ink pt-6.5">
      <div className="flex flex-wrap items-end gap-x-9 gap-y-2.5 pb-3">
        <Link href="/" className="flex min-h-11 items-baseline gap-2.5">
          <span className="label">Athlete</span>
          <span className="blank text-[38px]">{site.name}</span>
        </Link>
        <p className="flex items-baseline gap-2.5">
          <span className="label">Sheet</span>
          <span className="blank text-[32px]">{sheet}</span>
        </p>
      </div>
      <nav aria-label="Primary" className="flex flex-wrap items-end gap-1 sm:gap-1.5">
        {tabs.map((tab) => (
          <Link key={tab.key} href={tab.href} className="tab" aria-current={current === tab.key ? "page" : undefined}>
            {tab.label}
          </Link>
        ))}
        <Link href="/#contact" className="tab tab-solid">
          Get in touch
        </Link>
      </nav>
    </header>
  );
}
