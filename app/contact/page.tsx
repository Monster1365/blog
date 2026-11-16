import type { Metadata } from "next";
import { SmallHero } from "@/components/Hero";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

// TODO(6단계): Resend 기반 문의 폼으로 교체
export default function ContactPage() {
  return (
    <>
      <SmallHero title="Contact" />
      <main className="site__content">
        <div className="container">
          <div className="page-content">
            <p>문의 폼을 준비하고 있습니다.</p>
            <p>
              그동안은{" "}
              <a href={`https://github.com/${site.githubUsername}`} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              으로 연락해 주세요.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
