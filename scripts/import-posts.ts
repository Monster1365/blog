/**
 * Jekyll `_posts/*.md`를 Neon의 `posts` 테이블로 옮깁니다.
 *
 *   npm run db:import-posts             # .env.local의 DATABASE_URL에 반영
 *   npm run db:import-posts -- --dry-run  # DB에 쓰지 않고 변환 결과만 출력
 *
 * slug 기준 upsert라서 여러 번 실행해도 글이 중복되지 않습니다.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import matter from "gray-matter";
import type { NewPost } from "../db/schema";

config({ path: ".env.local", quiet: true });

const POSTS_DIR = path.join(process.cwd(), "_posts");
const FILENAME_RE = /^(\d{4}-\d{2}-\d{2})-(.+)\.(md|markdown)$/;
const EXCERPT_MAX = 200;

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(/[\s,]+/).filter(Boolean);
  return [];
}

/** 제목·목록·코드 블록을 건너뛴 첫 문단을 평문으로 만든 요약 */
function makeExcerpt(markdown: string): string | null {
  const body = markdown.replace(/```[\s\S]*?```/g, "");
  const paragraph = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(#|[-*+]\s|\d+\.\s|>|\||<)/.test(block));
  if (!paragraph) return null;

  const text = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > EXCERPT_MAX ? `${text.slice(0, EXCERPT_MAX).trimEnd()}…` : text;
}

async function loadPosts(): Promise<NewPost[]> {
  const files = (await readdir(POSTS_DIR)).filter((f) => FILENAME_RE.test(f)).sort();

  return Promise.all(
    files.map(async (file) => {
      const [, date, slug] = file.match(FILENAME_RE)!;
      const { data, content } = matter(await readFile(path.join(POSTS_DIR, file), "utf8"));
      if (typeof data.title !== "string" || !data.title.trim()) {
        throw new Error(`${file}: front matter에 title이 없습니다.`);
      }

      const body = content.trim();
      return {
        slug,
        title: data.title.trim(),
        content: body,
        excerpt: typeof data.excerpt === "string" ? data.excerpt : makeExcerpt(body),
        featuredImg: data["featured-img"] ?? null,
        categories: toArray(data.categories ?? data.category),
        published: data.published !== false,
        // front matter에 date가 없으면 파일명 날짜를 한국 시간 자정으로 사용
        publishedAt: data.date ? new Date(data.date) : new Date(`${date}T00:00:00+09:00`),
      } satisfies NewPost;
    }),
  );
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const rows = await loadPosts();

  for (const row of rows) {
    console.log(
      `- ${row.slug} | ${row.title} | ${row.publishedAt?.toISOString()} | [${row.categories?.join(", ")}] | ${row.content.length}자`,
    );
  }
  if (dryRun) {
    console.log(`\n[dry-run] ${rows.length}개 글을 확인했습니다. DB에는 쓰지 않았습니다.`);
    return;
  }

  // DATABASE_URL을 읽은 뒤에 DB 모듈을 불러와야 합니다.
  const { db } = await import("../db");
  const { posts } = await import("../db/schema");
  const { sql } = await import("drizzle-orm");

  for (const row of rows) {
    await db
      .insert(posts)
      .values(row)
      .onConflictDoUpdate({
        target: posts.slug,
        set: {
          title: sql`excluded.title`,
          content: sql`excluded.content`,
          excerpt: sql`excluded.excerpt`,
          featuredImg: sql`excluded.featured_img`,
          categories: sql`excluded.categories`,
          published: sql`excluded.published`,
          publishedAt: sql`excluded.published_at`,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`\n${rows.length}개 글을 반영했습니다.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
