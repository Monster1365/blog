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

/** Contact 폼으로 받은 메시지 (메일 발송 기록 겸 요청 횟수 제한용) */
export const contactMessages = pgTable(
  "contact_messages",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    email: text().notNull(),
    message: text().notNull(),
    /** IP 원문 대신 HMAC 해시만 저장 */
    ipHash: text("ip_hash").notNull(),
    userAgent: text("user_agent"),
    /** pending → sent | failed | skipped(로컬 개발에서 API 키 없음) */
    status: text().notNull().default("pending"),
    error: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("contact_messages_ip_created_idx").on(t.ipHash, t.createdAt),
    index("contact_messages_created_idx").on(t.createdAt),
  ],
);

export type ContactMessage = typeof contactMessages.$inferSelect;
