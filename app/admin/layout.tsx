import type { Metadata } from "next";
import { Suspense } from "react";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: { default: "관리", template: "%s | 관리" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <div className="hero--small admin-hero">
        <div className="hero__wrap">
          <h1 className="hero__title">관리</h1>
        </div>
      </div>
      <main className="site__content admin">
        <div className="container">
          {/* usePathname()을 쓰므로 Suspense 안에 둡니다. */}
          <Suspense fallback={<div className="admin-nav" />}>
            <AdminNav />
          </Suspense>
          {children}
        </div>
      </main>
    </>
  );
}
