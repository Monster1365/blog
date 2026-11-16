import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { SmallHero } from "@/components/Hero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "블로그 글에 대한 질문이나 의견을 보내 주세요.",
};

export default function ContactPage() {
  return (
    <>
      <SmallHero title="Contact" />
      <main className="site__content">
        <div className="container">
          <div className="page-content">
            <p>
              글에 대한 질문, 잘못된 내용 제보, 의견 모두 환영합니다. 아래 폼으로 보내 주시면 적어 주신
              이메일로 답장 드리겠습니다.
            </p>
            <p>
              코드 관련 이야기는{" "}
              <a
                href={`https://github.com/${site.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              에서도 나눌 수 있습니다.
            </p>
            <ContactForm />
          </div>
        </div>
      </main>
    </>
  );
}
