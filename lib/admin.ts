import "server-only";
import { and, arrayContains, count, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { comments, posts } from "@/db/schema";

/** 관리 페이지 전용 조회 (캐시하지 않음). 호출하는 쪽에서 requireAdmin()을 먼저 부릅니다. */

export type AdminPostRow = {
  id: number;
  slug: string;
  title: string;
  tags: string[];
  published: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  commentCount: number;
};

export async function listPostsForAdmin(tag?: string): Promise<AdminPostRow[]> {
  const commentCount = db
    .select({ postId: comments.postId, n: count().as("n") })
    .from(comments)
    .groupBy(comments.postId)
    .as("comment_counts");

  return db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      tags: posts.tags,
      published: posts.published,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      commentCount: sql<number>`coalesce(${commentCount.n}, 0)::int`,
    })
    .from(posts)
    .leftJoin(commentCount, eq(commentCount.postId, posts.id))
    .where(tag ? arrayContains(posts.tags, [tag]) : undefined)
    .orderBy(desc(sql`coalesce(${posts.publishedAt}, ${posts.createdAt})`), desc(posts.id));
}

export async function getPostForAdmin(id: number) {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}

export async function isSlugTaken(slug: string, exceptId?: number): Promise<boolean> {
  const [row] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(exceptId ? and(eq(posts.slug, slug), ne(posts.id, exceptId)) : eq(posts.slug, slug))
    .limit(1);
  return Boolean(row);
}

/** 태그별 글 수 (공개·숨김 모두 포함) */
export async function listTagsForAdmin(): Promise<
  { name: string; total: number; published: number }[]
> {
  const result = await db.execute<{ name: string; total: number; published: number }>(sql`
    SELECT tag AS name,
           count(*)::int AS total,
           count(*) FILTER (WHERE ${posts.published})::int AS published
    FROM ${posts}, unnest(${posts.tags}) AS tag
    GROUP BY tag
    ORDER BY lower(tag)
  `);
  return result.rows;
}

/** 태그가 붙은 글 (id, slug, tags) */
export async function postsWithTag(tag: string) {
  return db
    .select({ id: posts.id, slug: posts.slug, tags: posts.tags })
    .from(posts)
    .where(arrayContains(posts.tags, [tag]));
}

export type AdminCommentRow = {
  id: number;
  postId: number;
  postSlug: string;
  postTitle: string;
  anonNumber: number | null;
  isAuthor: boolean;
  body: string;
  createdAt: Date;
};

export async function listCommentsForAdmin(postId?: number, limit = 100): Promise<AdminCommentRow[]> {
  return db
    .select({
      id: comments.id,
      postId: comments.postId,
      postSlug: posts.slug,
      postTitle: posts.title,
      anonNumber: comments.anonNumber,
      isAuthor: comments.isAuthor,
      body: comments.body,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .innerJoin(posts, eq(posts.id, comments.postId))
    .where(postId ? eq(comments.postId, postId) : undefined)
    .orderBy(desc(comments.createdAt), desc(comments.id))
    .limit(limit);
}
