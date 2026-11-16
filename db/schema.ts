import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const posts = pgTable(
  "posts",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    /** 마크다운 원문 */
    content: text().notNull(),
    excerpt: text(),
    /** 대표 이미지 이름 또는 경로 (예: "renpy-playermove") */
    featuredImg: text("featured_img"),
    categories: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    published: boolean().notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("posts_published_at_idx").on(t.published, t.publishedAt.desc()),
    index("posts_categories_idx").using("gin", t.categories),
  ],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
