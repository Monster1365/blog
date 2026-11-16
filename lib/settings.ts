import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { DEFAULT_ABOUT } from "./default-about";
import { site } from "./site";

/** 사이트 설정이 바뀌면 updateTag(SETTINGS_TAG)로 모든 페이지에 반영합니다. */
export const SETTINGS_TAG = "settings";

export type SiteSettings = {
  title: string;
  shortTitle: string;
  description: string;
  tagline: string;
  heroImage: string | null;
  favicon: string | null;
  /** About 본문 (Markdown) */
  about: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  title: site.title,
  shortTitle: site.shortTitle,
  description: site.description,
  tagline: site.tagline,
  heroImage: site.heroImage,
  favicon: null,
  about: DEFAULT_ABOUT,
};

/** 관리 페이지에서 저장한 값 + 비어 있는 칸은 기본값 */
export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("max");
  cacheTag(SETTINGS_TAG);

  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return {
    title: row?.title || DEFAULT_SETTINGS.title,
    shortTitle: row?.shortTitle || DEFAULT_SETTINGS.shortTitle,
    description: row?.description || DEFAULT_SETTINGS.description,
    tagline: row?.tagline || DEFAULT_SETTINGS.tagline,
    heroImage: row?.heroImage || DEFAULT_SETTINGS.heroImage,
    favicon: row?.favicon || DEFAULT_SETTINGS.favicon,
    about: row?.about || DEFAULT_SETTINGS.about,
  };
}
