import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader sheet="missing" />
      <main className="flex flex-col items-start gap-6 pt-[clamp(40px,5.5vw,84px)] pb-[clamp(48px,6vw,88px)]">
        <h1 className="t-hero">
          This page was <span className="mark">never logged.</span>
        </h1>
        <p className="t-lede max-w-[33em]">The address may be mistyped, or the entry may have moved.</p>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <Link href="/" className="btn">
            Back to the first sheet
          </Link>
          <Link href="/notes" className="link">
            All notes →
          </Link>
        </div>
      </main>
      <SiteFooter note="Sheet not found" />
    </>
  );
}
