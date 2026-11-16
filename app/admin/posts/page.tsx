import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { deletePost, togglePublished } from "@/app/admin/actions";
import AdminLoading from "@/components/admin/AdminLoading";
import ConfirmButton from "@/components/admin/ConfirmButton";
import SubmitButton from "@/components/admin/SubmitButton";
import { listPostsForAdmin, listTagsForAdmin } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "글" };

export default function AdminPostsPage({ searchParams }: PageProps<"/admin/posts">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminPosts searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminPosts({ searchParams }: Pick<PageProps<"/admin/posts">, "searchParams">) {
  await requireAdmin();
  const { tag } = await searchParams;
  const selectedTag = typeof tag === "string" && tag ? tag : undefined;

  const [posts, tags] = await Promise.all([listPostsForAdmin(selectedTag), listTagsForAdmin()]);

  return (
    <section>
      <div className="admin-toolbar">
        <h2 className="admin-title">
          글 <span>{posts.length}</span>
        </h2>
        <Link className="btn" href="/admin/posts/new">
          새 글 쓰기
        </Link>
      </div>

      <nav className="admin-filter" aria-label="태그로 걸러 보기">
        <Link href="/admin/posts" className={`admin-chip${selectedTag ? "" : " --active"}`}>
          전체
        </Link>
        {tags.map((t) => (
          <Link
            key={t.name}
            href={`/admin/posts?tag=${encodeURIComponent(t.name)}`}
            className={`admin-chip${selectedTag === t.name ? " --active" : ""}`}
          >
            {t.name} <span>{t.total}</span>
          </Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <p className="admin-empty">글이 없습니다.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>상태</th>
                <th>태그</th>
                <th>발행일</th>
                <th>댓글</th>
                <th aria-label="작업" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className={post.published ? undefined : "--hidden"}>
                  <td>
                    <Link href={`/admin/posts/${post.id}/edit`} className="admin-table__title">
                      {post.title}
                    </Link>
                    <div className="admin-table__slug">/{post.slug}</div>
                  </td>
                  <td>
                    <span className={`admin-badge${post.published ? " --public" : ""}`}>
                      {post.published ? "공개" : "숨김"}
                    </span>
                  </td>
                  <td className="admin-table__tags">{post.tags.join(", ") || "—"}</td>
                  <td>{post.publishedAt ? formatDate(post.publishedAt.toISOString()) : "—"}</td>
                  <td>
                    {post.commentCount > 0 ? (
                      <Link href={`/admin/comments?post=${post.id}`}>{post.commentCount}</Link>
                    ) : (
                      0
                    )}
                  </td>
                  <td>
                    <div className="admin-actions">
                      {post.published && (
                        <Link className="admin-btn --ghost" href={`/${post.slug}`} target="_blank">
                          보기
                        </Link>
                      )}
                      <Link className="admin-btn --ghost" href={`/admin/posts/${post.id}/edit`}>
                        수정
                      </Link>
                      <form action={togglePublished}>
                        <input type="hidden" name="id" value={post.id} />
                        <SubmitButton>{post.published ? "숨기기" : "공개하기"}</SubmitButton>
                      </form>
                      <form action={deletePost}>
                        <input type="hidden" name="id" value={post.id} />
                        <ConfirmButton
                          message={`"${post.title}" 글을 삭제할까요? 댓글도 함께 삭제되고 되돌릴 수 없습니다.`}
                        >
                          삭제
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
