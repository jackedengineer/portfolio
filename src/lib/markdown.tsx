import type { Element, Root as HastRoot } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { toString as hastToString } from "hast-util-to-string";
import type { Root as MdastRoot } from "mdast";
import type {} from "mdast-util-directive";
import type { ReactElement, ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createCssVariablesTheme, createHighlighter, type Highlighter } from "shiki";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";
import { VFile } from "vfile";

import { CodeBlock } from "@/components/code-block";

/*
  Markdown in, React elements out. Nothing in a note is ever evaluated:
  raw HTML is dropped, and the only non-standard blocks are the ones named
  in BLOCKS below. An unknown ":::name" is printed as the text it was.
*/

/** The extra blocks a note may use, and the element each one becomes. */
const BLOCKS: Record<string, string> = {
  tldr: "note-tldr",
  callout: "note-callout",
  aside: "note-aside",
};

const LANGS = ["ts", "tsx", "js", "jsx", "json", "sql", "bash", "css", "html", "md", "yaml", "python", "go", "rust", "diff"];

const codeTheme = createCssVariablesTheme({
  name: "logbook",
  variablePrefix: "--code-",
  variableDefaults: {},
  fontStyle: true,
});

let highlighter: Promise<Highlighter> | undefined;
function getHighlighter(): Promise<Highlighter> {
  highlighter ??= createHighlighter({ themes: [codeTheme], langs: LANGS });
  return highlighter;
}

function remarkNoteBlocks() {
  return (tree: MdastRoot, file: VFile) => {
    visit(tree, (node, index, parent) => {
      if (node.type !== "containerDirective" && node.type !== "leafDirective" && node.type !== "textDirective") {
        return;
      }
      if (node.type === "containerDirective" && Object.hasOwn(BLOCKS, node.name)) {
        node.data = { hName: BLOCKS[node.name] };
        return;
      }
      /* Not one of ours: put the source text back, so "key:value" in prose survives. */
      if (!parent || index === undefined || !node.position) return;
      const source = String(file.value).slice(node.position.start.offset, node.position.end.offset);
      parent.children[index] =
        node.type === "textDirective"
          ? { type: "text", value: source }
          : { type: "paragraph", children: [{ type: "text", value: source }] };
      return [SKIP, index + 1];
    });
  };
}

function rehypeCodeBlocks(shiki: Highlighter) {
  return (tree: HastRoot) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "pre" || !parent || index === undefined) return;
      const code = node.children.find((c): c is Element => c.type === "element" && c.tagName === "code");
      if (!code) return;
      const classes = Array.isArray(code.properties.className) ? code.properties.className.map(String) : [];
      const asked = classes.find((c) => c.startsWith("language-"))?.slice("language-".length) ?? "text";
      const lang = shiki.getLoadedLanguages().includes(asked) ? asked : "text";
      const raw = hastToString(code).replace(/\n$/, "");
      const meta = (code.data as { meta?: string } | undefined)?.meta ?? "";
      const title = /title="([^"]+)"/.exec(meta)?.[1];
      const pre = shiki.codeToHast(raw, { lang, theme: "logbook" }).children[0];
      parent.children[index] = {
        type: "element",
        tagName: "code-block",
        properties: { title, raw },
        children: pre ? [pre as Element] : [],
      };
      return [SKIP, index + 1];
    });
  };
}

export type TocEntry = { id: string; text: string };

function Tldr({ children }: { children?: ReactNode }) {
  return (
    <div className="note-tldr" id="tldr">
      <span className="text-[17px] font-black">TL;DR</span>
      {children}
    </div>
  );
}

function Callout({ children }: { children?: ReactNode }) {
  return <div className="note-callout">{children}</div>;
}

function Aside({ children }: { children?: ReactNode }) {
  return (
    <aside className="note-aside" aria-label="Margin note">
      {children}
    </aside>
  );
}

function Anchor({ href, children }: { href?: string; children?: ReactNode }) {
  const external = href !== undefined && /^https?:\/\//.test(href);
  return (
    <a href={href} {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}>
      {children}
    </a>
  );
}

const components = {
  "note-tldr": Tldr,
  "note-callout": Callout,
  "note-aside": Aside,
  "code-block": CodeBlock,
  a: Anchor,
};

/** Turn a note's Markdown into React elements and a list of its sections. */
export async function renderMarkdown(source: string): Promise<{ content: ReactElement; toc: TocEntry[] }> {
  const shiki = await getHighlighter();
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkNoteBlocks)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeCodeBlocks, shiki);

  const file = new VFile(source);
  const tree = await processor.run(processor.parse(file), file);

  const toc: TocEntry[] = [];
  visit(tree, "element", (node) => {
    if (node.tagName === "h2" && typeof node.properties.id === "string") {
      toc.push({ id: node.properties.id, text: hastToString(node) });
    }
  });

  const content = toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components: components as never,
  });
  return { content, toc };
}
