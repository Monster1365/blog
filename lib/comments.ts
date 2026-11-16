import "server-only";
import { createHmac } from "node:crypto";
import { and, asc, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { commentParticipants, comments, posts } from "@/db/schema";

export const COMMENT_LIMITS = {
  bodyMax: 2000,
  /** 같은 IP에서 10분에 5개까지 */
  perIp: { max: 5, windowMs: 10 * 60 * 1000 },
  /** 사이트 전체로 1시간에 100개까지 */
  global: { max: 100, windowMs: 60 * 60 * 1000 },
} as const;

/** 브라우저 식별 쿠키 (익명 번호를 정하는 기준) */
export const COMMENTER_COOKIE = "mk_cid";

/** 쿠키 값·IP를 그대로 저장하지 않도록 HMAC 해시로 바꿉니다. */
export function hashForComments(value: string): string {
  const key =
    process.env.AUTH_SECRET ??
    process.env.CONTACT_HASH_SECRET ??
    process.env.RESEND_API_KEY ??
    "local-dev";
  return createHmac("sha256", key).update(`comments:${value}`).digest("hex");
}

export type PublicComment = {
  id: number;
  /** "익명1", "글쓴이" 등 화면에 표시할 이름 */
  author: string;
  isAuthor: boolean;
  body: string;
  /** ISO 8601 */
  createdAt: string;
};

/**
 * 글의 댓글 목록 (오래된 순).
 * 캐시하지 않고 요청마다 읽습니다. 글 본문은 미리 만든 페이지로 보내고,
 * 댓글만 <Suspense> 안에서 따로 받아 항상 최신 상태를 보여 줍니다.
 */
export async function listComments(postId: number): Promise<PublicComment[]> {
  const rows = await db
    .select({
      id: comments.id,
      anonNumber: comments.anonNumber,
      isAuthor: comments.isAuthor,
      body: comments.body,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt), asc(comments.id));

  return rows.map((c) => ({
    id: c.id,
    author: c.isAuthor ? "글쓴이" : `익명${c.anonNumber}`,
    isAuthor: c.isAuthor,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
  }));
}

/** 댓글을 달 수 있는 글(공개된 글)인지 확인합니다. */
export async function findCommentablePost(postId: number) {
  const [row] = await db
    .select({ id: posts.id, slug: posts.slug })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.published, true)))
    .limit(1);
  return row ?? null;
}

export async function isCommentRateLimited(ipHash: string): Promise<boolean> {
  const now = Date.now();
  const { perIp, global } = COMMENT_LIMITS;
  const [[byIp], [all]] = await Promise.all([
    db
      .select({ n: count() })
      .from(comments)
      .where(
        and(
          eq(comments.ipHash, ipHash),
          gte(comments.createdAt, new Date(now - perIp.windowMs)),
        ),
      ),
    db
      .select({ n: count() })
      .from(comments)
      .where(gte(comments.createdAt, new Date(now - global.windowMs))),
  ]);
  return byIp.n >= perIp.max || all.n >= global.max;
}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

/** 이 글에서 이 브라우저의 익명 번호를 가져오고, 없으면 다음 번호를 새로 붙입니다. */
async function getOrAssignAnonNumber(postId: number, commenterHash: string): Promise<number> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await db.execute(sql`
        INSERT INTO ${commentParticipants} (post_id, commenter_hash, number)
        SELECT ${postId}, ${commenterHash}, COALESCE(MAX(number), 0) + 1
        FROM ${commentParticipants}
        WHERE post_id = ${postId}
        ON CONFLICT (post_id, commenter_hash) DO NOTHING
      `);
      break;
    } catch (err) {
      // 다른 사람이 같은 순간에 같은 번호를 가져간 경우 → 다시 시도
      if (!isUniqueViolation(err) || attempt === 2) throw err;
    }
  }

  const [row] = await db
    .select({ number: commentParticipants.number })
    .from(commentParticipants)
    .where(
      and(
        eq(commentParticipants.postId, postId),
        eq(commentParticipants.commenterHash, commenterHash),
      ),
    )
    .limit(1);
  if (!row) throw new Error("Failed to assign anonymous number");
  return row.number;
}

export async function insertComment(input: {
  postId: number;
  body: string;
  commenterHash: string;
  ipHash: string;
  isAuthor: boolean;
}) {
  const anonNumber = input.isAuthor
    ? null
    : await getOrAssignAnonNumber(input.postId, input.commenterHash);

  const [row] = await db
    .insert(comments)
    .values({ ...input, anonNumber })
    .returning({ id: comments.id });
  return row;
}
