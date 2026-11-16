import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { SmallHero } from "@/components/Hero";
import { renderMarkdown } from "@/lib/markdown";
import { SETTINGS_TAG, getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "About" };

/** About 본문은 관리 페이지 > 사이트 설정에서 바꿉니다. */
async function getAboutHtml() {
  "use cache";
  cacheLife("max");
  cacheTag(SETTINGS_TAG);
  const { about } = await getSiteSettings();
  return renderMarkdown(about);
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
