import Image from "next/image";
import type { ReactNode } from "react";
import { featuredImageSrc } from "@/lib/format";

/** 큰 배경 이미지가 있는 상단 영역 (홈, 글 상세) */
export function Hero({
  image,
  title,
  children,
  priority = false,
}: {
  image: string | null;
  title: string;
  children?: ReactNode;
  priority?: boolean;
}) {
  return (
    <div className={`hero${image ? "" : " dark-bg"}`}>
      {image && (
        <Image
          className="hero__img"
          src={featuredImageSrc(image)}
          alt=""
          fill
          sizes="100vw"
          priority={priority}
        />
      )}
      <div className="hero__wrap">{children ?? <h1 className="hero__title">{title}</h1>}</div>
    </div>
  );
}

/** 이미지 없는 작은 상단 영역 (About, Categories 등 일반 페이지) */
export function SmallHero({ title }: { title: string }) {
  return (
    <div className="hero--small">
      <div className="hero__wrap">
        <h1 className="hero__title">{title}</h1>
      </div>
    </div>
  );
}
