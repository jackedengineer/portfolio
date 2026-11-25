import { site } from "@content/site";

export function SiteFooter({ note }: { note: string }) {
  return (
    <footer className="label flex flex-wrap justify-between gap-x-6 gap-y-1 border-t-[length:var(--rule-heavy)] border-ink pt-4 pb-5.5">
      <span>
        © {new Date().getFullYear()} {site.name}
      </span>
      <span>{note}</span>
    </footer>
  );
}
