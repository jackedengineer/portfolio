"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** The text to copy, or a function that produces it (for example by fetching it). */
  text: string | (() => Promise<string>);
  label: string;
  className?: string;
};

/** Copies text and says so for a moment. The label change is the whole feedback. */
export function CopyButton({ text, label, className }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(typeof text === "string" ? text : await text());
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1600);
  }

  return (
    <button type="button" onClick={copy} className={className}>
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Couldn't copy" : label}</span>
    </button>
  );
}
