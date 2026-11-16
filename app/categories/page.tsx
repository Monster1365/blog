import type { Metadata } from "next";
import Link from "next/link";
import { SmallHero } from "@/components/Hero";
import { formatDate, slugifyCategory } from "@/lib/format";
import { getPostsByCategory } from "@/lib/posts";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const groups = await getPostsByCategory();

  return (
    <>
      <SmallHero title="Categories" />
      <main className="site__content">
        <div className="container">
          <div className="page-content">
            {groups.length === 0 && <p className="empty-state">아직 카테고리가 없습니다.</p>}
            {groups.map(({ name, posts }) => (
              <section key={name} className="archive-group">
                <h3 id={slugifyCategory(name)} className="category-head">
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
