import Image from "next/image";
import Link from "next/link";
import TagLabels from "@/components/TagLabels";
import { featuredImageSrc, formatDate, truncate, truncateWords } from "@/lib/format";
import type { PostSummary } from "@/lib/posts";

export default function PostCard({
  post,
  priority = false,
}: {
  post: PostSummary;
  priority?: boolean;
}) {
  const href = `/${post.slug}`;

  return (
    <article className="post-card">
      {post.tags.length > 0 && (
        <span className="post-card__label">
          <TagLabels tags={post.tags} />
        </span>
      )}
      <Link href={href} tabIndex={-1} aria-hidden="true">
        <figure className="post-card__thumb">
          {post.featuredImg ? (
            <Image
              src={featuredImageSrc(post.featuredImg)}
              alt=""
              fill
              sizes="(min-width: 75em) 360px, (min-width: 48em) 50vw, 100vw"
              priority={priority}
            />
          ) : (
            <div className="dark-bg" />
          )}
        </figure>
      </Link>
      <Link className="post-card__inner" href={href}>
        <div className="post-card__header">
          <h2>{truncate(post.title, 50)}</h2>
          <span className="post-card__meta">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </span>
        </div>
        {post.excerpt && (
          <p className="post-card__excerpt">{truncateWords(post.excerpt, 20)}</p>
        )}
      </Link>
    </article>
  );
}
