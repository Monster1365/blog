import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { deleteTag, renameTag } from "@/app/admin/actions";
import AdminLoading from "@/components/admin/AdminLoading";
import ConfirmButton from "@/components/admin/ConfirmButton";
import SubmitButton from "@/components/admin/SubmitButton";
import { listTagsForAdmin } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "태그" };

export default function AdminTagsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminTags />
    </Suspense>
  );
}

async function AdminTags() {
  await requireAdmin();
  const tags = await listTagsForAdmin();

  return (
    <section>
      <h2 className="admin-title">
        태그 <span>{tags.length}</span>
      </h2>
      <p className="admin-help">
        이름을 바꾸면 그 태그가 붙은 모든 글에 반영됩니다. 이미 있는 태그 이름으로 바꾸면 두 태그가 하나로
        합쳐집니다. 글에 태그를 붙이거나 떼는 것은 글 수정 화면에서 합니다.
      </p>

      {tags.length === 0 ? (
        <p className="admin-empty">태그가 없습니다.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>태그</th>
                <th>글 수</th>
                <th>이름 바꾸기</th>
                <th aria-label="작업" />
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.name}>
                  <td>
                    <Link href={`/admin/posts?tag=${encodeURIComponent(tag.name)}`}>{tag.name}</Link>
                  </td>
                  <td>
                    {tag.total}
                    {tag.total !== tag.published && (
                      <span className="admin-table__slug"> (숨김 {tag.total - tag.published})</span>
                    )}
                  </td>
                  <td>
                    <form action={renameTag} className="admin-inline-form">
                      <input type="hidden" name="from" value={tag.name} />
                      <input
                        name="to"
                        defaultValue={tag.name}
                        aria-label={`${tag.name}의 새 이름`}
                        maxLength={30}
                        required
                      />
                      <SubmitButton>바꾸기</SubmitButton>
                    </form>
                  </td>
                  <td>
                    <form action={deleteTag}>
                      <input type="hidden" name="tag" value={tag.name} />
                      <ConfirmButton
                        message={`"${tag.name}" 태그를 모든 글(${tag.total}개)에서 뗄까요? 글은 지워지지 않습니다.`}
                      >
                        삭제
                      </ConfirmButton>
                    </form>
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
