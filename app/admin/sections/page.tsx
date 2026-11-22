import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  createSection,
  deleteSection,
  moveSection,
  renameSection,
  reorderPostInSection,
  reorderSection,
} from "@/app/admin/actions";
import AdminLoading from "@/components/admin/AdminLoading";
import ConfirmButton from "@/components/admin/ConfirmButton";
import SubmitButton from "@/components/admin/SubmitButton";
import { requireAdmin } from "@/lib/auth";
import {
  type SectionNode,
  type SectionOption,
  type SectionPost,
  descendantIds,
  flattenSections,
  listSectionsForAdmin,
} from "@/lib/sections";

export const metadata: Metadata = { title: "섹션" };

export default function AdminSectionsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminSections />
    </Suspense>
  );
}

async function AdminSections() {
  await requireAdmin();
  const tree = await listSectionsForAdmin();
  const options = flattenSections(tree.sections);

  return (
    <section className="admin-narrow">
      <h2 className="admin-title">
        섹션 <span>{options.length}</span>
      </h2>
      <p className="admin-help">
        섹션은 글을 폴더처럼 묶어 정리하는 곳입니다(태그와 별개). 섹션 안에 하위 섹션을 둘 수 있고, 글은 한
        섹션에만 들어갑니다. 글을 섹션에 넣는 것은 글 수정 화면에서 합니다. 홈 화면 왼쪽 글 목록에 이 순서
        그대로 보입니다(공개된 글이 없는 섹션은 홈에서 숨겨집니다).
      </p>

      <form action={createSection} className="section-create">
        <input name="name" placeholder="새 섹션 이름" aria-label="새 섹션 이름" maxLength={40} required />
        <select name="parentId" aria-label="상위 섹션" defaultValue="">
          <option value="">최상위</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label} 안에
            </option>
          ))}
        </select>
        <SubmitButton className="btn">섹션 추가</SubmitButton>
      </form>

      {options.length === 0 && tree.unsorted.length === 0 ? (
        <p className="admin-empty">아직 섹션이 없습니다.</p>
      ) : (
        <div className="section-admin">
          {tree.sections.map((node, i) => (
            <SectionItem
              key={node.id}
              node={node}
              options={options}
              isFirst={i === 0}
              isLast={i === tree.sections.length - 1}
            />
          ))}

          {tree.unsorted.length > 0 && (
            <div className="section-admin__item --unsorted">
              <div className="section-admin__head">
                <strong>미분류</strong>
                <span className="admin-table__slug">섹션이 없는 글 {tree.unsorted.length}개</span>
              </div>
              <PostList posts={tree.unsorted} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SectionItem({
  node,
  options,
  isFirst,
  isLast,
}: {
  node: SectionNode;
  options: SectionOption[];
  isFirst: boolean;
  isLast: boolean;
}) {
  // 자기 자신과 하위 섹션 아래로는 옮길 수 없습니다.
  const blocked = new Set(descendantIds(node));
  const parentChoices = options.filter((o) => !blocked.has(o.id));

  return (
    <div className="section-admin__item">
      <div className="section-admin__head">
        <OrderButtons action={reorderSection} id={node.id} isFirst={isFirst} isLast={isLast} label={node.name} />

        <form action={renameSection} className="admin-inline-form">
          <input type="hidden" name="id" value={node.id} />
          <input name="name" defaultValue={node.name} aria-label={`${node.name}의 새 이름`} maxLength={40} required />
          <SubmitButton>이름 바꾸기</SubmitButton>
        </form>

        <form action={moveSection} className="admin-inline-form">
          <input type="hidden" name="id" value={node.id} />
          <select name="parentId" defaultValue={node.parentId ?? ""} aria-label={`${node.name}의 상위 섹션`}>
            <option value="">최상위</option>
            {parentChoices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} 안에
              </option>
            ))}
          </select>
          <SubmitButton>옮기기</SubmitButton>
        </form>

        <form action={deleteSection}>
          <input type="hidden" name="id" value={node.id} />
          <ConfirmButton
            message={`"${node.name}" 섹션을 삭제할까요? 안에 있던 하위 섹션과 글은 ${
              node.parentId ? "상위 섹션으로" : "최상위·미분류로"
            } 옮겨지고, 글은 지워지지 않습니다.`}
          >
            삭제
          </ConfirmButton>
        </form>
      </div>

      {node.posts.length > 0 && <PostList posts={node.posts} />}

      {node.sections.length > 0 && (
        <div className="section-admin__children">
          {node.sections.map((child, i) => (
            <SectionItem
              key={child.id}
              node={child}
              options={options}
              isFirst={i === 0}
              isLast={i === node.sections.length - 1}
            />
          ))}
        </div>
      )}

      {node.posts.length === 0 && node.sections.length === 0 && (
        <p className="section-admin__empty">비어 있습니다.</p>
      )}
    </div>
  );
}

function PostList({ posts }: { posts: SectionPost[] }) {
  return (
    <ol className="section-admin__posts">
      {posts.map((post, i) => (
        <li key={post.id} className={post.published ? undefined : "--hidden"}>
          <OrderButtons
            action={reorderPostInSection}
            id={post.id}
            isFirst={i === 0}
            isLast={i === posts.length - 1}
            label={post.title}
          />
          <Link href={`/admin/posts/${post.id}/edit`}>{post.title}</Link>
          {!post.published && <span className="admin-badge">숨김</span>}
        </li>
      ))}
    </ol>
  );
}

function OrderButtons({
  action,
  id,
  isFirst,
  isLast,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
  isFirst: boolean;
  isLast: boolean;
  label: string;
}) {
  return (
    <form action={action} className="order-buttons">
      <input type="hidden" name="id" value={id} />
      <button type="submit" name="dir" value="up" className="admin-btn" disabled={isFirst} aria-label={`${label} 위로`}>
        ▲
      </button>
      <button type="submit" name="dir" value="down" className="admin-btn" disabled={isLast} aria-label={`${label} 아래로`}>
        ▼
      </button>
    </form>
  );
}
