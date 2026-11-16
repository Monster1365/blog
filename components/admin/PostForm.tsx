"use client";

import { type ReactNode, type RefObject, useActionState, useRef } from "react";
import { type PostFormState, savePost } from "@/app/admin/actions";
import ImageField from "@/components/admin/ImageField";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import { type FrontMatter, frontMatterList, frontMatterString } from "@/lib/frontmatter";

export type PostFormValues = {
  id?: number;
  title: string;
  slug: string;
  tags: string[];
  excerpt: string | null;
  featuredImg: string | null;
  content: string;
  published: boolean;
};

const initialState: PostFormState = { status: "idle" };

export default function PostForm({ post }: { post?: PostFormValues }) {
  const [state, formAction, pending] = useActionState(savePost, initialState);

  // 오류로 돌아왔으면 방금 입력한 값, 아니면 저장된 값
  const v = state.values ?? {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    tags: post?.tags.join(", ") ?? "",
    excerpt: post?.excerpt ?? "",
    featuredImg: post?.featuredImg ?? "",
    content: post?.content ?? "",
    published: post?.published ?? true,
  };

  return (
    // 오류로 돌아올 때마다 폼을 새로 그려 입력했던 값이 남아 있게 합니다.
    <PostFormBody
      key={state.nonce ?? "initial"}
      v={v}
      postId={post?.id}
      errors={state.fieldErrors ?? {}}
      message={state.message}
      formAction={formAction}
      pending={pending}
    />
  );
}

function PostFormBody({
  v,
  postId,
  errors,
  message,
  formAction,
  pending,
}: {
  v: NonNullable<PostFormState["values"]>;
  postId?: number;
  errors: NonNullable<PostFormState["fieldErrors"]>;
  message?: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);
  const excerptRef = useRef<HTMLInputElement>(null);

  /** .md 파일의 front matter로 비어 있는 칸(제목·태그·요약·주소) 채우기 */
  function fillFromFrontMatter(data: FrontMatter): string[] {
    const filled: string[] = [];
    const fill = (ref: RefObject<HTMLInputElement | null>, value: string | undefined, name: string) => {
      if (ref.current && value && !ref.current.value.trim()) {
        ref.current.value = value;
        filled.push(name);
      }
    };
    fill(titleRef, frontMatterString(data, "title"), "제목");
    fill(tagsRef, frontMatterList(data, "tags", "categories", "category")?.join(", "), "태그");
    fill(excerptRef, frontMatterString(data, "excerpt", "description", "summary"), "요약");
    fill(slugRef, frontMatterString(data, "slug", "permalink")?.replace(/^\/|\/$/g, ""), "주소");
    return filled;
  }

  return (
    <form action={formAction} className="admin-form">
      {postId && <input type="hidden" name="id" value={postId} />}

      <Field id="title" label="제목" error={errors.title}>
        <input ref={titleRef} id="title" name="title" defaultValue={v.title} maxLength={200} required />
      </Field>

      <div className="admin-form__row">
        <Field
          id="slug"
          label="주소 (slug)"
          hint="비우면 제목으로 만듭니다. 예: renpy-game-dev-playermove"
          error={errors.slug}
        >
          <input ref={slugRef} id="slug" name="slug" defaultValue={v.slug} maxLength={120} />
        </Field>
        <Field id="tags" label="태그" hint="쉼표로 구분합니다. 예: Renpy, Game" error={errors.tags}>
          <input ref={tagsRef} id="tags" name="tags" defaultValue={v.tags} />
        </Field>
      </div>

      <div className="admin-form__row">
        <ImageField
          name="featuredImg"
          label="썸네일 (대표 이미지)"
          defaultValue={v.featuredImg}
          error={errors.featuredImg}
        />
        <Field id="excerpt" label="요약" hint="비우면 본문 첫 문단으로 만듭니다." error={errors.excerpt}>
          <input ref={excerptRef} id="excerpt" name="excerpt" defaultValue={v.excerpt} maxLength={300} />
        </Field>
      </div>

      <MarkdownEditor
        id="content"
        name="content"
        label="본문 (Markdown)"
        defaultValue={v.content}
        required
        error={errors.content}
        onFrontMatter={fillFromFrontMatter}
      />

      <label className="admin-form__check">
        <input type="checkbox" name="published" defaultChecked={v.published} />
        공개 (끄면 사이트에서 보이지 않습니다)
      </label>

      <div className="admin-form__actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "저장 중…" : postId ? "저장" : "글 만들기"}
        </button>
        {message && (
          <p className="contact-form__status --error" role="status">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`admin-field${error ? " --error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <span className="admin-field__error">{error}</span>
      ) : (
        hint && <span className="admin-field__hint">{hint}</span>
      )}
    </div>
  );
}
