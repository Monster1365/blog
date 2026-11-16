"use server";

import { headers } from "next/headers";
import {
  CONTACT_LIMITS,
  hashIp,
  isRateLimited,
  saveAndSendContactMessage,
} from "@/lib/contact";

type Field = "name" | "email" | "message";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<Field, string>>;
  /** 오류가 났을 때 입력값을 되돌려 주기 위함 */
  values?: Record<Field, string>;
};

/** 페이지를 연 뒤 이 시간 안에 제출되면 봇으로 봅니다. */
const MIN_FILL_MS = 3000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUCCESS: ContactState = {
  status: "success",
  message: "메시지를 보냈습니다. 확인 후 답장 드리겠습니다.",
};

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const get = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };

  const values = {
    name: get("name").trim(),
    email: get("email").trim(),
    message: get("message").trim(),
  };

  // 스팸 방지 1: 사람에게는 보이지 않는 칸(허니팟)이 채워져 있으면 봇
  // 스팸 방지 2: 페이지를 연 직후 바로 제출되면 봇
  // 봇에게는 성공한 것처럼 응답해서 우회를 어렵게 합니다.
  const startedAt = Number(get("startedAt"));
  if (get("website") || (startedAt && Date.now() - startedAt < MIN_FILL_MS)) {
    return SUCCESS;
  }

  const fieldErrors: ContactState["fieldErrors"] = {};
  if (!values.name) fieldErrors.name = "이름을 입력해 주세요.";
  else if (values.name.length > CONTACT_LIMITS.name)
    fieldErrors.name = `이름은 ${CONTACT_LIMITS.name}자 이하로 입력해 주세요.`;

  if (!values.email) fieldErrors.email = "이메일을 입력해 주세요.";
  else if (values.email.length > CONTACT_LIMITS.email || !EMAIL_RE.test(values.email))
    fieldErrors.email = "올바른 이메일 주소를 입력해 주세요.";

  if (!values.message) fieldErrors.message = "메시지를 입력해 주세요.";
  else if (values.message.length < CONTACT_LIMITS.messageMin)
    fieldErrors.message = `메시지는 ${CONTACT_LIMITS.messageMin}자 이상 입력해 주세요.`;
  else if (values.message.length > CONTACT_LIMITS.message)
    fieldErrors.message = `메시지는 ${CONTACT_LIMITS.message.toLocaleString()}자 이하로 입력해 주세요.`;

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "입력한 내용을 확인해 주세요.", fieldErrors, values };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ipHash = hashIp(ip);

  try {
    // 스팸 방지 3: 같은 IP·사이트 전체 요청 횟수 제한
    if (await isRateLimited(ipHash)) {
      return {
        status: "error",
        message: "잠시 후 다시 시도해 주세요. 짧은 시간에 너무 많이 보냈습니다.",
        values,
      };
    }

    await saveAndSendContactMessage(values, {
      ipHash,
      userAgent: h.get("user-agent"),
    });
    return SUCCESS;
  } catch (err) {
    console.error("[contact] 전송 실패", err);
    return {
      status: "error",
      message: "메시지를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
      values,
    };
  }
}
