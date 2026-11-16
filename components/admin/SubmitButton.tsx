"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** 제출 중에는 눌리지 않는 버튼 */
export default function SubmitButton({
  children,
  className = "admin-btn",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "처리 중…" : children}
    </button>
  );
}
