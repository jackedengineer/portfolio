import type { ReactNode } from "react";

import { CopyButton } from "@/components/copy-button";

type Props = { title?: string; raw?: string; children?: ReactNode };

/** A highlighted code sample with its file name and a copy button. */
export function CodeBlock({ title, raw, children }: Props) {
  return (
    <figure className="code-block">
      <figcaption className="label flex items-center justify-between gap-3 border-b-[length:var(--rule-light)] border-ink py-0.5 pr-1.5 pl-4 text-[13.5px]">
        <span className="min-w-0 truncate">{title ?? "Code"}</span>
        {raw !== undefined && (
          <CopyButton
            text={raw}
            label="Copy"
            className="min-h-11 shrink-0 cursor-pointer px-3.5 font-sans text-[15px] font-bold text-ink"
          />
        )}
      </figcaption>
      {children}
    </figure>
  );
}
