"use server";

import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { comments, posts } from "@/db/schema";
import { getPostForAdmin, isSlugTaken, postsWithTag } from "@/lib/admin";
import { SESSION_COOKIE, requireAdmin } from "@/lib/auth";
import { makeExcerpt, parseTags, slugify } from "@/lib/format";
import { IMAGE_LIMITS, saveImage } from "@/lib/images";
import { renderMarkdown } from "@/lib/markdown";
import { POSTS_TAG, postTag } from "@/lib/posts";

/** 공개 페이지 캐시를 비워 바뀐 내용이 바로 보이게 합니다. */
function refreshPublic(...slugs: (string | null | undefined)[]) {
  updateTag(POSTS_TAG);
  for (const slug of new Set(slugs)) if (slug) updateTag(postTag(slug));
}

const RESERVED_SLUGS = new Set([
  "admin", "api", "tags", "categories", "about", "contact", "_next", "favicon.ico", "images", "media",
]);
const SLUG_RE = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const IMAGE_RE = /^(?:[\w.-]+|\/[\w./-]+)$/;

type Field = "title" | "slug" | "tags" | "excerpt" | "featuredImg" | "content";

export type PostFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<Field, string>>;
  /** 오류가 났을 때 입력값을 되돌려 주기 위함 (React 폼 액션은 제출 후 입력칸을 비웁니다) */
  values?: Record<Field, string> & { published: boolean };
  /** 오류가 날 때마다 바뀌는 값 (폼을 새로 그리는 key) */
  nonce?: number;
};

/** 글 작성(id 없음)과 수정(id 있음) */
export async function savePost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  await requireAdmin();

  const get = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  const id = Number(get("id")) || undefined;
  const title = get("title").trim();
  const content = get("content").replace(/\r\n/g, "\n").trim();
  const slug = (get("slug").trim() ? slugify(get("slug")) : slugify(title)).slice(0, 120);
  const tags = parseTags(get("tags"));
  const excerptInput = get("excerpt").trim();
  const featuredImg = get("featuredImg").trim();
  const published = get("published") === "on";

  const fieldErrors: PostFormState["fieldErrors"] = {};
  if (!title) fieldErrors.title = "제목을 입력해 주세요.";
  else if (title.length > 200) fieldErrors.title = "제목은 200자 이하로 입력해 주세요.";

  if (!slug || !SLUG_RE.test(slug)) {
    fieldErrors.slug = "주소는 글자·숫자와 하이픈(-)만 쓸 수 있습니다.";
  } else if (RESERVED_SLUGS.has(slug)) {
    fieldErrors.slug = `"${slug}"는 사이트에서 쓰는 주소라 사용할 수 없습니다.`;
  }

  if (tags.length > 10) fieldErrors.tags = "태그는 10개까지 붙일 수 있습니다.";
  else if (tags.some((t) => t.length > 30)) fieldErrors.tags = "태그는 하나에 30자 이하로 입력해 주세요.";

  if (excerptInput.length > 300) fieldErrors.excerpt = "요약은 300자 이하로 입력해 주세요.";
  if (featuredImg && !IMAGE_RE.test(featuredImg)) {
    fieldErrors.featuredImg = "이미지 이름(예: sleek) 또는 /로 시작하는 경로를 입력해 주세요.";
  }
  if (!content) fieldErrors.content = "본문을 입력해 주세요.";

  if (!fieldErrors.slug && slug && (await isSlugTaken(slug, id))) {
    fieldErrors.slug = "이미 다른 글이 쓰는 주소입니다.";
  }

  const submitted = {
    title: get("title"),
    slug: get("slug"),
    tags: get("tags"),
    excerpt: get("excerpt"),
    featuredImg: get("featuredImg"),
    content: get("content"),
    published,
  };

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "입력한 내용을 확인해 주세요.",
      fieldErrors,
      values: submitted,
      nonce: Date.now(),
    };
  }

  const values = {
    title,
    slug,
    content,
    tags,
    excerpt: excerptInput || makeExcerpt(content),
    featuredImg: featuredImg || null,
    published,
  };

  if (id) {
    const existing = await getPostForAdmin(id);
    if (!existing) {
      return { status: "error", message: "글을 찾을 수 없습니다.", values: submitted, nonce: Date.now() };
    }
    await db
      .update(posts)
      .set({
        ...values,
        // 처음 공개할 때 발행일을 정합니다. 이미 있으면 그대로 둡니다.
        publishedAt: published && !existing.publishedAt ? new Date() : existing.publishedAt,
      })
      .where(eq(posts.id, id));
    refreshPublic(existing.slug, slug);
  } else {
    await db.insert(posts).values({ ...values, publishedAt: published ? new Date() : null });
    refreshPublic(slug);
  }

  redirect("/admin/posts");
}

function idFrom(formData: FormData): number {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid id");
  return id;
}

/** 글 숨기기 ↔ 다시 보이기 */
export async function togglePublished(formData: FormData) {
  await requireAdmin();
  const post = await getPostForAdmin(idFrom(formData));
  if (!post) return;

  const published = !post.published;
  await db
    .update(posts)
    .set({ published, publishedAt: published && !post.publishedAt ? new Date() : post.publishedAt })
    .where(eq(posts.id, post.id));
  refreshPublic(post.slug);
}

/** 글 삭제 (댓글도 함께 삭제됩니다) */
export async function deletePost(formData: FormData) {
  await requireAdmin();
  const post = await getPostForAdmin(idFrom(formData));
  if (!post) return;

  await db.delete(posts).where(eq(posts.id, post.id));
  refreshPublic(post.slug);
  redirect("/admin/posts");
}

/** 모든 글에서 태그 이름 바꾸기 (이미 새 이름이 붙은 글은 하나로 합칩니다) */
export async function renameTag(formData: FormData) {
  await requireAdmin();
  const from = String(formData.get("from") ?? "").trim();
  const [to] = parseTags(String(formData.get("to") ?? ""));
  if (!from || !to || from === to || to.length > 30) return;

  const affected = await postsWithTag(from);
  for (const post of affected) {
    await db
      .update(posts)
      .set({ tags: parseTags(post.tags.map((t) => (t === from ? to : t)).join(",")) })
      .where(eq(posts.id, post.id));
  }
  refreshPublic(...affected.map((p) => p.slug));
}

/** 모든 글에서 태그 떼기 */
export async function deleteTag(formData: FormData) {
  await requireAdmin();
  const tag = String(formData.get("tag") ?? "").trim();
  if (!tag) return;

  const affected = await postsWithTag(tag);
  for (const post of affected) {
    await db
      .update(posts)
      .set({ tags: post.tags.filter((t) => t !== tag) })
      .where(eq(posts.id, post.id));
  }
  refreshPublic(...affected.map((p) => p.slug));
}

/** 댓글 삭제 */
export async function deleteComment(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  const [row] = await db
    .delete(comments)
    .where(eq(comments.id, id))
    .returning({ postId: comments.postId });
  // 댓글은 공개 페이지에서 요청마다 읽으므로 관리 화면만 새로 고칩니다.
  if (row) refresh();
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}

export type UploadResult = { ok: true; url: string } | { ok: false; message: string };

/** 썸네일 이미지 업로드 → images 테이블에 저장하고 /media/<id> 주소를 돌려줍니다. */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "이미지 파일을 골라 주세요." };
  }
  if (!(IMAGE_LIMITS.types as readonly string[]).includes(file.type)) {
    return { ok: false, message: "JPG, PNG, WebP, GIF 이미지만 올릴 수 있습니다." };
  }
  if (file.size > IMAGE_LIMITS.maxBytes) {
    return { ok: false, message: "이미지는 3MB 이하만 올릴 수 있습니다." };
  }

  const toInt = (v: FormDataEntryValue | null) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 && n < 20000 ? n : undefined;
  };

  try {
    const saved = await saveImage({
      data: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
      width: toInt(formData.get("width")),
      height: toInt(formData.get("height")),
      originalName: String(formData.get("originalName") ?? file.name),
    });
    return { ok: true, url: saved.url };
  } catch (err) {
    console.error("[admin] 이미지 저장 실패", err);
    return { ok: false, message: "이미지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

/** 글쓰기 미리보기: 사이트와 같은 변환기로 마크다운을 HTML로 바꿉니다. */
export async function previewMarkdown(markdown: string): Promise<string> {
  await requireAdmin();
  if (typeof markdown !== "string" || markdown.length > 500_000) return "";
  return renderMarkdown(markdown);
}
