import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deletePost } from "@/app/admin/actions";
import AdminLoading from "@/components/admin/AdminLoading";
import ConfirmButton from "@/components/admin/ConfirmButton";
import PostForm from "@/components/admin/PostForm";
import { getPostForAdmin } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { flattenSections, listSectionsForAdmin } from "@/lib/sections";

export const metadata: Metadata = { title: "글 수정" };

export default function EditPostPage({ params }: PageProps<"/admin/posts/[id]/edit">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditPost params={params} />
    </Suspense>
  );
}

async function EditPost({ params }: Pick<PageProps<"/admin/posts/[id]/edit">, "params">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [post, tree] = await Promise.all([getPostForAdmin(id), listSectionsForAdmin()]);
  if (!post) notFound();

  return (
    <section className="admin-narrow">
      <div className="admin-toolbar">
        <h2 className="admin-title">글 수정</h2>
        <div className="admin-actions">
          {post.published && (
            <Link className="admin-btn --ghost" href={`/${post.slug}`} target="_blank">
              사이트에서 보기
            </Link>
          )}
          <form action={deletePost}>
            <input type="hidden" name="id" value={post.id} />
            <ConfirmButton
              message={`"${post.title}" 글을 삭제할까요? 댓글도 함께 삭제되고 되돌릴 수 없습니다.`}
            >
              삭제
            </ConfirmButton>
          </form>
        </div>
      </div>
      <PostForm
        sections={flattenSections(tree.sections)}
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          tags: post.tags,
          excerpt: post.excerpt,
          featuredImg: post.featuredImg,
          content: post.content,
          published: post.published,
          textAlign: post.textAlign,
          sectionId: post.sectionId,
        }}
      />
    </section>
  );
}
