"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * 페이지를 볼 때마다 /api/views 에 방문을 알립니다 (대시보드 통계용).
 * 쿠키나 개인정보는 보내지 않고, 주소와 처음 들어온 경로(referrer)만 보냅니다.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const body = JSON.stringify({
      path: pathname,
      // 사이트 안에서 이동할 때는 referrer가 그대로라 첫 페이지에만 보냅니다.
      referrer: first.current ? document.referrer : undefined,
    });
    first.current = false;

    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/views", blob)) {
      fetch("/api/views", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
