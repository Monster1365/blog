"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { getAdmin } from "@/lib/auth";
import {
  COMMENTER_COOKIE,
  COMMENT_LIMITS,
  findCommentablePost,
  hashForComments,
  insertComment,
  isCommentRateLimited,
} from "@/lib/comments";

export type CommentState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** 오류가 났을 때 입력값을 되돌려 주기 위함 */
  body?: string;
  /** 성공할 때마다 바뀌어 폼을 비우는 신호로 씁니다. */
  submittedAt?: number;
};

const MIN_FILL_MS = 2000;

export async function addComment(
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const get = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  const body = get("body").replace(/\r\n/g, "\n").trim();
  const postId = Number(get("postId"));

  // 스팸 방지: 허니팟, 너무 빠른 제출 → 성공처럼 응답하고 저장하지 않음
  const startedAt = Number(get("startedAt"));
  if (get("website") || (startedAt && Date.now() - startedAt < MIN_FILL_MS)) {
    return { status: "success", submittedAt: Date.now() };
  }

  if (!body) return { status: "error", message: "댓글 내용을 입력해 주세요." };
  if (body.length > COMMENT_LIMITS.bodyMax) {
    return {
      status: "error",
      message: `댓글은 ${COMMENT_LIMITS.bodyMax.toLocaleString()}자 이하로 입력해 주세요.`,
      body,
    };
  }
  if (!Number.isInteger(postId) || postId <= 0) {
    return { status: "error", message: "잘못된 요청입니다.", body };
  }

  try {
    const post = await findCommentablePost(postId);
    if (!post) return { status: "error", message: "댓글을 달 수 없는 글입니다.", body };

    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
    const ipHash = hashForComments(`ip:${ip}`);

    const admin = await getAdmin();
    if (!admin && (await isCommentRateLimited(ipHash))) {
      return {
        status: "error",
        message: "잠시 후 다시 시도해 주세요. 짧은 시간에 댓글을 너무 많이 달았습니다.",
        body,
      };
    }

    // 브라우저 식별 쿠키: 없으면 새로 만듭니다 (같은 글 안에서 같은 익명 번호 유지)
    const store = await cookies();
    let commenterId = store.get(COMMENTER_COOKIE)?.value;
    if (!commenterId) {
      commenterId = randomUUID();
      store.set(COMMENTER_COOKIE, commenterId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    await insertComment({
      postId,
      body,
      commenterHash: hashForComments(`cid:${commenterId}`),
      ipHash,
      isAuthor: Boolean(admin),
    });

    // 댓글 목록은 요청마다 읽으므로 캐시를 비울 필요 없이 화면만 새로 고칩니다.
    refresh();
    return { status: "success", submittedAt: Date.now() };
  } catch (err) {
    console.error("[comments] 저장 실패", err);
    return { status: "error", message: "댓글을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", body };
  }
}
