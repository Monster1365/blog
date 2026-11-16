import type { ReactNode } from "react";
import { formatNumber } from "./format";

/**
 * 순위 막대 목록: 이름 · 막대 · 값을 한 줄씩 (큰 값부터, 한 가지 색).
 * 값이 모두 글자로 적혀 있어 툴팁 없이도 읽을 수 있습니다.
 */
export default function RankedBars({
  rows,
  unit,
  empty,
}: {
  rows: { key: string; name: ReactNode; value: number; detail?: string }[];
  unit: string;
  empty: string;
}) {
  if (rows.length === 0) return <p className="viz-empty">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ol className="ranked-bars">
      {rows.map((r) => (
        <li key={r.key} className="ranked-bars__row">
          <div className="ranked-bars__name">{r.name}</div>
          <div className="ranked-bars__track" aria-hidden="true">
            <div className="ranked-bars__bar" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </div>
          <div className="ranked-bars__value">
            {formatNumber(r.value)}
            <span> {unit}</span>
            {r.detail && <span className="ranked-bars__detail"> · {r.detail}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
