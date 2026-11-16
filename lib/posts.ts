import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { readingMinutes } from "./format";
import { renderMarkdown } from "./markdown";

/** 글이 바뀌면 revalidateTag(POSTS_TAG, "max")로 캐시를 비웁니다. */
export const POSTS_TAG = "posts";

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImg: string | null;
  categories: string[];
  /** ISO 8601 */
  publishedAt: string;
};

export type PostDetail = PostSummary & {
  html: string;
  readingMinutes: number;
  /** 바로 이전(더 오래된) 글 */
  previous: Pick<PostSummary, "slug" | "title"> | null;
  /** 바로 다음(더 최근) 글 */
  next: Pick<PostSummary, "slug" | "title"> | null;
};

/** 공개된 글 목록 (최신순) */
export async function getPublishedPosts(): Promise<PostSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(POSTS_TAG);

  const rows = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      featuredImg: posts.featuredImg,
      categories: posts.categories,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.publishedAt), desc(posts.id));

  return rows.map(({ createdAt, publishedAt, ...row }) => ({
    ...row,
    publishedAt: (publishedAt ?? createdAt).toISOString(),
  }));
}

/** slug로 공개된 글 하나와 본문 HTML, 이전·다음 글을 가져옵니다. */
export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(POSTS_TAG, `post:${slug}`);

  const [row] = await db
    .select({ content: posts.content, published: posts.published })
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  if (!row?.published) return null;

  const list = await getPublishedPosts();
  const index = list.findIndex((p) => p.slug === slug);
  if (index === -1) return null;

  const pick = (p: PostSummary | undefined) =>
    p ? { slug: p.slug, title: p.title } : null;

  return {
    ...list[index],
    html: await renderMarkdown(row.content),
    readingMinutes: readingMinutes(row.content),
    previous: pick(list[index + 1]),
    next: pick(list[index - 1]),
  };
}

/** 카테고리별 글 목록 (카테고리 이름순) */
export async function getPostsByCategory(): Promise<
  { name: string; posts: PostSummary[] }[]
> {
  "use cache";
  cacheLife("hours");
  cacheTag(POSTS_TAG);

  const groups = new Map<string, PostSummary[]>();
  for (const post of await getPublishedPosts()) {
    for (const category of post.categories) {
      groups.set(category, [...(groups.get(category) ?? []), post]);
    }
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "ko"))
    .map(([name, posts]) => ({ name, posts }));
}
