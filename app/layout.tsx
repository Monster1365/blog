import type { Metadata } from "next";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PageViewTracker from "@/components/PageViewTracker";
import { featuredImageSrc } from "@/lib/format";
import { getSiteSettings } from "@/lib/settings";
import { site, siteUrl } from "@/lib/site";
import "@/styles/main.scss";

/** 블로그 이름·설명·파비콘은 관리 페이지 > 사이트 설정 값을 씁니다. */
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const icon = s.favicon ? featuredImageSrc(s.favicon) : "/favicon.ico";

  return {
    metadataBase: new URL(siteUrl),
    title: { default: s.title, template: `%s | ${s.title}` },
    description: s.description,
    applicationName: s.title,
    appleWebApp: { title: s.shortTitle },
    authors: [{ name: site.author }],
    icons: { icon, shortcut: icon, apple: icon },
    openGraph: {
      type: "website",
      siteName: s.title,
      locale: "ko_KR",
    },
  };
}

/** 사이트 설정의 짧은 이름을 읽어 헤더를 그립니다. */
async function SiteHeader() {
  const s = await getSiteSettings();
  return <Header title={s.shortTitle} navigation={site.navigation} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="site">
        {/*
          설정 값은 캐시되어 보통 미리 만든 페이지에 그대로 들어갑니다.
          설정을 바꾼 직후처럼 캐시가 비어 있을 때도 페이지가 막히지 않도록 Suspense로 감쌉니다.
        */}
        <Suspense fallback={<Header title={site.shortTitle} navigation={site.navigation} />}>
          <SiteHeader />
        </Suspense>
        {children}
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
        {/* usePathname()을 쓰므로 Suspense 안에 둡니다. */}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
      </body>
    </html>
  );
}
