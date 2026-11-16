import { type NextRequest } from "next/server";
import { isBot, recordPageView, referrerHost, visitorHash } from "@/lib/analytics";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";

const PATH_RE = /^\/[^\s?#]{0,199}$/;

/** 방문 기록 받기 (PageViewTracker가 sendBeacon으로 보냄). 응답 본문은 없습니다. */
export async function POST(request: NextRequest) {
  const done = new Response(null, { status: 204 });

  // 다른 사이트에서 보낸 요청은 무시
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return done;

  const userAgent = request.headers.get("user-agent");
  if (isBot(userAgent)) return done;
  // 관리자(블로그 주인)의 방문은 세지 않습니다.
  if (decodeSession(request.cookies.get(SESSION_COOKIE)?.value)) return done;

  let body: { path?: unknown; referrer?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return done;
  }
  const path = typeof body.path === "string" ? body.path : "";
  if (!PATH_RE.test(path) || path.startsWith("/admin") || path.startsWith("/api")) return done;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    await recordPageView({
      path,
      visitorHash: visitorHash(ip, userAgent!),
      referrer: referrerHost(typeof body.referrer === "string" ? body.referrer : undefined, host),
    });
  } catch (err) {
    console.error("[views] 기록 실패", err);
  }
  return done;
}
