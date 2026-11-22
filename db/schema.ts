import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  customType,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * 섹션: 글을 폴더처럼 범주로 묶습니다 (태그와 별개). 섹션 안에 하위 섹션을 둘 수 있습니다.
 * 같은 부모 안에서는 sort_order 순으로 보여 줍니다.
 */
export const sections = pgTable(
  "sections",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    /** 상위 섹션 (null이면 최상위) */
    parentId: integer("parent_id").references((): AnyPgColumn => sections.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sections_parent_order_idx").on(t.parentId, t.sortOrder)],
);

export type Section = typeof sections.$inferSelect;

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
    /** 태그 목록. DB 컬럼 이름은 처음 만든 그대로 `categories`입니다. */
    tags: text("categories")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    published: boolean().notNull().default(false),
    /** 본문 정렬: left | center | right | justify */
    textAlign: text("text_align").notNull().default("left"),
    /** 들어 있는 섹션 (null이면 미분류) */
    sectionId: integer("section_id").references(() => sections.id, { onDelete: "set null" }),
    /** 섹션 안에서의 순서 */
    sectionOrder: integer("section_order").notNull().default(0),
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
    index("posts_categories_idx").using("gin", t.tags),
    index("posts_section_order_idx").on(t.sectionId, t.sectionOrder),
  ],
);

/**
 * 글마다 댓글 작성자(브라우저)에게 붙이는 익명 번호.
 * 같은 글 안에서 같은 브라우저는 항상 같은 번호를 씁니다.
 */
export const commentParticipants = pgTable(
  "comment_participants",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    /** 브라우저 식별 쿠키의 HMAC 해시 */
    commenterHash: text("commenter_hash").notNull(),
    number: integer().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.commenterHash] }),
    unique("comment_participants_post_number_unique").on(t.postId, t.number),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    /** 익명 번호. 관리자가 쓴 댓글은 null (글쓴이로 표시) */
    anonNumber: integer("anon_number"),
    isAuthor: boolean("is_author").notNull().default(false),
    body: text().notNull(),
    commenterHash: text("commenter_hash").notNull(),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("comments_post_created_idx").on(t.postId, t.createdAt),
    index("comments_ip_created_idx").on(t.ipHash, t.createdAt),
    index("comments_created_idx").on(t.createdAt),
  ],
);

export type Comment = typeof comments.$inferSelect;

/**
 * 사이트 정보 (관리 페이지 > 사이트 설정). 한 줄(id = 1)만 씁니다.
 * 값이 비어 있으면 lib/site.ts의 기본값을 씁니다.
 */
export const siteSettings = pgTable("site_settings", {
  id: integer().primaryKey().default(1),
  title: text(),
  shortTitle: text("short_title"),
  description: text(),
  /** 홈 배너 안쪽 소개글 */
  tagline: text(),
  /** 홈 배너 이미지 (이미지 이름 또는 /media/<id>) */
  heroImage: text("hero_image"),
  /** 파비콘 (/media/<id>) */
  favicon: text(),
  /** About 페이지 본문 (Markdown) */
  about: text(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SiteSettingsRow = typeof siteSettings.$inferSelect;

/** PostgreSQL bytea ↔ Buffer (Neon HTTP 드라이버는 Buffer로 돌려줍니다) */
const bytea = customType<{ data: Buffer; driverData: string | Buffer }>({
  dataType: () => "bytea",
  toDriver: (value) => `\\x${value.toString("hex")}`,
  fromDriver: (value) =>
    Buffer.isBuffer(value)
      ? value
      : Buffer.from(String(value).replace(/^\\x/, ""), "hex"),
});

/** 관리 페이지에서 올린 이미지 (글 썸네일). /media/<id> 로 보여 줍니다. */
export const images = pgTable("images", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  mimeType: text("mime_type").notNull(),
  data: bytea().notNull(),
  byteSize: integer("byte_size").notNull(),
  width: integer(),
  height: integer(),
  /** 올릴 때의 원래 파일 이름 (참고용) */
  originalName: text("original_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * 방문 기록 (대시보드 통계용).
 * IP·브라우저 정보를 그대로 저장하지 않고, 하루마다 바뀌는 해시(visitorHash)만 남깁니다.
 */
export const pageViews = pgTable(
  "page_views",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    path: text().notNull(),
    /** 글 페이지면 글 id */
    postId: integer("post_id").references(() => posts.id, { onDelete: "set null" }),
    visitorHash: text("visitor_hash").notNull(),
    /** 어디서 들어왔는지 (호스트 이름만) */
    referrer: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("page_views_created_idx").on(t.createdAt),
    index("page_views_visitor_path_created_idx").on(t.visitorHash, t.path, t.createdAt),
    index("page_views_post_idx").on(t.postId, t.createdAt),
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
