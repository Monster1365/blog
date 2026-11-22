import { Hero } from "@/components/Hero";
import PostCard from "@/components/PostCard";
import PostSidebar from "@/components/PostSidebar";
import { getPublishedPosts } from "@/lib/posts";
import { getSectionTree } from "@/lib/sections";
import { getSiteSettings } from "@/lib/settings";

export default async function HomePage() {
  const [posts, tree, s] = await Promise.all([getPublishedPosts(), getSectionTree(), getSiteSettings()]);

  return (
    <>
      <Hero image={s.heroImage} title={s.title} priority>
        <h1 className="hero__title">{s.title}</h1>
        <p className="hero__meta">{s.tagline}</p>
      </Hero>

      <main className="site__content">
        <section className="blog">
          <div className="container home-layout">
            <PostSidebar posts={posts} tree={tree} />
            <div className="post-list">
              {posts.length > 0 ? (
                posts.map((post, i) => (
                  <PostCard key={post.slug} post={post} priority={i < 3} />
                ))
              ) : (
                <p className="empty-state">아직 작성한 글이 없습니다.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
