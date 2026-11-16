import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { SmallHero } from "@/components/Hero";
import { renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = { title: "About" };

async function getAboutHtml() {
  "use cache";
  cacheLife("max");
  const markdown = await readFile(path.join(process.cwd(), "content/about.md"), "utf8");
  return renderMarkdown(markdown);
}

export default async function AboutPage() {
  const html = await getAboutHtml();

  return (
    <>
      <SmallHero title="About" />
      <main className="site__content">
        <div className="container">
          <div className="page-content post-body" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </main>
    </>
  );
}
