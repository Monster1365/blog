import { type NextRequest, NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  adminLogin,
  encodeSession,
  newSession,
  sessionCookieOptions,
} from "@/lib/auth";

function fail(request: NextRequest, error: string) {
  const response = NextResponse.redirect(new URL(`/admin/login?error=${error}`, request.url));
  response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/api/auth/github" });
  return response;
}

/** GitHub 로그인 완료: 토큰을 받아 사용자 아이디를 확인하고 관리자 세션을 만듭니다. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return fail(request, "state");
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret || !process.env.AUTH_SECRET) {
    return fail(request, "config");
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: new URL("/api/auth/github/callback", request.url).toString(),
      }),
      cache: "no-store",
    });
    const token = (await tokenRes.json()) as { access_token?: string };
    if (!token.access_token) return fail(request, "github");

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "monster-k-blog",
      },
      cache: "no-store",
    });
    const user = (await userRes.json()) as { login?: string };
    if (!user.login) return fail(request, "github");

    if (user.login.toLowerCase() !== adminLogin().toLowerCase()) {
      return fail(request, "forbidden");
    }

    const response = NextResponse.redirect(new URL("/admin", request.url));
    response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/api/auth/github" });
    response.cookies.set(SESSION_COOKIE, encodeSession(newSession(user.login)), sessionCookieOptions);
    return response;
  } catch (err) {
    console.error("[auth] GitHub 로그인 실패", err);
    return fail(request, "github");
  }
}
