import Link from "next/link";
import type { ReactNode } from "react";
import SidebarToggle from "@/components/SidebarToggle";
import type { PostSummary } from "@/lib/posts";
import type { SectionNode, SectionPost, SectionTree } from "@/lib/sections";

const RECENT_COUNT = 5;

/** 홈 왼쪽 글 목록: 위쪽은 최근 글, 아래쪽은 섹션별로 정리한 목록 */
export default function PostSidebar({ posts, tree }: { posts: PostSummary[]; tree: SectionTree }) {
  if (posts.length === 0) return null;
  const hasSections = tree.sections.length > 0;

  return (
    <aside className="post-sidebar" aria-label="글 목록">
      <SidebarToggle>
        <section className="post-sidebar__group">
          <h2 className="post-sidebar__heading">최근 글</h2>
          <ul className="post-sidebar__list">
            {posts.slice(0, RECENT_COUNT).map((post) => (
              <li key={post.id}>
                <Link href={`/${post.slug}`} className="post-sidebar__post">
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="post-sidebar__group">
          <h2 className="post-sidebar__heading">섹션</h2>
          {hasSections ? (
            <ul className="post-sidebar__list">
              {tree.sections.map((node) => (
                <li key={node.id}>
                  <SectionFolder node={node} />
                </li>
              ))}
              {tree.unsorted.length > 0 && (
                <li>
                  <Folder name="미분류" count={tree.unsorted.length}>
                    <PostLinks posts={tree.unsorted} />
                  </Folder>
                </li>
              )}
            </ul>
          ) : (
            <ul className="post-sidebar__list">
              <PostLinks posts={tree.unsorted} />
            </ul>
          )}
        </section>
      </SidebarToggle>
    </aside>
  );
}

/** 섹션 하나: 누르면 펼쳐져 하위 섹션과 글이 보입니다. */
function SectionFolder({ node }: { node: SectionNode }) {
  return (
    <Folder name={node.name} count={node.total}>
      {node.sections.map((child) => (
        <li key={child.id}>
          <SectionFolder node={child} />
        </li>
      ))}
      <PostLinks posts={node.posts} />
    </Folder>
  );
}

function Folder({ name, count, children }: { name: string; count: number; children: ReactNode }) {
  return (
    <details className="post-sidebar__folder">
      <summary>
        <svg className="post-sidebar__chevron" viewBox="0 0 8 12" width="8" height="12" aria-hidden="true">
          <path d="M1.5 1 6.5 6 1.5 11" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="post-sidebar__name">{name}</span>
        <span className="post-sidebar__count">{count}</span>
      </summary>
      <ul className="post-sidebar__list --nested">{children}</ul>
    </details>
  );
}

function PostLinks({ posts }: { posts: SectionPost[] }) {
  return posts.map((post) => (
    <li key={post.id}>
      <Link href={`/${post.slug}`} className="post-sidebar__post">
        {post.title}
      </Link>
    </li>
  ));
}
