import type { Metadata } from "next";
import Link from "next/link";
import { SmallHero } from "@/components/Hero";
import { formatDate, slugify } from "@/lib/format";
import { getPostsByTag } from "@/lib/posts";

export const metadata: Metadata = { title: "Tags" };

export default async function TagsPage() {
  const groups = await getPostsByTag();

  return (
    <>
      <SmallHero title="Tags" />
      <main className="site__content">
        <div className="container">
          <div className="page-content">
            {groups.length === 0 && <p className="empty-state">아직 태그가 없습니다.</p>}
            {groups.length > 0 && (
              <nav className="tag-index" aria-label="태그 목록">
                {groups.map(({ name, posts }) => (
                  <a key={name} className="tag-index__item" href={`#${slugify(name)}`}>
                    {name} <span>{posts.length}</span>
                  </a>
                ))}
              </nav>
            )}
            {groups.map(({ name, posts }) => (
              <section key={name} className="archive-group">
                <h3 id={slugify(name)} className="category-head">
                  {name}
                </h3>
                {posts.map((post) => (
                  <article key={post.slug} className="archive-item">
                    <h4>
                      <Link href={`/${post.slug}`}>{post.title}</Link>
                    </h4>
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                  </article>
                ))}
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
