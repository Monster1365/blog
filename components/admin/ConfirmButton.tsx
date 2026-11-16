"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** 누르면 확인창을 띄우고, 확인했을 때만 폼을 제출하는 버튼 */
export default function ConfirmButton({
  message,
  children,
  className = "admin-btn --danger",
}: {
  message: string;
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? "처리 중…" : children}
    </button>
  );
}
