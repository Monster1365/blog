import "server-only";
import { createHmac } from "node:crypto";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { pageViews, posts } from "@/db/schema";

/** 같은 방문자가 같은 페이지를 이 시간 안에 다시 보면 한 번으로 셉니다. */
const DEDUPE_MS = 30 * 60 * 1000;
const BOT_RE =
  /bot|crawl|spider|slurp|preview|fetch|monitor|headless|lighthouse|python|curl|wget|axios|node|go-http|java\//i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_RE.test(userAgent);
}

/** 한국 시간 기준 오늘 날짜 (YYYY-MM-DD) */
function seoulDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

/**
 * 방문자 해시: IP + 브라우저 정보 + 날짜를 HMAC으로 섞습니다.
 * 날짜가 바뀌면 같은 사람도 다른 값이 되어, 하루를 넘겨 개인을 추적할 수 없습니다.
 */
export function visitorHash(ip: string, userAgent: string): string {
  const key =
    process.env.AUTH_SECRET ?? process.env.CONTACT_HASH_SECRET ?? process.env.RESEND_API_KEY ?? "local-dev";
  return createHmac("sha256", key).update(`views:${seoulDate()}:${ip}:${userAgent}`).digest("hex");
}

/** "https://www.google.com/search?q=..." → "google.com". 자기 사이트에서 온 것은 null */
export function referrerHost(referrer: string | undefined, ownHost: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (!host || (ownHost && host === ownHost.replace(/^www\./, "").split(":")[0])) return null;
    return host.slice(0, 100);
  } catch {
    return null;
  }
}

export async function recordPageView(input: {
  path: string;
  visitorHash: string;
  referrer: string | null;
}): Promise<boolean> {
  const since = new Date(Date.now() - DEDUPE_MS);
  const [recent] = await db
    .select({ id: pageViews.id })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.visitorHash, input.visitorHash),
        eq(pageViews.path, input.path),
        gte(pageViews.createdAt, since),
      ),
    )
    .limit(1);
  if (recent) return false;

  // "/글-주소" 모양이면 공개된 글과 연결합니다 (인기 글 통계용)
  let postId: number | null = null;
  const slug = input.path.match(/^\/([^/]+)$/)?.[1];
  if (slug) {
    const [post] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.slug, decodeURIComponent(slug)), eq(posts.published, true)))
      .limit(1);
    postId = post?.id ?? null;
  }

  await db.insert(pageViews).values({ ...input, postId });
  return true;
}
