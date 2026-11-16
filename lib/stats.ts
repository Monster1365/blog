import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/** 대시보드 통계 (관리 페이지 전용, 캐시하지 않음). 날짜는 모두 한국 시간 기준입니다. */

const TODAY = sql`(now() AT TIME ZONE 'Asia/Seoul')::date`;
/** 오늘을 포함한 최근 N일의 시작 시각 */
const windowStart = (days: number, offsetDays = 0) =>
  sql`((${TODAY} - (${days + offsetDays - 1})::int)::timestamp AT TIME ZONE 'Asia/Seoul')`;

export type Overview = {
  posts: { total: number; published: number; hidden: number };
  comments: { total: number };
  tags: number;
  images: number;
  cadence: {
    lastPublishedAt: string | null;
    daysSinceLast: number | null;
    /** 공개 글 사이의 평균 간격 (일). 글이 2개 미만이면 null */
    avgIntervalDays: number | null;
    last90Days: number;
  };
  monthly: { month: string; count: number }[];
};

export async function getOverview(): Promise<Overview> {
  const [counts, cadence, monthly] = await Promise.all([
    db.execute<{
      total: number; published: number; comments: number; tags: number; images: number;
    }>(sql`
      SELECT
        (SELECT count(*)::int FROM posts) AS total,
        (SELECT count(*)::int FROM posts WHERE published) AS published,
        (SELECT count(*)::int FROM comments) AS comments,
        (SELECT count(DISTINCT t)::int FROM posts, unnest(categories) AS t) AS tags,
        (SELECT count(*)::int FROM images) AS images
    `),
    db.execute<{ last: string | null; first: string | null; n: number; last90: number }>(sql`
      SELECT max(published_at)::text AS last,
             min(published_at)::text AS first,
             count(*)::int AS n,
             count(*) FILTER (WHERE published_at >= now() - interval '90 days')::int AS last90
      FROM posts WHERE published AND published_at IS NOT NULL
    `),
    db.execute<{ month: string; count: number }>(sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', now() AT TIME ZONE 'Asia/Seoul') - interval '11 months',
          date_trunc('month', now() AT TIME ZONE 'Asia/Seoul'),
          interval '1 month'
        ) AS m
      )
      SELECT to_char(m, 'YYYY-MM') AS month,
             (SELECT count(*)::int FROM posts p
               WHERE p.published
                 AND date_trunc('month', p.published_at AT TIME ZONE 'Asia/Seoul') = months.m) AS count
      FROM months ORDER BY m
    `),
  ]);

  const c = counts.rows[0];
  const cd = cadence.rows[0];
  const last = cd.last ? new Date(cd.last) : null;
  const first = cd.first ? new Date(cd.first) : null;
  const DAY = 24 * 60 * 60 * 1000;

  return {
    posts: { total: c.total, published: c.published, hidden: c.total - c.published },
    comments: { total: c.comments },
    tags: c.tags,
    images: c.images,
    cadence: {
      lastPublishedAt: last?.toISOString() ?? null,
      daysSinceLast: last ? Math.floor((Date.now() - last.getTime()) / DAY) : null,
      avgIntervalDays:
        last && first && cd.n >= 2
          ? Math.round(((last.getTime() - first.getTime()) / DAY / (cd.n - 1)) * 10) / 10
          : null,
      last90Days: cd.last90,
    },
    monthly: monthly.rows,
  };
}

export type Traffic = {
  days: number;
  /** 기간 방문자 = 일별 순방문자의 합 (방문자 해시가 날마다 바뀌므로) */
  visitors: number;
  views: number;
  comments: number;
  previous: { visitors: number; views: number; comments: number };
  daily: { day: string; visitors: number; views: number }[];
  topPosts: { slug: string; title: string; views: number; visitors: number }[];
  referrers: { host: string; views: number }[];
  directViews: number;
};

export async function getTraffic(days: number): Promise<Traffic> {
  const start = windowStart(days);
  const prevStart = windowStart(days, days);

  const [daily, prev, comments, topPosts, referrers] = await Promise.all([
    db.execute<{ day: string; visitors: number; views: number }>(sql`
      WITH days AS (
        SELECT generate_series(${TODAY} - (${days - 1})::int, ${TODAY}, interval '1 day')::date AS day
      ),
      v AS (
        SELECT (created_at AT TIME ZONE 'Asia/Seoul')::date AS day,
               count(*)::int AS views,
               count(DISTINCT visitor_hash)::int AS visitors
        FROM page_views WHERE created_at >= ${start}
        GROUP BY 1
      )
      SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
             coalesce(v.visitors, 0) AS visitors,
             coalesce(v.views, 0) AS views
      FROM days LEFT JOIN v ON v.day = days.day
      ORDER BY days.day
    `),
    db.execute<{ visitors: number; views: number }>(sql`
      SELECT coalesce(sum(visitors), 0)::int AS visitors, coalesce(sum(views), 0)::int AS views FROM (
        SELECT count(DISTINCT visitor_hash) AS visitors, count(*) AS views
        FROM page_views
        WHERE created_at >= ${prevStart} AND created_at < ${start}
        GROUP BY (created_at AT TIME ZONE 'Asia/Seoul')::date
      ) d
    `),
    db.execute<{ current: number; previous: number }>(sql`
      SELECT count(*) FILTER (WHERE created_at >= ${start})::int AS current,
             count(*) FILTER (WHERE created_at >= ${prevStart} AND created_at < ${start})::int AS previous
      FROM comments WHERE created_at >= ${prevStart}
    `),
    db.execute<{ slug: string; title: string; views: number; visitors: number }>(sql`
      SELECT p.slug, p.title, count(*)::int AS views, count(DISTINCT v.visitor_hash)::int AS visitors
      FROM page_views v JOIN posts p ON p.id = v.post_id
      WHERE v.created_at >= ${start}
      GROUP BY p.id ORDER BY views DESC, p.id DESC LIMIT 5
    `),
    db.execute<{ host: string | null; views: number }>(sql`
      SELECT referrer AS host, count(*)::int AS views
      FROM page_views WHERE created_at >= ${start}
      GROUP BY referrer ORDER BY views DESC
    `),
  ]);

  const sum = (key: "visitors" | "views") => daily.rows.reduce((n, d) => n + d[key], 0);
  const refRows = referrers.rows;

  return {
    days,
    visitors: sum("visitors"),
    views: sum("views"),
    comments: comments.rows[0].current,
    previous: { ...prev.rows[0], comments: comments.rows[0].previous },
    daily: daily.rows,
    topPosts: topPosts.rows,
    referrers: refRows
      .filter((r): r is { host: string; views: number } => Boolean(r.host))
      .slice(0, 5),
    directViews: refRows.find((r) => !r.host)?.views ?? 0,
  };
}
