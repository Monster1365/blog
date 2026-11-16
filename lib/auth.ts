import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * 관리자 인증 (GitHub OAuth)
 * - GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET: GitHub OAuth App
 * - AUTH_SECRET: 세션 쿠키 서명용 비밀값 (32자 이상)
 * - ADMIN_GITHUB_LOGIN: 관리자로 허용할 GitHub 아이디 (기본값 Monster1365)
 */
export const SESSION_COOKIE = "mk_admin";
export const OAUTH_STATE_COOKIE = "mk_oauth_state";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7일

export type AdminSession = { login: string; exp: number };

export function adminLogin(): string {
  return process.env.ADMIN_GITHUB_LOGIN || "Monster1365";
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must be set (32+ characters)");
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(value: string | undefined): AdminSession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return null; // AUTH_SECRET 미설정
  }
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as AdminSession;
    if (typeof session.login !== "string" || typeof session.exp !== "number") return null;
    if (session.exp < Date.now()) return null;
    if (session.login.toLowerCase() !== adminLogin().toLowerCase()) return null;
    return session;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export function newSession(login: string): AdminSession {
  return { login, exp: Date.now() + SESSION_MAX_AGE * 1000 };
}

/** 로그인한 관리자 정보. 로그인하지 않았으면 null */
export async function getAdmin(): Promise<AdminSession | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}

/** 관리자가 아니면 로그인 페이지로 보냅니다. 모든 관리 페이지·Server Action 맨 앞에서 호출 */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
