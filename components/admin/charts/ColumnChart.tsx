"use client";

import { useState } from "react";
import { formatNumber, niceTicks } from "./format";
import { useWidth } from "./useWidth";

export type Column = { label: string; tick: string; value: number };

const HEIGHT = 180;
const PAD = { top: 20, right: 8, bottom: 28, left: 32 };
const MAX_BAR = 24;

/** 세로 막대 차트 (단일 계열). 막대마다 툴팁, 가장 큰 값만 막대 위에 직접 표시 */
export default function ColumnChart({
  columns,
  valueName,
  ariaLabel,
}: {
  columns: Column[];
  valueName: string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const innerW = Math.max(10, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const ticks = niceTicks(Math.max(...columns.map((c) => c.value), 0));
  const yMax = ticks[ticks.length - 1] || 1;
  const slot = innerW / columns.length;
  const barW = Math.min(MAX_BAR, slot * 0.6);
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;
  const maxIdx = columns.reduce((m, c, i) => (c.value > columns[m].value ? i : m), 0);
  const showEveryTick = slot >= 28;

  /** 위쪽만 4px 둥근 막대 (바닥은 각지게) */
  function barPath(cx: number, v: number) {
    const top = y(v);
    const h = PAD.top + innerH - top;
    if (h <= 0) return "";
    const r = Math.min(4, h, barW / 2);
    const l = cx - barW / 2;
    const rr = l + barW;
    const b = PAD.top + innerH;
    return `M${l},${b}V${top + r}Q${l},${top} ${l + r},${top}H${rr - r}Q${rr},${top} ${rr},${top + r}V${b}Z`;
  }

  const a = active === null ? null : columns[active];

  return (
    <div
      ref={ref}
      className="viz-chart"
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") setActive((i) => Math.min(columns.length - 1, (i ?? -1) + 1));
        else if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? columns.length) - 1));
        else if (e.key === "Escape") setActive(null);
        else return;
        e.preventDefault();
      }}
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
        {columns.map((c, i) => {
          const cx = PAD.left + slot * (i + 0.5);
          return (
            <g key={c.label}>
              <path className={`viz-bar${active === i ? " --active" : ""}`} d={barPath(cx, c.value)} />
              {(showEveryTick || i % 2 === columns.length % 2 || i === columns.length - 1) && (
                <text className="viz-tick" x={cx} y={HEIGHT - 8} textAnchor="middle">
                  {c.tick}
                </text>
              )}
              {i === maxIdx && c.value > 0 && active === null && (
                <text className="viz-end-label" x={cx} y={y(c.value) - 6} textAnchor="middle">
                  {formatNumber(c.value)}
                </text>
              )}
              {/* 막대보다 넓은 투명 영역이 툴팁 대상 */}
              <rect
                className="viz-hit"
                x={cx - slot / 2}
                y={PAD.top}
                width={slot}
                height={innerH}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
              />
            </g>
          );
        })}
      </svg>

      {a && active !== null && (
        <div
          className="viz-tooltip"
          style={{
            left: Math.min(Math.max(PAD.left + slot * (active + 0.5), 70), width - 70),
            top: Math.max(0, y(a.value) - 12),
          }}
        >
          <div className="viz-tooltip__title">{a.label}</div>
          <div className="viz-tooltip__row">
            <span className="viz-key --bar" />
            <strong>{formatNumber(a.value)}</strong> {valueName}
          </div>
        </div>
      )}
    </div>
  );
}
