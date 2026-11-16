import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { deleteComment } from "@/app/admin/actions";
import AdminLoading from "@/components/admin/AdminLoading";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { listCommentsForAdmin } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, truncate } from "@/lib/format";

export const metadata: Metadata = { title: "댓글" };

export default function AdminCommentsPage({ searchParams }: PageProps<"/admin/comments">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminComments searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminComments({
  searchParams,
}: Pick<PageProps<"/admin/comments">, "searchParams">) {
  await requireAdmin();
  const { post } = await searchParams;
  const postId = Number(post) || undefined;
  const comments = await listCommentsForAdmin(postId);

  return (
    <section>
      <div className="admin-toolbar">
        <h2 className="admin-title">
          댓글 <span>{comments.length}</span>
        </h2>
        {postId && (
          <Link className="admin-btn --ghost" href="/admin/comments">
            전체 댓글 보기
          </Link>
        )}
      </div>
      <p className="admin-help">최근 댓글 100개까지 보입니다. 삭제한 댓글은 되돌릴 수 없습니다.</p>

      {comments.length === 0 ? (
        <p className="admin-empty">댓글이 없습니다.</p>
      ) : (
        <ol className="admin-comments">
          {comments.map((c) => (
            <li key={c.id} className="admin-comment">
              <div className="admin-comment__meta">
                <span className={`comment__author${c.isAuthor ? " --author" : ""}`}>
                  {c.isAuthor ? "글쓴이" : `익명${c.anonNumber}`}
                </span>
                <time dateTime={c.createdAt.toISOString()}>
                  {formatDateTime(c.createdAt.toISOString())}
                </time>
                <Link href={`/${c.postSlug}#comment-${c.id}`} target="_blank">
                  {truncate(c.postTitle, 40)}
                </Link>
              </div>
              <p className="comment__body">{c.body}</p>
              <form action={deleteComment}>
                <input type="hidden" name="id" value={c.id} />
                <ConfirmButton message="이 댓글을 삭제할까요? 되돌릴 수 없습니다.">삭제</ConfirmButton>
              </form>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
