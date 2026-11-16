import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE } from "@/lib/auth";

/** GitHub 로그인 시작: state를 쿠키에 저장하고 GitHub 인증 화면으로 보냅니다. */
export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/admin/login?error=config", request.url));
  }

  const state = randomBytes(24).toString("base64url");
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set(
    "redirect_uri",
    new URL("/api/auth/github/callback", request.url).toString(),
  );
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("scope", "read:user");
  authorize.searchParams.set("allow_signup", "false");

  const response = NextResponse.redirect(authorize);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/github",
    maxAge: 60 * 10,
  });
  return response;
}
