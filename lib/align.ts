/** 글 본문 정렬 (서버·클라이언트 공용) */
export const TEXT_ALIGNS = [
  { value: "left", label: "왼쪽" },
  { value: "center", label: "가운데" },
  { value: "right", label: "오른쪽" },
  { value: "justify", label: "양쪽" },
] as const;

export type TextAlign = (typeof TEXT_ALIGNS)[number]["value"];

export const DEFAULT_TEXT_ALIGN: TextAlign = "left";

export function toTextAlign(value: unknown): TextAlign {
  return TEXT_ALIGNS.some((a) => a.value === value) ? (value as TextAlign) : DEFAULT_TEXT_ALIGN;
}

/** 본문에 붙일 클래스 (왼쪽 정렬은 기본이라 클래스 없음) */
export function alignClass(align: string | null | undefined): string {
  const a = toTextAlign(align);
  return a === "left" ? "" : ` --align-${a}`;
}
