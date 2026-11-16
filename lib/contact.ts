import "server-only";
import { createHmac } from "node:crypto";
import { and, count, eq, gte } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { getSiteSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

export const CONTACT_LIMITS = {
  name: 100,
  email: 254,
  message: 5000,
  messageMin: 10,
  /** 같은 IP에서 10분에 3번까지 */
  perIp: { max: 3, windowMs: 10 * 60 * 1000 },
  /** 사이트 전체로 1시간에 30번까지 (스팸 폭주 시 메일 비용 상한) */
  global: { max: 30, windowMs: 60 * 60 * 1000 },
} as const;

export type ContactInput = { name: string; email: string; message: string };

/** IP를 그대로 저장하지 않도록 HMAC 해시로 바꿉니다. */
export function hashIp(ip: string): string {
  const key =
    process.env.CONTACT_HASH_SECRET ?? process.env.RESEND_API_KEY ?? "local-dev";
  return createHmac("sha256", key).update(ip).digest("hex");
}

export async function isRateLimited(ipHash: string): Promise<boolean> {
  const now = Date.now();
  const { perIp, global } = CONTACT_LIMITS;

  const [[byIp], [all]] = await Promise.all([
    db
      .select({ n: count() })
      .from(contactMessages)
      .where(
        and(
          eq(contactMessages.ipHash, ipHash),
          gte(contactMessages.createdAt, new Date(now - perIp.windowMs)),
        ),
      ),
    db
      .select({ n: count() })
      .from(contactMessages)
      .where(gte(contactMessages.createdAt, new Date(now - global.windowMs))),
  ]);

  return byIp.n >= perIp.max || all.n >= global.max;
}

/** 줄바꿈 등을 지워 메일 제목에 안전하게 넣습니다. */
function oneLine(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").trim();
}

/**
 * 메시지를 DB에 저장한 뒤 Resend로 메일을 보냅니다.
 * - RESEND_API_KEY: Resend API 키 (필수)
 * - CONTACT_TO_EMAIL: 메시지를 받을 주소 (필수, 페이지에는 노출되지 않음)
 * - CONTACT_FROM_EMAIL: 보내는 주소 (선택, 기본값은 Resend 테스트 주소)
 */
export async function saveAndSendContactMessage(
  input: ContactInput,
  meta: { ipHash: string; userAgent: string | null },
): Promise<"sent" | "skipped"> {
  const [row] = await db
    .insert(contactMessages)
    .values({ ...input, ...meta })
    .returning({ id: contactMessages.id, createdAt: contactMessages.createdAt });

  const setStatus = (status: string, error: string | null = null) =>
    db
      .update(contactMessages)
      .set({ status, error })
      .where(eq(contactMessages.id, row.id));

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const { title } = await getSiteSettings();
  // 다른 메일과 헷갈리지 않게 보내는 이름·제목에 "블로그 문의"임을 적습니다.
  const from =
    process.env.CONTACT_FROM_EMAIL ?? `${title} 블로그 문의 <onboarding@resend.dev>`;

  if (!apiKey || !to) {
    if (process.env.NODE_ENV !== "production") {
      // 로컬 개발: 키가 없으면 실제로 보내지 않고 저장만 합니다.
      console.info("[contact] RESEND_API_KEY/CONTACT_TO_EMAIL 없음 — 메일 발송 생략", row.id);
      await setStatus("skipped");
      return "skipped";
    }
    await setStatus("failed", "missing RESEND_API_KEY or CONTACT_TO_EMAIL");
    throw new Error("Contact email is not configured");
  }

  const sentAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(row.createdAt);

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to,
    replyTo: input.email,
    subject: `[${title} 블로그] Contact 문의 - ${oneLine(input.name).slice(0, 50)}`,
    text: [
      `${title} 블로그(${siteUrl})의 Contact 폼으로 받은 메시지입니다.`,
      "",
      `이름: ${oneLine(input.name)}`,
      `이메일: ${input.email}`,
      `보낸 시각: ${sentAt}`,
      "",
      input.message,
      "",
      "—",
      "이 메일에 답장하면 보낸 사람에게 바로 전달됩니다.",
    ].join("\n"),
  });

  if (error) {
    await setStatus("failed", `${error.name}: ${error.message}`);
    throw new Error(`Resend error: ${error.name}`);
  }

  await setStatus("sent");
  return "sent";
}
