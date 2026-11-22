"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";

const links = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/posts", label: "글" },
  { href: "/admin/posts/new", label: "새 글" },
  { href: "/admin/sections", label: "섹션" },
  { href: "/admin/tags", label: "태그" },
  { href: "/admin/comments", label: "댓글" },
  { href: "/admin/settings", label: "사이트 설정" },
];

export default function AdminNav() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;

  return (
    <nav className="admin-nav" aria-label="관리 메뉴">
      <div className="admin-nav__links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="admin-nav__link"
            aria-current={pathname === link.href ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="admin-nav__links">
        <Link href="/" className="admin-nav__link">
          사이트 보기
        </Link>
        <form action={logout}>
          <button type="submit" className="admin-nav__link admin-nav__button">
            로그아웃
          </button>
        </form>
      </div>
    </nav>
  );
}
