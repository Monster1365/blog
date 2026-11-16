import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Comments from "@/components/Comments";
import { Hero } from "@/components/Hero";
import { alignClass } from "@/lib/align";
import TagLabels from "@/components/TagLabels";
import { featuredImageSrc, formatDate } from "@/lib/format";
import { getPostBySlug, getPublishedPosts } from "@/lib/posts";

/** 빌드할 때 공개된 글을 모두 미리 렌더링합니다. 이후 추가된 글은 첫 요청 때 렌더링됩니다. */
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  // Cache Components에서는 최소 1개가 필요합니다. 글이 없으면 placeholder는 404가 됩니다.
  return posts.length > 0
    ? posts.map(({ slug }) => ({ slug }))
    : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt ?? undefined,
      publishedTime: post.publishedAt,
      tags: post.tags,
      images: post.featuredImg ? [featuredImageSrc(post.featuredImg)] : undefined,
    },
  };
}

/**
 * 글 본문은 Suspense 안에서 params를 받습니다.
 * 빌드 때 아는 글(generateStaticParams)은 본문까지 미리 만들어지고,
 * 사이트 설정 등 공통 캐시가 바뀌어 페이지 뼈대를 다시 만들 때도 막히지 않습니다.
 */
export default function PostPage({ params }: PageProps<"/[slug]">) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostContent params={params} />
    </Suspense>
  );
}

function PostSkeleton() {
  return (
    <>
      <div className="hero dark-bg" aria-hidden="true" />
      <main className="site__content">
        <div className="container">
          <p className="post-content admin-empty">글을 불러오는 중…</p>
        </div>
      </main>
    </>
  );
}

async function PostContent({ params }: Pick<PageProps<"/[slug]">, "params">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Hero image={post.featuredImg} title={post.title} priority>
        {post.tags.length > 0 && (
          <div className="hero__categories">
            <TagLabels tags={post.tags} />
          </div>
        )}
        <h1 className="hero__title">{post.title}</h1>
        <p className="hero__meta">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          &nbsp;&middot;&nbsp;
          <span>{post.readingMinutes}분 분량</span>
        </p>
      </Hero>

      <main className="site__content">
        <div className="container">
          <article
            className={`post-content post-body${alignClass(post.textAlign)}`}
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <nav className="post-content controls__inner" aria-label="이전·다음 글">
            <div className="controls__item prev">
              {post.previous && (
                <>
                  <span>이전 글</span>
                  <Link href={`/${post.previous.slug}`}>
                    <ArrowLeft />
                    {post.previous.title}
                  </Link>
                </>
              )}
            </div>
            <div className="controls__item next">
              {post.next && (
                <>
                  <span>다음 글</span>
                  <Link href={`/${post.next.slug}`}>
                    {post.next.title}
                    <ArrowRight />
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>

        <Comments postId={post.id} />
      </main>
    </>
  );
}

function ArrowLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="6" height="11" aria-hidden="true">
      <path d="M5.647 1.718c.37-.434.323-1.09-.106-1.465A1.016 1.016 0 0 0 4.095.36L.25 4.875a1.05 1.05 0 0 0 .017 1.378l3.95 4.407c.38.424 1.03.456 1.448.07a1.05 1.05 0 0 0 .07-1.468l-3.34-3.725 3.253-3.819z" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="6" height="11" aria-hidden="true">
      <path d="M.353 9.282c-.37.434-.323 1.09.106 1.465a1.016 1.016 0 0 0 1.446-.107L5.75 6.125a1.05 1.05 0 0 0-.017-1.378L1.784.34A1.015 1.015 0 0 0 .336.27a1.05 1.05 0 0 0-.07 1.468l3.34 3.725L.353 9.282z" />
    </svg>
  );
}
