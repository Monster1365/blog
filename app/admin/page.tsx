import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import AdminLoading from "@/components/admin/AdminLoading";
import ColumnChart from "@/components/admin/charts/ColumnChart";
import DataTable from "@/components/admin/charts/DataTable";
import LineChart from "@/components/admin/charts/LineChart";
import RankedBars from "@/components/admin/charts/RankedBars";
import StatTile from "@/components/admin/charts/StatTile";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getOverview, getTraffic } from "@/lib/stats";

export const metadata: Metadata = { title: "대시보드" };

const RANGES = [7, 30, 90] as const;

const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
const dayTick = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
const monthLabel = (ym: string) => `${ym.slice(0, 4)}년 ${Number(ym.slice(5, 7))}월`;

export default function DashboardPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  await connection(); // 통계는 현재 시각 기준이라 항상 요청 시점에 계산
  await requireAdmin();
  const { range } = await searchParams;
  const days = RANGES.find((r) => String(r) === range) ?? 30;

  const [overview, traffic] = await Promise.all([getOverview(), getTraffic(days)]);
  const { posts, cadence } = overview;
  const avgVisitors = Math.round((traffic.visitors / days) * 10) / 10;

  return (
    <div className="dashboard">
      {/* 전체 기간 */}
      <section aria-labelledby="dash-content">
        <h2 id="dash-content" className="dashboard__heading">
          콘텐츠 <span>전체 기간</span>
        </h2>
        <div className="stat-row">
          <StatTile label="공개 글" value={posts.published} unit="개" note={`숨긴 글 ${posts.hidden}개`} />
          <StatTile label="댓글" value={overview.comments.total} unit="개" />
          <StatTile label="태그" value={overview.tags} unit="개" />
          <StatTile
            label="마지막 글"
            value={cadence.daysSinceLast === null ? "—" : cadence.daysSinceLast === 0 ? "오늘" : cadence.daysSinceLast}
            unit={cadence.daysSinceLast ? "일 전" : undefined}
            note={cadence.lastPublishedAt ? formatDate(cadence.lastPublishedAt) : "아직 글이 없습니다"}
          />
          <StatTile
            label="평균 발행 간격"
            value={cadence.avgIntervalDays ?? "—"}
            unit={cadence.avgIntervalDays !== null ? "일" : undefined}
            note={cadence.avgIntervalDays === null ? "공개 글이 2개 이상이면 계산합니다" : `최근 90일 ${cadence.last90Days}개 발행`}
          />
        </div>

        <div className="viz-card">
          <h3 className="viz-card__title">월별 발행 글 수</h3>
          <p className="viz-card__subtitle">최근 12개월 · 공개 글 기준</p>
          <ColumnChart
            columns={overview.monthly.map((m) => ({
              label: monthLabel(m.month),
              tick: `${Number(m.month.slice(5, 7))}월`,
              value: m.count,
            }))}
            valueName="개 발행"
            ariaLabel={`최근 12개월 월별 발행 글 수. ${overview.monthly
              .filter((m) => m.count > 0)
              .map((m) => `${monthLabel(m.month)} ${m.count}개`)
              .join(", ") || "발행한 글 없음"}`}
          />
          <DataTable
            caption="월별 발행 글 수"
            headers={["월", "발행 글"]}
            rows={overview.monthly.map((m) => [monthLabel(m.month), m.count])}
          />
        </div>
      </section>

      {/* 기간별 방문 */}
      <section aria-labelledby="dash-traffic">
        <div className="dashboard__toolbar">
          <h2 id="dash-traffic" className="dashboard__heading">
            방문 <span>최근 {days}일</span>
          </h2>
          <nav className="range-picker" aria-label="기간">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin?range=${r}`}
                className={`range-picker__item${r === days ? " --active" : ""}`}
                aria-current={r === days ? "true" : undefined}
              >
                {r}일
              </Link>
            ))}
          </nav>
        </div>

        <div className="stat-row">
          <StatTile hero label="방문자" value={traffic.visitors} unit="명" previous={traffic.previous.visitors} />
          <StatTile label="페이지뷰" value={traffic.views} unit="회" previous={traffic.previous.views} />
          <StatTile label="하루 평균 방문자" value={avgVisitors} unit="명" />
          <StatTile label="새 댓글" value={traffic.comments} unit="개" previous={traffic.previous.comments} />
        </div>
        <p className="dashboard__footnote">
          방문자는 날마다 한 번씩 센 순방문자의 합입니다. 봇과 관리자 본인의 방문, 같은 사람이 30분 안에 같은
          페이지를 다시 본 것은 세지 않습니다.
        </p>

        <div className="viz-card">
          <h3 className="viz-card__title">일별 방문자</h3>
          <p className="viz-card__subtitle">점에 마우스를 올리거나 ←/→ 키로 날짜별 방문자·페이지뷰를 볼 수 있습니다.</p>
          <LineChart
            points={traffic.daily.map((d) => ({
              label: dayLabel(d.day),
              tick: dayTick(d.day),
              value: d.visitors,
              extra: [{ name: "페이지뷰", value: d.views }],
            }))}
            valueName="명 방문"
            ariaLabel={`최근 ${days}일 일별 방문자. 합계 ${traffic.visitors}명, 페이지뷰 ${traffic.views}회.`}
          />
          <DataTable
            caption="일별 방문자와 페이지뷰"
            headers={["날짜", "방문자", "페이지뷰"]}
            rows={[...traffic.daily].reverse().map((d) => [dayLabel(d.day), d.visitors, d.views])}
          />
        </div>

        <div className="viz-grid-2">
          <div className="viz-card">
            <h3 className="viz-card__title">인기 글</h3>
            <p className="viz-card__subtitle">페이지뷰 순 · 상위 5개</p>
            <RankedBars
              unit="회"
              empty="아직 기록된 방문이 없습니다."
              rows={traffic.topPosts.map((p) => ({
                key: p.slug,
                name: (
                  <Link href={`/${p.slug}`} target="_blank">
                    {p.title}
                  </Link>
                ),
                value: p.views,
                detail: `${p.visitors}명`,
              }))}
            />
          </div>
          <div className="viz-card">
            <h3 className="viz-card__title">유입 경로</h3>
            <p className="viz-card__subtitle">
              다른 사이트에서 들어온 페이지뷰 · 직접 방문 {traffic.directViews.toLocaleString("ko-KR")}회
            </p>
            <RankedBars
              unit="회"
              empty="다른 사이트에서 들어온 기록이 없습니다."
              rows={traffic.referrers.map((r) => ({ key: r.host, name: r.host, value: r.views }))}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
