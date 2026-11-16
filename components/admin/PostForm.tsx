"use client";

import { type ReactNode, type RefObject, useActionState, useRef, useState, useTransition } from "react";
import { type PostFormState, previewMarkdown, savePost } from "@/app/admin/actions";
import ThumbnailField from "@/components/admin/ThumbnailField";
import { frontMatterList, frontMatterString, parseFrontMatter } from "@/lib/frontmatter";

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
const MARKDOWN_ACCEPT = ".md,.markdown,.mdx,.txt,text/markdown,text/plain";

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
    <PostFormBody
      key={state.nonce ?? "initial"}
      v={v}
      postId={post?.id}
      errors={errors}
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
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewing, startPreview] = useTransition();
  const [importNote, setImportNote] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);

  function showPreview() {
    setTab("preview");
    const markdown = contentRef.current?.value ?? "";
    startPreview(async () => setPreviewHtml(markdown.trim() ? await previewMarkdown(markdown) : ""));
  }

  /** 마크다운 파일 → 본문. front matter가 있으면 비어 있는 칸(제목·태그·요약·주소)도 채웁니다. */
  async function importMarkdown(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setImportNote("2MB 이하의 마크다운 파일만 불러올 수 있습니다.");
      return;
    }
    const content = contentRef.current;
    if (content?.value.trim() && !window.confirm("지금 쓴 본문을 파일 내용으로 바꿀까요?")) return;

    const { data, content: body } = parseFrontMatter(await file.text());
    if (content) content.value = body;

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

    setTab("write");
    setImportNote(
      `"${file.name}" 내용을 본문에 넣었습니다.` + (filled.length ? ` (${filled.join("·")}도 채움)` : ""),
    );
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
        <ThumbnailField defaultValue={v.featuredImg} error={errors.featuredImg} />
        <Field id="excerpt" label="요약" hint="비우면 본문 첫 문단으로 만듭니다." error={errors.excerpt}>
          <input ref={excerptRef} id="excerpt" name="excerpt" defaultValue={v.excerpt} maxLength={300} />
        </Field>
      </div>

      <div className={`admin-field${errors.content ? " --error" : ""}`}>
        <div className="editor-toolbar">
          <div className="editor-tabs" role="tablist" aria-label="본문 보기 방식">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "write"}
              className="editor-tab"
              onClick={() => setTab("write")}
            >
              작성
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "preview"}
              className="editor-tab"
              onClick={showPreview}
            >
              미리보기
            </button>
          </div>
          <button type="button" className="admin-btn" onClick={() => fileRef.current?.click()}>
            Markdown 파일 불러오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={MARKDOWN_ACCEPT}
            hidden
            onChange={(e) => {
              importMarkdown(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        <label htmlFor="content" className="visually-hidden">
          본문 (Markdown)
        </label>
        {/* 미리보기 중에도 textarea는 남겨 두어 값이 함께 저장되게 합니다. */}
        <textarea
          ref={contentRef}
          id="content"
          name="content"
          className={`admin-form__content${dropping ? " --dropping" : ""}`}
          defaultValue={v.content}
          rows={24}
          required
          hidden={tab !== "write"}
          placeholder="Markdown으로 쓰세요. .md 파일을 여기로 끌어다 놓아도 됩니다."
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("Files")) {
              e.preventDefault();
              setDropping(true);
            }
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={(e) => {
            const file = e.dataTransfer.files[0];
            if (!file) return;
            e.preventDefault();
            setDropping(false);
            importMarkdown(file);
          }}
        />
        {tab === "preview" && (
          <div className="editor-preview" aria-live="polite" aria-busy={previewing}>
            {previewing ? (
              <p className="admin-empty">미리보기를 만드는 중…</p>
            ) : previewHtml ? (
              <div className="post-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <p className="admin-empty">본문이 비어 있습니다.</p>
            )}
          </div>
        )}
        {errors.content ? (
          <span className="admin-field__error">{errors.content}</span>
        ) : (
          importNote && <span className="admin-field__hint">{importNote}</span>
        )}
      </div>

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
