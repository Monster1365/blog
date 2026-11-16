import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { site, siteUrl } from "@/lib/site";
import "@/styles/main.scss";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: site.title, template: `%s | ${site.title}` },
  description: site.description,
  applicationName: site.title,
  appleWebApp: { title: site.shortTitle },
  authors: [{ name: site.author }],
  openGraph: {
    type: "website",
    siteName: site.title,
    locale: "ko_KR",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="site">
        <Header title={site.shortTitle} navigation={site.navigation} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
