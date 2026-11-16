"use client";

import { type KeyboardEvent, type PointerEvent, useState } from "react";
import { formatNumber, niceTicks } from "./format";
import { useWidth } from "./useWidth";

export type LinePoint = {
  /** 툴팁 제목 (예: "11월 16일 (월)") */
  label: string;
  /** x축 눈금 글자 (예: "11/16") */
  tick: string;
  value: number;
  /** 툴팁에 함께 보여 줄 다른 값들 (같은 축에 그리지 않음) */
  extra?: { name: string; value: number }[];
};

const HEIGHT = 200;
const PAD = { top: 16, right: 40, bottom: 28, left: 40 };

/** 단일 계열 꺾은선(+옅은 면) 차트. 포인터를 따라가는 세로선과 툴팁, 키보드 이동 지원 */
export default function LineChart({
  points,
  valueName,
  ariaLabel,
}: {
  points: LinePoint[];
  valueName: string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const innerW = Math.max(10, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const ticks = niceTicks(Math.max(...points.map((p) => p.value), 0));
  const yMax = ticks[ticks.length - 1] || 1;
  const x = (i: number) => PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
  const area = `${line}L${x(points.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;

  // x축 글자는 처음·가운데·끝만 (겹치지 않게)
  const tickIdx = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  const last = points.length - 1;

  function onMove(e: PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - box.left) / box.width;
    setActive(Math.max(0, Math.min(last, Math.round(ratio * last))));
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") setActive((i) => Math.min(last, (i ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? last + 1) - 1));
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  }

  const a = active === null ? null : points[active];

  return (
    <div
      ref={ref}
      className="viz-chart"
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onKeyDown={onKey}
      onBlur={() => setActive(null)}
    >
      <svg width={width} height={HEIGHT} aria-hidden="true">
        {ticks.map((t) => (
          <g key={t}>
            <line className="viz-grid" x1={PAD.left} x2={PAD.left + innerW} y1={y(t)} y2={y(t)} />
            <text className="viz-tick" x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
              {formatNumber(t)}
            </text>
          </g>
        ))}
        {tickIdx.map((i) => (
          <text
            key={i}
            className="viz-tick"
            x={x(i)}
            y={HEIGHT - 8}
            textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
          >
            {points[i].tick}
          </text>
        ))}

        <path className="viz-area" d={area} />
        <path className="viz-line" d={line} />

        {/* 끝 값만 직접 표시 */}
        {active === null && points.length > 0 && (
          <g>
            <circle className="viz-dot" cx={x(last)} cy={y(points[last].value)} r={4} />
            <text className="viz-end-label" x={x(last) + 8} y={y(points[last].value)} dy="0.32em">
              {formatNumber(points[last].value)}
            </text>
          </g>
        )}

        {a && active !== null && (
          <g>
            <line className="viz-crosshair" x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + innerH} />
            <circle className="viz-dot" cx={x(active)} cy={y(a.value)} r={4} />
          </g>
        )}

        <rect
          className="viz-hit"
          x={PAD.left - 8}
          y={0}
          width={innerW + 16}
          height={HEIGHT}
          onPointerMove={onMove}
          onPointerLeave={() => setActive(null)}
        />
      </svg>

      {a && active !== null && (
        <div
          className="viz-tooltip"
          style={{
            left: Math.min(Math.max(x(active), 80), width - 80),
            top: Math.max(0, y(a.value) - 12),
          }}
        >
          <div className="viz-tooltip__title">{a.label}</div>
          <div className="viz-tooltip__row">
            <span className="viz-key --line" />
            <strong>{formatNumber(a.value)}</strong> {valueName}
          </div>
          {a.extra?.map((e) => (
            <div key={e.name} className="viz-tooltip__row --muted">
              <strong>{formatNumber(e.value)}</strong> {e.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
