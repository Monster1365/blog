import { connection } from "next/server";
import { Suspense } from "react";
import CommentForm from "@/components/CommentForm";
import { listComments } from "@/lib/comments";
import { formatDateTime } from "@/lib/format";

/**
 * 글 아래 댓글 영역.
 * 글 본문은 미리 만든 페이지로 보내고, 댓글 목록만 요청마다 DB에서 읽어 스트리밍합니다.
 */
export default function Comments({ postId }: { postId: number }) {
  return (
    <section className="comments" aria-labelledby="comments-title">
      <div className="container">
        <div className="post-content comments__inner">
          <Suspense fallback={<CommentsHeading count={null} />}>
            <CommentList postId={postId} />
          </Suspense>
          <CommentForm postId={postId} />
        </div>
      </div>
    </section>
  );
}

function CommentsHeading({ count }: { count: number | null }) {
  return (
    <h2 id="comments-title" className="comments__title">
      댓글 {count === null ? <span className="comments__loading">불러오는 중…</span> : <span>{count}</span>}
    </h2>
  );
}

async function CommentList({ postId }: { postId: number }) {
  await connection(); // 항상 요청 시점에 읽기
  const comments = await listComments(postId);

  return (
    <>
      <CommentsHeading count={comments.length} />
      {comments.length === 0 ? (
        <p className="comments__empty">첫 댓글을 남겨 주세요.</p>
      ) : (
        <ol className="comments__list">
          {comments.map((c) => (
            <li key={c.id} id={`comment-${c.id}`} className="comment">
              <div className="comment__meta">
                <span className={`comment__author${c.isAuthor ? " --author" : ""}`}>{c.author}</span>
                <time dateTime={c.createdAt}>{formatDateTime(c.createdAt)}</time>
              </div>
              <p className="comment__body">{c.body}</p>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
