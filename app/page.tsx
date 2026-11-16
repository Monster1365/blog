import { Hero } from "@/components/Hero";
import PostCard from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export default async function HomePage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <Hero image={site.heroImage} title={site.title} priority>
        <h1 className="hero__title">{site.title}</h1>
        <p className="hero__meta">{site.tagline}</p>
      </Hero>

      <main className="site__content">
        <section className="blog">
          <div className="container">
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
