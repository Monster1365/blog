import { formatNumber } from "./format";

/**
 * 숫자 타일: 이름 · 값 · (선택) 이전 기간 대비 변화.
 * 변화 색은 방향 × 좋은 쪽인지로 정합니다 (방문자·댓글은 늘면 좋음).
 */
export default function StatTile({
  label,
  value,
  unit,
  previous,
  note,
  hero = false,
}: {
  label: string;
  value: number | string;
  unit?: string;
  /** 이전 기간 값. 있으면 변화(+n, -n)를 보여 줍니다. */
  previous?: number;
  note?: string;
  hero?: boolean;
}) {
  const delta = typeof value === "number" && previous !== undefined ? value - previous : null;

  return (
    <div className={`stat-tile${hero ? " --hero" : ""}`}>
      <div className="stat-tile__label">{label}</div>
      <div className="stat-tile__value">
        {typeof value === "number" ? formatNumber(value) : value}
        {unit && <span className="stat-tile__unit">{unit}</span>}
      </div>
      {delta !== null ? (
        <div className={`stat-tile__delta ${delta > 0 ? "--up" : delta < 0 ? "--down" : "--flat"}`}>
          <span aria-hidden="true">{delta > 0 ? "▲" : delta < 0 ? "▼" : "–"}</span>{" "}
          {delta === 0 ? "변화 없음" : `${delta > 0 ? "+" : ""}${formatNumber(delta)}`}
          <span className="stat-tile__vs"> 이전 같은 기간 대비</span>
        </div>
      ) : (
        note && <div className="stat-tile__note">{note}</div>
      )}
    </div>
  );
}
