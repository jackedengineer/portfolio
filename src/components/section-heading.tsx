import type { ReactNode } from "react";

type Props = { number: string; title: ReactNode; aside?: ReactNode; action?: ReactNode; big?: boolean };

/** The oversized entry number, the section name, and an optional printed remark. */
export function SectionHeading({ number, title, aside, action, big }: Props) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-5.5 gap-y-1.5">
      <span aria-hidden="true" className="t-num">
        {number}
      </span>
      <h2 className={big ? "text-[clamp(36px,5.4vw,80px)] leading-none font-black tracking-[-0.025em]" : "t-h2"}>{title}</h2>
      {aside !== undefined && <p className="label label-lg">{aside}</p>}
      {action !== undefined && <div className="ml-auto">{action}</div>}
    </div>
  );
}
