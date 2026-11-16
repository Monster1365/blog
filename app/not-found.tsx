import Link from "next/link";
import { SmallHero } from "@/components/Hero";

export default function NotFound() {
  return (
    <>
      <SmallHero title="Page not found" />
      <main className="site__content">
        <div className="container">
          <div className="page-content">
            <p>페이지를 찾을 수 없습니다. 주소가 바뀌었거나 삭제된 글일 수 있습니다.</p>
            <p>
              <Link href="/">홈으로 돌아가기</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
