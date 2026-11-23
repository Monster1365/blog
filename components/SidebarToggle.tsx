"use client";

import { type ReactNode, useState } from "react";

/**
 * 좁은 화면에서 "글 목록" 버튼으로 사이드바를 열고 닫습니다.
 * 넓은 화면(xl 이상)에서는 CSS로 버튼을 숨기고 내용을 항상 보여 줍니다.
 */
export default function SidebarToggle({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`post-sidebar__inner${open ? " --open" : ""}`}>
      <button
        type="button"
        className="post-sidebar__toggle"
        aria-expanded={open}
        aria-controls="post-sidebar-body"
        onClick={() => setOpen((v) => !v)}
      >
        <span>글 목록</span>
        <svg viewBox="0 0 12 8" width="12" height="8" aria-hidden="true">
          <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <div id="post-sidebar-body" className="post-sidebar__body">
        {children}
      </div>
    </div>
  );
}
