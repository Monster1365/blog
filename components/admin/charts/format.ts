/** 차트 공용 숫자 도우미 (서버·클라이언트 모두에서 사용) */

/** 0부터 시작하는 깔끔한 눈금 최댓값과 눈금들 (예: 7 → [0, 5, 10]) */
export function niceTicks(max: number, count = 3): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / (count - 1);
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? rough;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001 || ticks.length < 2; v += step) ticks.push(Math.round(v));
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

export const formatNumber = (n: number) =>
  n >= 10_000 ? new Intl.NumberFormat("ko-KR", { notation: "compact" }).format(n) : n.toLocaleString("ko-KR");
