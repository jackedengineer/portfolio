"use client";

import { CopyButton } from "@/components/copy-button";

/** "Copy link" and "Copy as Markdown" for a note. */
export function NoteActions({ path }: { path: string }) {
  const className = "link cursor-pointer text-left text-[16px]";
  return (
    <div className="flex flex-col border-t-[length:var(--rule-light)] border-ink pt-2">
      <CopyButton label="Copy link" className={className} text={() => Promise.resolve(new URL(path, window.location.origin).href)} />
      <CopyButton
        label="Copy as Markdown"
        className={className}
        text={async () => {
          const response = await fetch(`${path}.md`);
          if (!response.ok) throw new Error(`No Markdown at ${path}.md`);
          return response.text();
        }}
      />
    </div>
  );
}
