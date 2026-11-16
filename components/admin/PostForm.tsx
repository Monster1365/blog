"use client";

import { type ReactNode, useActionState } from "react";
import { type PostFormState, savePost } from "@/app/admin/actions";

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
  const errors = state.fieldErrors ?? {};

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
    <form action={formAction} className="admin-form" key={state.nonce ?? "initial"}>
      {post?.id && <input type="hidden" name="id" value={post.id} />}

      <Field id="title" label="제목" error={errors.title}>
        <input id="title" name="title" defaultValue={v.title} maxLength={200} required />
      </Field>

      <div className="admin-form__row">
        <Field
          id="slug"
          label="주소 (slug)"
          hint="비우면 제목으로 만듭니다. 예: renpy-game-dev-playermove"
          error={errors.slug}
        >
          <input id="slug" name="slug" defaultValue={v.slug} maxLength={120} />
        </Field>
        <Field id="tags" label="태그" hint="쉼표로 구분합니다. 예: Renpy, Game" error={errors.tags}>
          <input id="tags" name="tags" defaultValue={v.tags} />
        </Field>
      </div>

      <div className="admin-form__row">
        <Field
          id="featuredImg"
          label="대표 이미지"
          hint="public/images/posts/ 안의 파일 이름(.jpg 제외) 또는 /로 시작하는 경로"
          error={errors.featuredImg}
        >
          <input id="featuredImg" name="featuredImg" defaultValue={v.featuredImg} />
        </Field>
        <Field id="excerpt" label="요약" hint="비우면 본문 첫 문단으로 만듭니다." error={errors.excerpt}>
          <input id="excerpt" name="excerpt" defaultValue={v.excerpt} maxLength={300} />
        </Field>
      </div>

      <Field id="content" label="본문 (Markdown)" error={errors.content}>
        <textarea
          id="content"
          name="content"
          className="admin-form__content"
          defaultValue={v.content}
          rows={24}
          required
        />
      </Field>

      <label className="admin-form__check">
        <input type="checkbox" name="published" defaultChecked={v.published} />
        공개 (끄면 사이트에서 보이지 않습니다)
      </label>

      <div className="admin-form__actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "저장 중…" : post?.id ? "저장" : "글 만들기"}
        </button>
        {state.message && (
          <p className="contact-form__status --error" role="status">
            {state.message}
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
